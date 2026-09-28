import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, MessageSquareText, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, Panel } from "@/components/ui-bits";
import { useCurrency, useSaveExpense, useSaveIncome } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_SOURCES, formatMoney, todayISO } from "@/lib/finance";
import { parseMany, type ParsedSms } from "@/lib/sms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/sms-import")({
  validateSearch: (s: Record<string, unknown>) => ({
    text: typeof s["text"] === "string" ? (s["text"] as string).slice(0, 5000) : "",
  }),
  head: () => ({ meta: [{ title: "Add from bank SMS — Smart Ledger" }, { name: "description", content: "Turn bank SMS like 'Rs 500 credited' into income and expenses." }, { property: "og:title", content: "Add from bank SMS — Smart Ledger" }, { property: "og:description", content: "Turn bank SMS into income and expenses." }] }),
  component: SmsImport,
});

type Row = ParsedSms & { keep: boolean };

function SmsImport() {
  const { text: shared } = Route.useSearch();
  const nav = useNavigate();
  const cur = useCurrency();
  const [text, setText] = useState(shared);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const saveEx = useSaveExpense();
  const saveInc = useSaveIncome();

  function read(t = text) {
    const r = parseMany(t);
    setRows(r.map((x) => ({ ...x, keep: true })));
    if (!r.length) toast.error("No bank transaction found. OTP and promo messages are ignored.");
  }
  useEffect(() => { if (shared) read(shared); }, [shared]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));

  async function addAll() {
    const sel = rows.filter((r) => r.keep);
    if (!sel.length) { toast.error("Select at least one entry."); return; }
    for (const r of sel) {
      if (!(r.amount > 0)) { toast.error("Every amount must be greater than 0."); return; }
      if (r.date > todayISO()) { toast.error("Future dates are not allowed."); return; }
    }
    setSaving(true);
    try {
      for (const r of sel) {
        const desc = (r.party || (r.kind === "income" ? "Bank credit" : "Bank debit")).slice(0, 100);
        const notes = `From SMS: ${r.raw}`.slice(0, 500);
        if (r.kind === "expense") await saveEx.mutateAsync({ amount: r.amount, description: desc, category: r.category, date: r.date, payment_method: r.payment_method, notes });
        else await saveInc.mutateAsync({ amount: r.amount, source: r.category, description: desc, date: r.date, notes });
      }
      toast.success(`Added ${sel.length} ${sel.length === 1 ? "entry" : "entries"}`);
      setRows([]); setText("");
      nav({ to: "/dashboard" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Add from bank SMS" subtitle="Paste or share bank messages — we find the amount, credit or debit, and date." />

      <Panel>
        <Textarea rows={6} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Rs.500.00 credited to your A/c XX1234 on 28-09-26 by UPI from RAHUL. Avl Bal Rs 12,340\n\nINR 249 debited from A/c XX1234 on 27-Sep-26 to SWIGGY via UPI"} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button className="rounded-xl" onClick={() => read()} disabled={!text.trim()}><MessageSquareText className="mr-1 h-4 w-4" />Read messages</Button>
          <p className="text-xs text-muted-foreground">Separate messages with a blank line. OTP messages are always ignored.</p>
        </div>
      </Panel>

      {rows.length > 0 ? (
        <Panel title={`Found ${rows.length}`}>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className={cn("rounded-2xl border border-border p-3", !r.keep && "opacity-50")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", r.kind === "income" ? "bg-success/15 text-income" : "bg-destructive/15 text-expense")}>{r.kind === "income" ? "Income" : "Expense"}</span>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.raw}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant={r.keep ? "default" : "outline"} className="h-8 w-8 rounded-lg" aria-label="Keep" onClick={() => upd(i, { keep: !r.keep })}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" aria-label="Remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Select value={r.kind} onValueChange={(k) => upd(i, { kind: k as Row["kind"], category: "Other" })}><SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent></Select>
                  <Input type="number" min={1} aria-label="Amount" value={r.amount} onChange={(e) => upd(i, { amount: Number(e.target.value) })} />
                  <Input type="date" max={todayISO()} aria-label="Date" value={r.date} onChange={(e) => upd(i, { date: e.target.value })} />
                  <Select value={r.category} onValueChange={(c) => upd(i, { category: c })}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent>{(r.kind === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <Input aria-label="Description" maxLength={100} placeholder="Description" value={r.party} onChange={(e) => upd(i, { party: e.target.value })} />
                </div>
                <p className={cn("mt-2 text-right font-display font-semibold", r.kind === "income" ? "text-income" : "text-expense")}>{r.kind === "income" ? "+" : "−"}{formatMoney(r.amount, cur)}</p>
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full rounded-xl" onClick={addAll} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add selected</Button>
        </Panel>
      ) : (
        <Panel>
          <EmptyState icon={Share2} title="Share SMS straight from your phone" text="On Android, install Smart Ledger (browser menu → Add to Home screen / Install app). Then long-press a bank SMS → Share → Smart Ledger, and it opens here ready to add." />
        </Panel>
      )}
    </div>
  );
}
