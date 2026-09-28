import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/finance";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary-glow)", "var(--warning)", "var(--muted-foreground)", "var(--accent)"];

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };

export function CategoryPie({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} stroke="none">
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBars({ data, currency }: { data: { month: string; income: number; expense: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} cursor={{ fill: "var(--muted)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="var(--income)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendArea({ data, dataKey, currency, xKey = "month" }: { data: Record<string, number | string>[]; dataKey: string; currency: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Area type="monotone" dataKey={dataKey} stroke="var(--primary)" strokeWidth={2.5} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranked bars — Power BI style "top drivers" visual. */
export function RankedBars({ data, currency }: { data: { name: string; value: number }[]; currency: string }) {
  const height = Math.max(180, data.length * 38);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Spent" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cumulative spend vs an even-pace target line. */
export function PacingLines({ data, currency }: { data: { day: string; actual: number; target: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="actual" name="Cumulative spend" stroke="var(--expense)" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="target" name="Even pace" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Semi-circle gauge (0-100+%). */
export function Gauge({ pct, label, sub }: { pct: number; label: string; sub?: string }) {
  const v = Math.max(0, Math.min(100, pct));
  const color = pct > 100 ? "var(--destructive)" : pct >= 80 ? "var(--warning)" : "var(--income)";
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={170}>
        <RadialBarChart data={[{ v }]} startAngle={180} endAngle={0} innerRadius="75%" outerRadius="100%" cy="85%">
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="v" cornerRadius={10} fill={color} background={{ fill: "var(--muted)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
        <p className="font-display text-2xl font-semibold">{Math.round(pct)}%</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/** Budget vs spent per category (horizontal grouped bars). */
export function BudgetVsSpent({ data, currency }: { data: { name: string; budget: number; spent: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} cursor={{ fill: "var(--muted)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="budget" name="Budget" fill="var(--muted-foreground)" fillOpacity={0.35} radius={[0, 6, 6, 0]} />
        <Bar dataKey="spent" name="Spent" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.spent > d.budget ? "var(--destructive)" : d.spent >= d.budget * 0.8 ? "var(--warning)" : "var(--income)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Simple vertical bars keyed by `x`. */
export function SimpleBars({ data, currency, color = "var(--expense)" }: { data: { x: string; value: number }[]; currency: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="x" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Amount" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
