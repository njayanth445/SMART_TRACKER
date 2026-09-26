import { createFileRoute, Link } from "@tanstack/react-router";
import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({ meta: [{ title: "Welcome — Smart Ledger" }, { name: "description", content: "Set up your financial workspace." }, { property: "og:title", content: "Welcome — Smart Ledger" }, { property: "og:description", content: "Set up your financial workspace." }] }),
  component: Welcome,
});

function Welcome() {
  const items = [
    { to: "/income/add" as const, icon: TrendingUp, label: "Add Income" },
    { to: "/expenses/add" as const, icon: TrendingDown, label: "Add Expense" },
    { to: "/budgets" as const, icon: PiggyBank, label: "Set Monthly Budget" },
  ];
  return (
    <AuthCard title="Welcome to Smart Ledger 👋" subtitle="Let's set up your financial workspace.">
      <div className="space-y-3">
        {items.map((i) => (
          <Link key={i.to} to={i.to} className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-4 transition hover:border-primary">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary"><i.icon className="h-5 w-5" /></span>
            <span className="font-medium">{i.label}</span>
          </Link>
        ))}
        <Button asChild variant="ghost" className="w-full"><Link to="/dashboard">Skip for now</Link></Button>
      </div>
    </AuthCard>
  );
}
