import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { ProfileForm, type ProfileFormValues } from "@/components/ProfileForm";
import { useBudgets, useProfile, useSaveBudget, useUpdateProfile } from "@/lib/data";
import { LoadingBlock } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoredLang } from "@/components/AutoTranslate";
import { EXPENSE_CATEGORIES } from "@/lib/finance";
import { languageLocale, tr } from "@/lib/i18n";
import { parseBudgetAmount } from "@/lib/budget-input";

export const Route = createFileRoute("/_authenticated/profile-setup")({
  head: () => ({ meta: [{ title: "Complete your profile — Smart Ledger" }, { name: "description", content: "Set up your Smart Ledger profile and monthly category budget limits." }, { property: "og:title", content: "Complete your profile — Smart Ledger" }, { property: "og:description", content: "Set up your Smart Ledger profile and monthly category budget limits." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Setup,
});

function Setup() {
  const nav = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const save = useUpdateProfile();
  const budgets = useBudgets();
  const saveBudget = useSaveBudget();
  const lang = useStoredLang();
  const [limits, setLimits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const currentBudgets = (budgets.data ?? []).filter((b) => b.month === month && b.year === year);
  const [ready, setReady] = useState(false);
  useEffect(() => { if (!isLoading) setReady(true); }, [isLoading]);

  async function onSubmit(v: ProfileFormValues) {
    const entries = Object.entries(limits).filter(([, value]) => value.trim());
    const parsed = entries.map(([category, value]) => ({ category, amount: parseBudgetAmount(value) }));
    if (parsed.some((entry) => entry.amount === null)) { toast.error(tr(lang, "Enter a valid budget limit greater than 0.")); return; }
    setSaving(true);
    try {
      for (const entry of parsed) {
        if (entry.amount === null) return;
        await saveBudget.mutateAsync({ category: entry.category, amount: entry.amount, month, year });
      }
      await save.mutateAsync({ ...v, onboarded: true });
      toast.success(tr(lang, "Profile saved"));
      nav({ to: "/welcome" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <AuthCard title={tr(lang, "Complete your profile")} subtitle={tr(lang, "A few details to personalise your ledger.")}>
      {!ready || budgets.isLoading ? <LoadingBlock rows={5} /> : budgets.isError ? <p role="alert" className="text-sm text-destructive">{budgets.error.message}</p> : <ProfileForm profile={profile ?? null} onSubmit={onSubmit} submitting={saving} submitLabel={tr(lang, "Save & Continue")}>
        <fieldset disabled={saving} className="space-y-3 border-t border-border pt-4">
          <legend className="text-sm font-semibold">{tr(lang, "Monthly category limits (optional)")}</legend>
          <p className="text-sm text-muted-foreground">{now.toLocaleDateString(languageLocale(lang), { month: "long", year: "numeric" })} · {profile?.currency ?? "INR"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPENSE_CATEGORIES.map((category) => {
              const existing = currentBudgets.find((b) => b.category === category);
              return <div key={category} className="min-w-0 space-y-1.5">
                <Label htmlFor={`limit-${category}`}>{tr(lang, category)}</Label>
                <Input id={`limit-${category}`} type="text" inputMode="decimal" aria-label={`${tr(lang, category)} — ${tr(lang, "Budget limit")}`} value={limits[category] ?? (existing ? String(existing.amount) : "")} placeholder={tr(lang, "No limit")} onChange={(e) => setLimits((current) => ({ ...current, [category]: e.target.value }))} />
              </div>;
            })}
          </div>
        </fieldset>
      </ProfileForm>}
    </AuthCard>
  );
}
