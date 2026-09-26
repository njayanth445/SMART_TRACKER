import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Receipt, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LoadingBlock, PageHeader, Panel, StatCard } from "@/components/ui-bits";
import { CategoryPie, IncomeExpenseBars, TrendArea } from "@/components/Charts";
import { useCurrency, useExpenses, useIncome } from "@/lib/data";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, byCategory, formatMoney, monthlySeries, sum, todayISO } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Smart Ledger" }, { name: "description", content: "Charts and trends of your spending." }, { property: "og:title", content: "Analytics — Smart Ledger" }, { property: "og:description", content: "Charts and trends of your spending." }] }),
  component: Analytics,
});

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

function Analytics() {
  const cur = useCurrency();
  const ex = useExpenses();
  const inc = useIncome();
  const [range, setRange] = useState("30");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayISO());

  const start = range === "custom" ? from : daysAgo(Number(range));
  const end = range === "custom" ? to : todayISO();
  const rows = useMemo(() => (ex.data ?? []).filter((r) => r.date >= start && r.date <= end && (cat === "all" || r.category === cat) && (method === "all" || r.payment_method === method)), [ex.data, start, end, cat, method]);

  const total = sum(rows);
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  const cats = byCategory(rows);
  const daily = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.date, (map.get(r.date) ?? 0) + r.amount));
    return [...map.entries()].sort().map(([d, v]) => ({ day: d.slice(5), amount: v }));
  }, [rows]);
  const methods = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.payment_method, (map.get(r.payment_method) ?? 0) + r.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Understand how and where you spend." />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={range} onValueChange={setRange}><SelectTrigger aria-label="Range"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 3 months</SelectItem><SelectItem value="365">Last 12 months</SelectItem><SelectItem value="custom">Custom range</SelectItem></SelectContent></Select>
          <Select value={cat} onValueChange={setCat}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={method} onValueChange={setMethod}><SelectTrigger aria-label="Payment method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All methods</SelectItem>{PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          {range === "custom" && <>
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
            <Input type="date" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          </>}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total spent" value={formatMoney(total, cur)} icon={TrendingDown} tone="expense" />
        <StatCard label="Daily average" value={formatMoney(total / days, cur)} icon={CalendarDays} />
        <StatCard label="Transactions" value={String(rows.length)} icon={Receipt} tone="accent" />
        <StatCard label="Top category" value={cats[0]?.name ?? "—"} icon={BarChart3} tone="income" />
      </div>

      {ex.isLoading ? <LoadingBlock rows={4} /> : rows.length === 0 ? (
        <Panel><EmptyState icon={BarChart3} title="No data for these filters" text="Try a wider date range or different filters." /></Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="By category"><CategoryPie data={cats} currency={cur} /></Panel>
            <Panel title="By payment method"><CategoryPie data={methods} currency={cur} /></Panel>
          </div>
          <Panel title="Daily spending"><TrendArea data={daily} dataKey="amount" xKey="day" currency={cur} /></Panel>
        </>
      )}
      <Panel title="Income vs expense — last 12 months"><IncomeExpenseBars data={monthlySeries(inc.data ?? [], ex.data ?? [], 12)} currency={cur} /></Panel>
    </div>
  );
}
