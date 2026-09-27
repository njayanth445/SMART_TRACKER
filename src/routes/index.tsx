import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Bell, FileDown, PiggyBank, ShieldCheck, Wallet, ArrowRight, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Ledger — Smart Personal Expense Tracker" },
      { name: "description", content: "Track income and expenses, set budgets, see analytics and export reports — all in one secure place." },
      { property: "og:title", content: "Smart Ledger — Smart Personal Expense Tracker" },
      { property: "og:description", content: "Track income and expenses, set budgets, see analytics and export reports." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Wallet, title: "Track every rupee", text: "Log income and expenses in seconds, with categories and payment methods." },
  { icon: PiggyBank, title: "Budgets that warn you", text: "Set monthly category budgets and get alerts at 80% and when exceeded." },
  { icon: BarChart3, title: "Clear analytics", text: "See where money goes with category, trend and income vs expense charts." },
  { icon: Sparkles, title: "Honest insights", text: "Plain facts from your own data — highest category, savings rate and more." },
  { icon: FileDown, title: "Reports & export", text: "Daily, monthly and yearly reports. Export to CSV or print as PDF." },
  { icon: ShieldCheck, title: "Private by design", text: "Your data belongs only to your account. Nobody else can see it." },
];

function Landing() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) nav({ to: "/dashboard", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
          <Button asChild className="rounded-xl"><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Bell className="h-3.5 w-3.5 text-primary" /> Budget alerts built in
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Know where your money goes. <span className="bg-brand bg-clip-text text-transparent">Keep more of it.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Smart Ledger turns your daily spending into clear budgets, charts and reports — so every month ends with a plan, not a surprise.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl"><Link to="/signup">Create free account <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl"><Link to="/login">I have an account</Link></Button>
          </div>
        </div>
        <PreviewCard />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-semibold">Everything you need, nothing you don't</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 transition hover:-translate-y-1">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {["Create your account", "Add income & expenses", "Set category budgets", "Read insights & reports"].map((s, i) => (
            <li key={s} className="glass rounded-2xl p-6">
              <span className="font-display text-3xl font-bold text-primary">0{i + 1}</span>
              <p className="mt-2 font-medium">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl bg-brand p-10 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold">Start your smarter money month today</h2>
          <p className="mt-2 opacity-90">Free to use. Takes under a minute.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 rounded-xl"><Link to="/signup">Get started</Link></Button>
        </div>
      </section>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Smart Ledger</footer>
    </div>
  );
}

function PreviewCard() {
  const bars = [62, 80, 45, 90, 70, 55];
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">This month</p>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">+32% saved</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[["Income", "₹85,000", "text-income"], ["Expense", "₹57,800", "text-expense"], ["Savings", "₹27,200", "text-primary"]].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className={`mt-1 font-display text-lg font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex h-40 items-end gap-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-xl bg-brand opacity-80" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {[["Food", 70], ["Shopping", 88]].map(([c, p]) => (
          <div key={c as string}>
            <div className="flex justify-between text-sm"><span>{c}</span><span className="text-muted-foreground">{p}%</span></div>
            <div className="mt-1 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${Number(p) >= 80 ? "bg-warning" : "bg-primary"}`} style={{ width: `${p}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
