import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BUDGET_ALERT_THRESHOLD,
  inMonth,
  sum,
  type Budget,
  type Expense,
  type Income,
} from "./finance";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  monthly_income: number | null;
  currency: string;
  language: string;
  theme: string;
  onboarded: boolean;
};

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Expense[];
    },
  });
}

export function useIncome() {
  return useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      const { data, error } = await supabase.from("income").select("*").order("date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Income[];
    },
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*");
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Budget[];
    },
  });
}

export type Notification = { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string };

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });
}

export function useCurrency() {
  const { data } = useProfile();
  return data?.currency ?? "INR";
}

function friendly(e: unknown) {
  const msg = (e as { message?: string })?.message ?? "Something went wrong";
  if (msg.includes("Future dates")) return new Error("Future expense dates are not allowed.");
  return new Error(msg);
}

/** Check whether this expense pushed its category budget past a threshold; notify once per crossing. */
async function checkBudgetAlert(category: string, date: string) {
  const [y = 0, m = 0] = date.split("-").map(Number);
  const { data: budget } = await supabase.from("budgets").select("*").eq("category", category).eq("month", m).eq("year", y).maybeSingle();
  if (!budget) return;
  const { data: rows } = await supabase.from("expenses").select("amount,date").eq("category", category).gte("date", `${y}-${String(m).padStart(2, "0")}-01`);
  const spent = sum((rows ?? []).filter((r) => inMonth(r.date, m, y)).map((r) => ({ amount: Number(r.amount) })));
  const pct = (spent / Number(budget.amount)) * 100;
  let title: string | null = null;
  let message = "";
  let type = "warning";
  if (pct > 100) {
    title = `${category} budget exceeded`;
    message = `🚨 Your ${category} budget has been exceeded (${Math.round(pct)}% used).`;
    type = "danger";
  } else if (pct >= BUDGET_ALERT_THRESHOLD) {
    title = `${category} budget almost reached`;
    message = `⚠ Your ${category} budget is almost reached (${Math.round(pct)}% used).`;
  }
  if (!title) return;
  const monthStart = new Date(y, m - 1, 1).toISOString();
  const { data: existing } = await supabase.from("notifications").select("id").eq("title", title).gte("created_at", monthStart).limit(1);
  if (existing && existing.length) return;
  await supabase.from("notifications").insert({ title, message, type });
}

export function useSaveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Expense, "id" | "created_at"> & { id?: string | undefined }) => {
      const { id, ...rest } = input;
      const res = id ? await supabase.from("expenses").update(rest).eq("id", id) : await supabase.from("expenses").insert(rest);
      if (res.error) throw friendly(res.error);
      await checkBudgetAlert(rest.category, rest.date);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSaveIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Income, "id" | "created_at"> & { id?: string | undefined }) => {
      const { id, ...rest } = input;
      const res = id ? await supabase.from("income").update(rest).eq("id", id) : await supabase.from("income").insert(rest);
      if (res.error) throw friendly(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["income"] }),
  });
}

export function useDeleteRow(table: "expenses" | "income" | "budgets" | "notifications") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw friendly(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: { category: string; amount: number; month: number; year: number }) => {
      const user_id = await uid();
      const { error } = await supabase.from("budgets").upsert({ ...b, user_id }, { onConflict: "user_id,category,month,year" });
      if (error) throw friendly(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const id = await uid();
      const { error } = await supabase.from("profiles").upsert({ id, ...patch });
      if (error) throw friendly(error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
