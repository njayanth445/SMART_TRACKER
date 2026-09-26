import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { EmptyState, LoadingBlock, PageHeader, Panel } from "@/components/ui-bits";
import { useBudgets, useCurrency, useExpenses, useIncome } from "@/lib/data";
import { byCategory, formatMoney, inMonth, savingsRate, sum } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/_app/insights")({
  head: () => ({ meta: [{ title: "Insights — Smart Ledger" }, { name: "description", content: "Facts about your spending, from your own data." }, { property: "og:title", content: "Insights — Smart Ledger" }, { property: "og:description", content: "Facts about your spending, from your own data." }] }),
  component: Insights,
});

type Insight = { icon: typeof Lightbulb; tone: string; text: string };

function Insights() {
  const cur = useCurrency();
  const ex = useExpenses();
  const inc = useIncome();
  const bud = useBudgets();
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();
  const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y;

  const monthEx = (ex.data ?? []).filter((r) => inMonth(r.date, m, y));
  const prevEx = (ex.data ?? []).filter((r) => inMonth(r.date, pm, py));
  const monthInc = (inc.data ?? []).filter((r) => inMonth(r.date, m, y));
  const totalEx = sum(monthEx), totalInc = sum(monthInc), prevTotal = sum(prevEx);
  const cats = byCategory(monthEx);
  const list: Insight[] = [];

  if (monthEx.length) {
    list.push({ icon: Wallet, tone: "text-primary", text: `Your expenses this month are ${formatMoney(totalEx, cur)} across ${monthEx.length} transactions.` });
    list.push({ icon: Lightbulb, tone: "text-primary", text: `Your highest spending category this month is ${cats[0].name} (${formatMoney(cats[0].value, cur)}).` });
    cats.slice(0, 3).forEach((c) => list.push({ icon: Lightbulb, tone: "text-muted-foreground", text: `${c.name} represents ${((c.value / totalEx) * 100).toFixed(0)}% of your total expenses.` }));
  }
  if (totalInc > 0) {
    const net = totalInc - totalEx;
    list.push({ icon: net >= 0 ? TrendingUp : TrendingDown, tone: net >= 0 ? "text-income" : "text-expense", text: `Your savings this month are ${formatMoney(net, cur)} — a savings rate of ${savingsRate(totalInc, totalEx).toFixed(1)}%.` });
  }
  if (prevTotal > 0 && monthEx.length) {
    const diff = ((totalEx - prevTotal) / prevTotal) * 100;
    list.push({ icon: diff > 0 ? TrendingUp : TrendingDown, tone: diff > 0 ? "text-expense" : "text-income", text: `So far you've spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? "more" : "less"} than all of last month (${formatMoney(prevTotal, cur)}).` });
  }
  (bud.data ?? []).filter((b) => b.month === m && b.year === y).forEach((b) => {
    const pct = (sum(monthEx.filter((e) => e.category === b.category)) / b.amount) * 100;
    if (pct >= 80) list.push({ icon: AlertTriangle, tone: pct > 100 ? "text-destructive" : "text-warning", text: `You have used ${pct.toFixed(0)}% of your ${b.category} budget.` });
  });

  const loading = ex.isLoading || inc.isLoading || bud.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Smart insights" subtitle="Every insight is calculated from your actual data." />
      <Panel>
        {loading ? <LoadingBlock rows={4} /> : list.length === 0 ? (
          <EmptyState icon={Lightbulb} title="Not enough data yet" text="Add some income and expenses this month and insights will appear here." />
        ) : (
          <ul className="space-y-3">
            {list.map((i, idx) => (
              <li key={idx} className="flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-4">
                <i.icon className={`mt-0.5 h-5 w-5 shrink-0 ${i.tone}`} />
                <p className="text-sm sm:text-base">{i.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
