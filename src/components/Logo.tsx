import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-primary-foreground shadow-sm">
        ₹
      </span>
      <span className="font-display text-lg font-semibold">Smart Ledger</span>
    </Link>
  );
}
