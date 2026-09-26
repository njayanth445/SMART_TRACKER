import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingBlock, PageHeader, Panel } from "@/components/ui-bits";
import { useCurrency, useExpenses, useIncome, useProfile } from "@/lib/data";
import { MONTHS, byCategory, downloadFile, formatMoney, savingsRate, sum, toCSV, todayISO } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Smart Ledger" }, { name: "description", content: "Daily, monthly and yearly financial reports." }, { property: "og:title", content: "Reports — Smart Ledger" }, { property: "og:description", content: "Daily, monthly and yearly financial reports." }] }),
  component: Reports,
});

function Reports() {
  const cur = useCurrency();
  const { data: profile } = useProfile();
  const ex = useExpenses();
  const inc = useIncome();
  const now = new Date();
  const [type, setType] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [day, setDay] = useState(todayISO());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const prefix = type === "daily" ? day : type === "monthly" ? `${year}-${String(month).padStart(2, "0")}` : String(year);
  const label = type === "daily" ? new Date(day + "T00:00").toLocaleDateString(undefined, { dateStyle: "long" }) : type === "monthly" ? `${MONTHS[month - 1]} ${year}` : String(year);

  const exRows = useMemo(() => (ex.data ?? []).filter((r) => r.date.startsWith(prefix)), [ex.data, prefix]);
  const incRows = useMemo(() => (inc.data ?? []).filter((r) => r.date.startsWith(prefix)), [inc.data, prefix]);
  const totalEx = sum(exRows), totalInc = sum(incRows);
  const cats = byCategory(exRows);
  const byMonth = type === "yearly" ? MONTHS.map((mn, i) => {
    const p = `${year}-${String(i + 1).padStart(2, "0")}`;
    const e = sum(exRows.filter((r) => r.date.startsWith(p))), n = sum(incRows.filter((r) => r.date.startsWith(p)));
    return { mn, e, n };
  }) : [];

  function exportCsv() {
    const rows = [
      ...incRows.map((r) => ({ type: "Income", date: r.date, category: r.source, description: r.description ?? "", payment_method: "", amount: r.amount })),
      ...exRows.map((r) => ({ type: "Expense", date: r.date, category: r.category, description: r.description, payment_method: r.payment_method, amount: r.amount })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return toast.error("No transactions in this period.");
    downloadFile(`smart-ledger-${type}-report-${prefix}.csv`, toCSV(rows));
    toast.success("Report exported");
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export financial reports." action={
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /><span className="hidden sm:inline">PDF</span></Button>
          <Button className="rounded-xl" onClick={exportCsv}><FileDown className="mr-1 h-4 w-4" /><span className="hidden sm:inline">CSV</span></Button>
        </div>
      } />

      <Panel className="print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
            <TabsList><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="yearly">Yearly</TabsTrigger></TabsList>
          </Tabs>
          {type === "daily" && <Input type="date" className="w-44" value={day} max={todayISO()} onChange={(e) => setDay(e.target.value)} aria-label="Day" />}
          {type === "monthly" && <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}><SelectTrigger className="w-24" aria-label="Month"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select>}
          {type !== "daily" && <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}><SelectTrigger className="w-24" aria-label="Year"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>}
        </div>
      </Panel>

      <Panel>
        {ex.isLoading || inc.isLoading ? <LoadingBlock rows={5} /> : (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{type} report · {profile?.full_name ?? ""}</p>
              <h2 className="mt-1 text-2xl font-semibold">{label}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Income", formatMoney(totalInc, cur), "text-income"], ["Expense", formatMoney(totalEx, cur), "text-expense"], ["Net savings", formatMoney(totalInc - totalEx, cur), ""], ["Savings rate", `${savingsRate(totalInc, totalEx).toFixed(1)}%`, ""]].map(([l, v, c]) => (
                <div key={l} className="rounded-2xl border border-border bg-background/50 p-3"><p className="text-xs text-muted-foreground">{l}</p><p className={`mt-1 font-display text-lg font-semibold ${c}`}>{v}</p></div>
              ))}
            </div>

            {type === "yearly" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="py-2">Month</th><th>Income</th><th>Expense</th><th>Savings</th></tr></thead>
                  <tbody>{byMonth.map((r) => <tr key={r.mn} className="border-t border-border"><td className="py-2">{r.mn}</td><td>{formatMoney(r.n, cur)}</td><td>{formatMoney(r.e, cur)}</td><td className={r.n - r.e < 0 ? "text-destructive" : ""}>{formatMoney(r.n - r.e, cur)}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            <div>
              <h3 className="mb-2 font-semibold">Expenses by category</h3>
              {cats.length === 0 ? <p className="text-sm text-muted-foreground">No expenses in this period.</p> : (
                <ul className="space-y-2">{cats.map((c) => <li key={c.name} className="flex justify-between text-sm"><span>{c.name}</span><span className="font-medium">{formatMoney(c.value, cur)} <span className="text-muted-foreground">({((c.value / totalEx) * 100).toFixed(0)}%)</span></span></li>)}</ul>
              )}
            </div>

            {type !== "yearly" && (
              <div>
                <h3 className="mb-2 font-semibold">Transactions</h3>
                {exRows.length + incRows.length === 0 ? <p className="text-sm text-muted-foreground">No transactions in this period.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-muted-foreground"><th className="py-2">Date</th><th>Description</th><th>Category</th><th className="text-right">Amount</th></tr></thead>
                      <tbody>
                        {[...incRows.map((r) => ({ id: r.id, d: r.date, t: r.description || r.source, c: r.source, a: r.amount, i: true })), ...exRows.map((r) => ({ id: r.id, d: r.date, t: r.description, c: r.category, a: r.amount, i: false }))].sort((a, b) => a.d.localeCompare(b.d)).map((r) => (
                          <tr key={r.id} className="border-t border-border"><td className="py-2 whitespace-nowrap">{r.d}</td><td>{r.t}</td><td>{r.c}</td><td className={`text-right whitespace-nowrap ${r.i ? "text-income" : "text-expense"}`}>{r.i ? "+" : "−"}{formatMoney(r.a, cur)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
