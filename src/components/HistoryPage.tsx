import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState, LoadingBlock, PageHeader, Panel } from "@/components/ui-bits";
import { TxList } from "@/components/TxList";
import { ExpenseForm, IncomeForm } from "@/components/TxForms";
import { useCurrency, useDeleteRow, useExpenses, useIncome } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS, formatMoney, sum, toCSV, downloadFile } from "@/lib/finance";

export function HistoryPage({ kind }: { kind: "expense" | "income" }) {
  const cur = useCurrency();
  const ex = useExpenses();
  const inc = useIncome();
  const del = useDeleteRow(kind === "expense" ? "expenses" : "income");
  const q = kind === "expense" ? ex : inc;
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const rows = useMemo(() => {
    const src = kind === "expense"
      ? (ex.data ?? []).map((r) => ({ id: r.id, kind, title: r.description, sub: `${r.category} · ${r.payment_method}`, amount: r.amount, date: r.date, cat: r.category, method: r.payment_method, text: `${r.description} ${r.notes ?? ""}` }))
      : (inc.data ?? []).map((r) => ({ id: r.id, kind, title: r.description || r.source, sub: r.source, amount: r.amount, date: r.date, cat: r.source, method: "", text: `${r.description ?? ""} ${r.source} ${r.notes ?? ""}` }));
    const s = search.toLowerCase();
    const out = src.filter((r) =>
      (!s || r.text.toLowerCase().includes(s)) && (cat === "all" || r.cat === cat) && (method === "all" || r.method === method) && (!from || r.date >= from) && (!to || r.date <= to));
    const [k, d] = sort.split("-");
    out.sort((a, b) => (k === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount) * (d === "desc" ? -1 : 1));
    return out;
  }, [ex.data, inc.data, kind, search, cat, method, from, to, sort]);

  const cats = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const editRow = kind === "expense" ? ex.data?.find((r) => r.id === editing) : inc.data?.find((r) => r.id === editing);
  const label = kind === "expense" ? "Expenses" : "Income";

  function exportCsv() {
    const data = kind === "expense" ? (ex.data ?? []).filter((r) => rows.some((x) => x.id === r.id)) : (inc.data ?? []).filter((r) => rows.some((x) => x.id === r.id));
    if (!data.length) { toast.error("Nothing to export."); return; }
    downloadFile(`smart-ledger-${kind}.csv`, toCSV(data.map(({ id: _id, created_at: _c, ...rest }) => rest as Record<string, unknown>)));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={label}
        subtitle={`${rows.length} records · ${formatMoney(sum(rows), cur)}`}
        action={<Button asChild className="rounded-xl"><Link to={kind === "expense" ? "/expenses/add" : "/income/add"}><Plus className="mr-1 h-4 w-4" />Add</Link></Button>}
      />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Search" />
          </div>
          <Select value={cat} onValueChange={setCat}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{kind === "expense" ? "All categories" : "All sources"}</SelectItem>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          {kind === "expense" ? (
            <Select value={method} onValueChange={setMethod}><SelectTrigger aria-label="Payment method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All methods</SelectItem>{PAYMENT_METHODS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          ) : <div className="hidden lg:block" />}
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="date-desc">Newest first</SelectItem><SelectItem value="date-asc">Oldest first</SelectItem><SelectItem value="amount-desc">Highest amount</SelectItem><SelectItem value="amount-asc">Lowest amount</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={exportCsv}>Export CSV</Button>
        </div>
      </Panel>
      <Panel>
        {q.isLoading ? <LoadingBlock rows={5} /> : rows.length ? (
          <TxList rows={rows} currency={cur} onEdit={setEditing} onDelete={setDeleting} />
        ) : (
          <EmptyState icon={Wallet} title={`No ${label.toLowerCase()} found`} text="Try changing filters or add a new record." />
        )}
      </Panel>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit {kind}</DialogTitle></DialogHeader>
          {editRow && (kind === "expense"
            ? <ExpenseForm initial={editRow as never} onDone={() => setEditing(null)} />
            : <IncomeForm initial={editRow as never} onDone={() => setEditing(null)} />)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this {kind}?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { try { await del.mutateAsync(deleting!); toast.success("Deleted"); } catch (e) { toast.error((e as Error).message); } setDeleting(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
