import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS, isFutureDate, todayISO, type Expense, type Income } from "@/lib/finance";
import { useSaveExpense, useSaveIncome } from "@/lib/data";

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

export function ExpenseForm({ initial, onDone }: { initial?: Expense; onDone: () => void }) {
  const save = useSaveExpense();
  const [f, setF] = useState({
    amount: initial ? String(initial.amount) : "",
    description: initial?.description ?? "",
    category: initial?.category ?? "Food",
    date: initial?.date ?? todayISO(),
    payment_method: initial?.payment_method ?? "UPI",
    notes: initial?.notes ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0) return setErr("Enter an amount greater than 0.");
    if (!f.description.trim()) return setErr("Add a short description.");
    if (!f.date) return setErr("Pick a date.");
    if (isFutureDate(f.date)) return setErr("Future expense dates are not allowed.");
    setErr(null);
    try {
      await save.mutateAsync({ id: initial?.id, amount, description: f.description.trim(), category: f.category, date: f.date, payment_method: f.payment_method, notes: f.notes.trim() || null });
      toast.success(initial ? "Expense updated" : "Expense added");
      onDone();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" htmlFor="amt"><Input id="amt" type="number" inputMode="decimal" step="0.01" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="font-display text-lg" /></Field>
        <Field label="Date" htmlFor="dt"><Input id="dt" type="date" max={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      <Field label="Description" htmlFor="desc"><Input id="desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. Groceries at market" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </Field>
        <Field label="Payment method">
          <Select value={f.payment_method} onValueChange={(v) => setF({ ...f, payment_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor="notes"><Textarea id="notes" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      {err && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={save.isPending} className="w-full rounded-xl">{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initial ? "Save changes" : "Add expense"}</Button>
    </form>
  );
}

export function IncomeForm({ initial, onDone }: { initial?: Income; onDone: () => void }) {
  const save = useSaveIncome();
  const [f, setF] = useState({
    amount: initial ? String(initial.amount) : "",
    source: initial?.source ?? "Salary",
    description: initial?.description ?? "",
    date: initial?.date ?? todayISO(),
    notes: initial?.notes ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0) return setErr("Enter an amount greater than 0.");
    if (!f.date) return setErr("Pick a date.");
    if (isFutureDate(f.date)) return setErr("Future income dates are not allowed.");
    setErr(null);
    try {
      await save.mutateAsync({ id: initial?.id, amount, source: f.source, description: f.description.trim() || null, date: f.date, notes: f.notes.trim() || null });
      toast.success(initial ? "Income updated" : "Income added");
      onDone();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" htmlFor="iamt"><Input id="iamt" type="number" inputMode="decimal" step="0.01" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="font-display text-lg" /></Field>
        <Field label="Date" htmlFor="idt"><Input id="idt" type="date" max={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      <Field label="Source">
        <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INCOME_SOURCES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </Field>
      <Field label="Description (optional)" htmlFor="idesc"><Input id="idesc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="e.g. September salary" /></Field>
      <Field label="Notes (optional)" htmlFor="inotes"><Textarea id="inotes" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      {err && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={save.isPending} className="w-full rounded-xl">{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initial ? "Save changes" : "Add income"}</Button>
    </form>
  );
}
