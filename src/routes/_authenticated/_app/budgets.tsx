import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LoadingBlock, PageHeader, Panel, ProgressBar, StatCard } from "@/components/ui-bits";
import { useBudgets, useCurrency, useDeleteRow, useExpenses, useSaveBudget } from "@/lib/data";
import { EXPENSE_CATEGORIES, MONTHS, budgetStatus, formatMoney, inMonth, sum } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Smart Ledger" }, { name: "description", content: "Set and track monthly category budgets." }, { property: "og:title", content: "Budgets — Smart Ledger" }, { property: "og:description", content: "Set and track monthly category budgets." }] }),
  component: Budgets,
});

function Budgets() {
  const cur = useCurrency();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState<string>("Food");
  const [amount, setAmount] = useState("");
  const bud = useBudgets();
  const ex = useExpenses();
  const save = useSaveBudget();
  const del = useDeleteRow("budgets");

  const list = (bud.data ?? []).filter((b) => b.month === month && b.year === year);
  const monthEx = (ex.data ?? []).filter((e) => inMonth(e.date, month, year));
  const totalBudget = sum(list);
  const totalSpent = sum(monthEx.filter((e) => list.some((b) => b.category === e.category)));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (!a || a <= 0) return toast.error("Enter a budget amount greater than 0.");
    try {
      await save.mutateAsync({ category, amount: a, month, year });
      toast.success(`${category} budget saved`);
      setAmount("");
    } catch (err) { toast.error((err as Error).message); }
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" subtitle="Plan category limits for each month." action={
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}><SelectTrigger className="w-24" aria-label="Month"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}><SelectTrigger className="w-24" aria-label="Year"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
        </div>
      } />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total budget" value={formatMoney(totalBudget, cur)} icon={PiggyBank} />
        <StatCard label="Spent" value={formatMoney(totalSpent, cur)} icon={PiggyBank} tone="expense" />
        <StatCard label="Remaining" value={formatMoney(totalBudget - totalSpent, cur)} icon={PiggyBank} tone="income" />
      </div>

      <Panel title="Set a category budget">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ba">Amount</Label><Input id="ba" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="6000" /></div>
          <Button type="submit" disabled={save.isPending} className="rounded-xl">Save budget</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Saving an existing category updates its amount. You'll get an alert at 80% and when a budget is exceeded.</p>
      </Panel>

      <Panel title={`${MONTHS[month - 1]} ${year}`}>
        {bud.isLoading ? <LoadingBlock /> : list.length === 0 ? (
          <EmptyState icon={PiggyBank} title="No budgets for this month" text="Add a category budget above to start tracking." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((b) => {
              const spent = sum(monthEx.filter((e) => e.category === b.category));
              const pct = (spent / b.amount) * 100;
              const st = budgetStatus(pct);
              return (
                <div key={b.id} className="rounded-2xl border border-border bg-background/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{b.category}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st === "Exceeded" ? "bg-destructive/15 text-destructive" : st === "Near Limit" ? "bg-warning/20 text-warning" : "bg-success/15 text-success")}>{st}</span>
                      <button aria-label="Delete budget" onClick={() => del.mutate(b.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-3"><ProgressBar pct={pct} /></div>
                  <div className="mt-3 grid grid-cols-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-medium">{formatMoney(b.amount, cur)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Spent</p><p className="font-medium">{formatMoney(spent, cur)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Remaining</p><p className={cn("font-medium", b.amount - spent < 0 && "text-destructive")}>{formatMoney(b.amount - spent, cur)}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
