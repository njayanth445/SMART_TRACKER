import { formatPct } from "@/lib/locale";
import { appLocale } from "@/lib/locale";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PiggyBank, Percent, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingBlock, PageHeader, Panel, ProgressBar, StatCard } from "@/components/ui-bits";
import { CategoryPie, Gauge, IncomeExpenseBars, SimpleBars, TrendArea } from "@/components/Charts";
import { TxList, type TxRow } from "@/components/TxList";
import { useBudgets, useCurrency, useExpenses, useIncome, useProfile } from "@/lib/data";
import { budgetStatus, byCategory, formatMoney, inMonth, monthlySeries, savingsRate, sum } from "@/lib/finance";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Smart Ledger" }, { name: "description", content: "Your monthly money overview." }, { property: "og:title", content: "Dashboard — Smart Ledger" }, { property: "og:description", content: "Your monthly money overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const cur = useCurrency();
  const { data: profile } = useProfile();
  const ex = useExpenses();
  const inc = useIncome();
  const bud = useBudgets();
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();

  const monthEx = (ex.data ?? []).filter((r) => inMonth(r.date, m, y));
  const monthInc = (inc.data ?? []).filter((r) => inMonth(r.date, m, y));
  const totalInc = sum(monthInc), totalEx = sum(monthEx);
  const net = totalInc - totalEx;
  const rate = savingsRate(totalInc, totalEx);
  const cats = byCategory(monthEx);
  const series = monthlySeries(inc.data ?? [], ex.data ?? [], 6);
  const budgets = (bud.data ?? []).filter((b) => b.month === m && b.year === y);

  const recent: TxRow[] = [
    ...(ex.data ?? []).map((r) => ({ id: r.id, kind: "expense" as const, title: r.description, sub: r.category, amount: r.amount, date: r.date, c: r.created_at })),
    ...(inc.data ?? []).map((r) => ({ id: r.id, kind: "income" as const, title: r.description || r.source, sub: r.source, amount: r.amount, date: r.date, c: r.created_at })),
  ].sort((a, b) => (b.date + b.c).localeCompare(a.date + a.c)).slice(0, 6);

  const budgetTotal = sum(budgets);
  const budgetSpent = sum(monthEx.filter((e) => budgets.some((b) => b.category === e.category)));
  const daysIn = new Date(y, m, 0).getDate();
  const daily = Array.from({ length: now.getDate() }, (_, i) => {
    const d = `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return { x: String(i + 1), value: sum(monthEx.filter((e) => e.date === d)) };
  });
  const projected = now.getDate() ? (totalEx / now.getDate()) * daysIn : 0;
  const loading = ex.isLoading || inc.isLoading;
  const monthName = now.toLocaleDateString(appLocale(), { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t(profile?.language, "greeting")}, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`}
        subtitle={`Here's your money in ${monthName}.`}
        action={<div className="hidden gap-2 sm:flex">
          <Button asChild variant="outline" className="rounded-xl"><Link to="/income/add"><Plus className="mr-1 h-4 w-4" />Income</Link></Button>
          <Button asChild className="rounded-xl"><Link to="/expenses/add"><Plus className="mr-1 h-4 w-4" />Expense</Link></Button>
        </div>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total income" value={formatMoney(totalInc, cur)} icon={TrendingUp} tone="income" />
        <StatCard label="Total expense" value={formatMoney(totalEx, cur)} icon={TrendingDown} tone="expense" />
        <StatCard label="Net savings" value={formatMoney(net, cur)} icon={Wallet} tone="primary" />
        <StatCard label="Savings rate" value={formatPct(rate)} icon={Percent} tone="accent" hint={totalInc ? undefined : "Add income to calculate"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Savings rate"><Gauge pct={Math.max(0, rate)} label="of income saved" sub={totalInc ? formatMoney(net, cur) + " saved" : "Add income to calculate"} /></Panel>
        <Panel title="Budget used"><Gauge pct={budgetTotal ? (budgetSpent / budgetTotal) * 100 : 0} label={budgetTotal ? `${formatMoney(budgetSpent, cur)} of ${formatMoney(budgetTotal, cur)}` : "No budgets set"} /></Panel>
        <Panel title="Month progress"><Gauge pct={(now.getDate() / daysIn) * 100} label={`Day ${now.getDate()} of ${daysIn}`} sub={`Projected spend ${formatMoney(projected, cur)}`} /></Panel>
      </div>

      <Panel title="Daily spending this month">
        {loading ? <LoadingBlock /> : <SimpleBars data={daily} currency={cur} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Expense by category" className="lg:col-span-2">
          {loading ? <LoadingBlock /> : cats.length ? <CategoryPie data={cats} currency={cur} /> : <EmptyState icon={PiggyBank} title="No expenses this month" text="Add an expense to see where your money goes." />}
        </Panel>
        <Panel title="Income vs expense" className="lg:col-span-3">
          {loading ? <LoadingBlock /> : <IncomeExpenseBars data={series} currency={cur} />}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Monthly spending trend" className="lg:col-span-3">
          {loading ? <LoadingBlock /> : <TrendArea data={series} dataKey="expense" currency={cur} />}
        </Panel>
        <Panel title="Budget usage" className="lg:col-span-2" action={<Link to="/budgets" className="text-sm text-primary">Manage</Link>}>
          {budgets.length === 0 ? (
            <EmptyState icon={PiggyBank} title="No budgets yet" text="Set category budgets to track your limits." action={<Button asChild size="sm" className="rounded-xl"><Link to="/budgets">Set budget</Link></Button>} />
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = sum(monthEx.filter((e) => e.category === b.category));
                const pct = (spent / b.amount) * 100;
                const st = budgetStatus(pct);
                return (
                  <div key={b.id}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{b.category}</span><span className={st === "Exceeded" ? "text-destructive" : st === "Near Limit" ? "text-warning" : "text-muted-foreground"}>{Math.round(pct)}%</span></div>
                    <ProgressBar pct={pct} />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent transactions" action={<Link to="/expenses" className="text-sm text-primary">View all</Link>}>
        {loading ? <LoadingBlock /> : recent.length ? <TxList rows={recent} currency={cur} /> : (
          <EmptyState icon={Wallet} title="No transactions yet" text="Start by adding your income or first expense." action={<Button asChild className="rounded-xl"><Link to="/expenses/add">Add expense</Link></Button>} />
        )}
      </Panel>
    </div>
  );
}
