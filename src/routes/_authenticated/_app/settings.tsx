import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, Panel } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { CURRENCIES, LANGUAGES } from "@/lib/finance";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useSignOut } from "./route";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Smart Ledger" }, { name: "description", content: "Appearance, language, currency and security." }, { property: "og:title", content: "Settings — Smart Ledger" }, { property: "og:description", content: "Appearance, language, currency and security." }] }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const save = useUpdateProfile();
  const qc = useQueryClient();
  const signOut = useSignOut();
  const [dark, setDark] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  useEffect(() => setDark(getStoredTheme() === "dark"), []);

  function toggleTheme(v: boolean) {
    setDark(v);
    applyTheme(v ? "dark" : "light");
    save.mutate({ theme: v ? "dark" : "light" });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match.");
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
    if (error) return toast.error(error.message);
    toast.success("Password changed");
    setPw({ current: "", next: "", confirm: "" });
  }

  async function clearData() {
    await Promise.all([
      supabase.from("expenses").delete().not("id", "is", null),
      supabase.from("income").delete().not("id", "is", null),
      supabase.from("budgets").delete().not("id", "is", null),
      supabase.from("notifications").delete().not("id", "is", null),
    ]);
    qc.invalidateQueries();
    toast.success("All financial data deleted");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" />
      <Panel title="Appearance">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">{dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}<div><p className="font-medium">Dark mode</p><p className="text-sm text-muted-foreground">Easier on the eyes at night.</p></div></div>
          <Switch checked={dark} onCheckedChange={toggleTheme} aria-label="Dark mode" />
        </div>
      </Panel>
      <Panel title="Language & currency">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Language</Label>
            <Select value={profile?.language ?? "en"} onValueChange={(v) => save.mutate({ language: v }, { onSuccess: () => toast.success("Language updated") })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5"><Label>Currency</Label>
            <Select value={profile?.currency ?? "INR"} onValueChange={(v) => save.mutate({ currency: v }, { onSuccess: () => toast.success("Currency updated") })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
      </Panel>
      <Panel title="Security">
        <form onSubmit={changePassword} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="cp">Current password</Label><Input id="cp" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cf">Confirm</Label><Input id="cf" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
          </div>
          <Button type="submit" variant="outline" className="rounded-xl">Change password</Button>
        </form>
      </Panel>
      <Panel title="Account">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Log out</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="rounded-xl">Delete all my data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete all financial data?</AlertDialogTitle><AlertDialogDescription>All income, expenses, budgets and notifications will be permanently removed. Your account stays.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearData}>Delete everything</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Panel>
    </div>
  );
}
