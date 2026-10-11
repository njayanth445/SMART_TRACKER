import { formatPct } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Gauge, Minus, PiggyBank, Receipt, TrendingDown, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LoadingBlock, PageHeader, Panel, ProgressBar } from "@/components/ui-bits";
import { CategoryPie, IncomeExpenseBars, PacingLines, RankedBars, TrendArea } from "@/components/Charts";
import { useBudgets, useCurrency, useExpenses, useIncome } from "@/lib/data";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, byCategory, formatMoney, monthlySeries, sum, todayISO } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Smart Ledger" }, { name: "description", content: "An interactive dashboard of your spending, income and budget pacing." }, { property: "og:title", content: "Analytics — Smart Ledger" }, { property: "og:description", content: "An interactive dashboard of your spending, income and budget pacing." }] }),
  component: Analytics,
});

const DAY = 86400000;
const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const shift = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

type PresetId = "7" | "30" | "mtd" | "qtd" | "ytd" | "365" | "custom";
const PRESETS: { id: PresetId; label: string }[] = [
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "mtd", label: "This month" },
  { id: "qtd", label: "This quarter" },
  { id: "ytd", label: "Year to date" },
  { id: "365", label: "Last 12 months" },
  { id: "custom", label: "Custom" },
];

function presetRange(id: PresetId, from: string, to: string) {
  const now = new Date();
  const end = todayISO();
  switch (id) {
    case "mtd": return { start: iso(new Date(now.getFullYear(), now.getMonth(), 1)), end };
    case "qtd": return { start: iso(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)), end };
    case "ytd": return { start: iso(new Date(now.getFullYear(), 0, 1)), end };
    case "custom": return { start: from, end: to };
    default: return { start: shift(Number(id) - 1), end };
  }
}

function Delta({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  if (previous <= 0) return <span className="text-xs text-muted-foreground">No prior period</span>;
  const pct = ((current - previous) / previous) * 100;
  const flat = Math.abs(pct) < 0.5;
  const good = invert ? pct < 0 : pct > 0;
  const Icon = flat ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", flat ? "text-muted-foreground" : good ? "text-income" : "text-expense")}>
      <Icon className="h-3.5 w-3.5" />{flat ? "Flat" : formatPct(Math.abs(pct))}<span className="text-muted-foreground">vs prior</span>
    </span>
  );
}

function Kpi({ label, value, icon: Icon, tone = "primary", footer }: { label: string; value: string; icon: typeof Wallet; tone?: "primary" | "income" | "expense" | "accent"; footer?: React.ReactNode }) {
  const toneCls = { primary: "bg-primary/12 text-primary", income: "bg-income/15 text-income", expense: "bg-expense/15 text-expense", accent: "bg-accent/40 text-accent-foreground" }[tone];
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneCls)}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 truncate font-display text-2xl font-semibold">{value}</p>
      <div className="mt-1.5 min-h-[18px]">{footer}</div>
    </div>
  );
}

