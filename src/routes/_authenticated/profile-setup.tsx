import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/AuthCard";
import { ProfileForm, type ProfileFormValues } from "@/components/ProfileForm";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { LoadingBlock } from "@/components/ui-bits";

export const Route = createFileRoute("/_authenticated/profile-setup")({
  head: () => ({ meta: [{ title: "Complete your profile — Smart Ledger" }, { name: "description", content: "Set up your Smart Ledger profile." }, { property: "og:title", content: "Complete your profile — Smart Ledger" }, { property: "og:description", content: "Set up your Smart Ledger profile." }] }),
  component: Setup,
});

function Setup() {
  const nav = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const save = useUpdateProfile();
  const [ready, setReady] = useState(false);
  useEffect(() => { if (!isLoading) setReady(true); }, [isLoading]);

  async function onSubmit(v: ProfileFormValues) {
    try {
      await save.mutateAsync({ ...v, onboarded: true });
      toast.success("Profile saved");
      nav({ to: "/welcome" });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AuthCard title="Complete your profile" subtitle="A few details to personalise your ledger.">
      {!ready ? <LoadingBlock rows={5} /> : <ProfileForm profile={profile ?? null} onSubmit={onSubmit} submitting={save.isPending} submitLabel="Save & Continue" />}
    </AuthCard>
  );
}
