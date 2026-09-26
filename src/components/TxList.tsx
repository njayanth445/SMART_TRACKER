import { Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/finance";
import { cn } from "@/lib/utils";

export type TxRow = { id: string; kind: "income" | "expense"; title: string; sub: string; amount: number; date: string };

export function TxList({ rows, currency, onEdit, onDelete }: { rows: TxRow[]; currency: string; onEdit?: (id: string) => void; onDelete?: (id: string) => void }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl font-display text-sm font-semibold", r.kind === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense")}>
            {r.title.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{r.title}</p>
            <p className="truncate text-xs text-muted-foreground">{r.sub} · {new Date(r.date + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("font-display font-semibold", r.kind === "income" ? "text-income" : "text-expense")}>
              {r.kind === "income" ? "+" : "−"}{formatMoney(r.amount, currency)}
            </span>
            {onEdit && <button aria-label="Edit" onClick={() => onEdit(r.id)} className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button>}
            {onDelete && <button aria-label="Delete" onClick={() => onDelete(r.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
          </div>
        </li>
      ))}
    </ul>
  );
}
