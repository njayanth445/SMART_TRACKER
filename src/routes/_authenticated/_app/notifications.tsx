import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, Info, Siren, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingBlock, PageHeader, Panel } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useDeleteRow, useNotifications } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Smart Ledger" }, { name: "description", content: "Budget alerts and updates." }, { property: "og:title", content: "Notifications — Smart Ledger" }, { property: "og:description", content: "Budget alerts and updates." }] }),
  component: Notifications,
});

function Notifications() {
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();
  const del = useDeleteRow("notifications");

  async function markAll() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Budget alerts and updates." action={<Button variant="outline" className="rounded-xl" onClick={markAll}><CheckCheck className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Mark all read</span></Button>} />
      <Panel>
        {isLoading ? <LoadingBlock /> : !data?.length ? (
          <EmptyState icon={Bell} title="You're all caught up" text="Budget alerts will appear here when you get close to a limit." />
        ) : (
          <ul className="space-y-2">
            {data.map((n) => {
              const Icon = n.type === "danger" ? Siren : n.type === "warning" ? AlertTriangle : Info;
              return (
                <li key={n.id} onClick={() => !n.is_read && markOne(n.id)} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition", n.is_read ? "border-border bg-background/40" : "border-primary/30 bg-primary/5")}>
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", n.type === "danger" ? "text-destructive" : n.type === "warning" ? "text-warning" : "text-primary")} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <button aria-label="Delete notification" onClick={(e) => { e.stopPropagation(); del.mutate(n.id); }} className="rounded-lg p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
