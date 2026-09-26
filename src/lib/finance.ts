export const EXPENSE_CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Education",
  "Healthcare",
  "Other",
] as const;

export const PAYMENT_METHODS = ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "Other"] as const;

export const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"] as const;

export const CURRENCIES = [
  { code: "INR", label: "₹ INR — Indian Rupee" },
  { code: "USD", label: "$ USD — US Dollar" },
  { code: "EUR", label: "€ EUR — Euro" },
  { code: "GBP", label: "£ GBP — British Pound" },
] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिन्दी" },
] as const;

export const BUDGET_ALERT_THRESHOLD = 80;

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
};
export type Income = {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  notes: string | null;
  created_at: string;
};
export type Budget = { id: string; category: string; amount: number; month: number; year: number };

export function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/** Local date as YYYY-MM-DD (not UTC). */
export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function isFutureDate(date: string) {
  return date > todayISO();
}

export function inMonth(date: string, month: number, year: number) {
  return date.startsWith(`${year}-${String(month).padStart(2, "0")}`);
}

export function sum<T extends { amount: number }>(rows: T[]) {
  return rows.reduce((s, r) => s + Number(r.amount), 0);
}

export function savingsRate(income: number, expense: number) {
  if (income <= 0) return 0;
  return ((income - expense) / income) * 100;
}

export function budgetStatus(pct: number): "Normal" | "Near Limit" | "Exceeded" {
  if (pct > 100) return "Exceeded";
  if (pct >= BUDGET_ALERT_THRESHOLD) return "Near Limit";
  return "Normal";
}

export function byCategory(rows: Expense[]) {
  const map = new Map<string, number>();
  rows.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + Number(r.amount)));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Last N months income vs expense series. */
export function monthlySeries(income: Income[], expenses: Expense[], n = 6) {
  const now = new Date();
  const out: { month: string; income: number; expense: number; savings: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const inc = sum(income.filter((r) => inMonth(r.date, m, y)));
    const exp = sum(expenses.filter((r) => inMonth(r.date, m, y)));
    out.push({ month: `${MONTHS[m - 1]} ${String(y).slice(2)}`, income: inc, expense: exp, savings: inc - exp });
  }
  return out;
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