function Analytics() {
  const cur = useCurrency();
  const ex = useExpenses();
  const inc = useIncome();
  const budgets = useBudgets();
  const [preset, setPreset] = useState<PresetId>("30");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState(shift(29));
  const [to, setTo] = useState(todayISO());

  const { start, end } = presetRange(preset, from, to);
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY) + 1);
  const prevEnd = iso(new Date(new Date(start).getTime() - DAY));
  const prevStart = iso(new Date(new Date(start).getTime() - days * DAY));

  const match = (r: { category: string; payment_method: string }) => (cat === "all" || r.category === cat) && (method === "all" || r.payment_method === method);
  const allEx = ex.data ?? [];
  const allInc = inc.data ?? [];

  const rows = useMemo(() => allEx.filter((r) => r.date >= start && r.date <= end && match(r)), [allEx, start, end, cat, method]);
  const prevRows = useMemo(() => allEx.filter((r) => r.date >= prevStart && r.date <= prevEnd && match(r)), [allEx, prevStart, prevEnd, cat, method]);
  const incRows = useMemo(() => allInc.filter((r) => r.date >= start && r.date <= end), [allInc, start, end]);
  const prevIncRows = useMemo(() => allInc.filter((r) => r.date >= prevStart && r.date <= prevEnd), [allInc, prevStart, prevEnd]);

  const total = sum(rows), prevTotal = sum(prevRows);
  const income = sum(incRows), prevIncome = sum(prevIncRows);
  const net = income - total, prevNet = prevIncome - prevTotal;
  const rate = income > 0 ? (net / income) * 100 : 0;
  const cats = byCategory(rows);
  const burn = total / days;

  const budgetTotal = useMemo(() => {
    const now = new Date();
    return (budgets.data ?? []).filter((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear() && (cat === "all" || b.category === cat)).reduce((s, b) => s + b.amount, 0);
  }, [budgets.data, cat]);
  const budgetPct = budgetTotal > 0 ? (total / budgetTotal) * 100 : 0;

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.date, (map.get(r.date) ?? 0) + r.amount));
    return [...map.entries()].sort().map(([d, v]) => ({ day: d.slice(5), amount: v }));
  }, [rows]);

  const pacing = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.date, (map.get(r.date) ?? 0) + r.amount));
    const out: { day: string; actual: number; target: number }[] = [];
    let run = 0;
    const perDay = (budgetTotal > 0 ? budgetTotal : total) / days;
    for (let i = 0; i < days; i++) {
      const d = iso(new Date(new Date(start).getTime() + i * DAY));
      run += map.get(d) ?? 0;
      out.push({ day: d.slice(5), actual: Math.round(run), target: Math.round(perDay * (i + 1)) });
    }
    return out;
  }, [rows, start, days, budgetTotal, total]);

  const methods = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.payment_method, (map.get(r.payment_method) ?? 0) + r.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const topTx = useMemo(() => [...rows].sort((a, b) => b.amount - a.amount).slice(0, 8), [rows]);
  const maxTx = topTx[0]?.amount ?? 1;
  const loading = ex.isLoading || inc.isLoading;

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" subtitle="An interactive dashboard of your money." />

      <Panel>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.id} size="sm" variant={preset === p.id ? "default" : "outline"} className="rounded-full text-xs" onClick={() => setPreset(p.id)}>{p.label}</Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={cat} onValueChange={setCat}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={method} onValueChange={setMethod}><SelectTrigger aria-label="Payment method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All methods</SelectItem>{PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            {preset === "custom" && <>
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
              <Input type="date" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} aria-label="To" />
            </>}
          </div>
          <p className="text-xs text-muted-foreground">Showing {start} to {end} · {days} days · compared with {prevStart} to {prevEnd}</p>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total spent" value={formatMoney(total, cur)} icon={TrendingDown} tone="expense" footer={<Delta current={total} previous={prevTotal} invert />} />
        <Kpi label="Income" value={formatMoney(income, cur)} icon={Wallet} tone="income" footer={<Delta current={income} previous={prevIncome} />} />
        <Kpi label="Net cashflow" value={formatMoney(net, cur)} icon={PiggyBank} tone="primary" footer={<Delta current={net} previous={prevNet} />} />
        <Kpi label="Savings rate" value={formatPct(rate)} icon={Gauge} tone="accent" footer={<span className="text-xs text-muted-foreground">of income kept</span>} />
        <Kpi label="Daily burn rate" value={formatMoney(burn, cur)} icon={CalendarDays} footer={<span className="text-xs text-muted-foreground">avg per day</span>} />
        <Kpi label="Transactions" value={String(rows.length)} icon={Receipt} tone="accent" footer={<Delta current={rows.length} previous={prevRows.length} invert />} />
        <Kpi label="Top category" value={cats[0]?.name ?? "—"} icon={BarChart3} tone="income" footer={<span className="text-xs text-muted-foreground">{cats[0] ? `${((cats[0].value / total) * 100).toFixed(0)}% of spend` : "No spending yet"}</span>} />
        <Kpi label="Projected 30 days" value={formatMoney(burn * 30, cur)} icon={TrendingDown} tone="expense" footer={<span className="text-xs text-muted-foreground">at current pace</span>} />
      </div>

      {budgetTotal > 0 && (
        <Panel title="Budget consumption">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-display text-xl font-semibold">{formatMoney(total, cur)} <span className="text-sm font-normal text-muted-foreground">of {formatMoney(budgetTotal, cur)}</span></span>
            <span className={cn("font-medium", budgetPct > 100 ? "text-destructive" : budgetPct >= 80 ? "text-warning" : "text-income")}>{budgetPct.toFixed(0)}% used</span>
          </div>
          <div className="mt-3"><ProgressBar pct={budgetPct} /></div>
        </Panel>
      )}

      {loading ? <LoadingBlock rows={4} /> : rows.length === 0 ? (
        <Panel><EmptyState icon={BarChart3} title="No data for these filters" text="Try a wider date range or different filters." /></Panel>
      ) : (
        <>
          <Panel title="Cumulative spend vs even pace"><PacingLines data={pacing} currency={cur} /></Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top spending categories"><RankedBars data={cats.slice(0, 8)} currency={cur} /></Panel>
            <Panel title="Share by category"><CategoryPie data={cats} currency={cur} /></Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Payment channels"><CategoryPie data={methods} currency={cur} /></Panel>
            <Panel title="Daily spending"><TrendArea data={daily} dataKey="amount" xKey="day" currency={cur} /></Panel>
          </div>

          <Panel title="Income vs expense — last 12 months"><IncomeExpenseBars data={monthlySeries(allInc, allEx, 12)} currency={cur} /></Panel>

          <Panel title="Largest transactions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-2 font-medium">Date</th><th className="font-medium">Description</th><th className="font-medium">Category</th><th className="font-medium">Method</th><th className="w-40 font-medium">Amount</th></tr></thead>
                <tbody>
                  {topTx.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="whitespace-nowrap py-2 text-muted-foreground">{r.date}</td>
                      <td className="max-w-[220px] truncate">{r.description}</td>
                      <td><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{r.category}</span></td>
                      <td className="text-muted-foreground">{r.payment_method}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-expense" style={{ width: `${(r.amount / maxTx) * 100}%` }} /></div>
                          <span className="whitespace-nowrap font-medium">{formatMoney(r.amount, cur)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
