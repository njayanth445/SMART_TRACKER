import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { LoadingBlock, PageHeader, Panel } from "@/components/ui-bits";
import { useProfile, useUpdateProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Smart Ledger" }, { name: "description", content: "Manage your personal details." }, { property: "og:title", content: "Profile — Smart Ledger" }, { property: "og:description", content: "Manage your personal details." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Profile,
});

function Profile() {
  const { data, isLoading } = useProfile();
  const save = useUpdateProfile();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Profile" subtitle="Your personal details and preferences." />
      <Panel>
        {isLoading ? <LoadingBlock rows={5} /> : (
          <ProfileForm profile={data ?? null} submitting={save.isPending} submitLabel="Save changes" onSubmit={async (v) => {
            try { await save.mutateAsync(v); toast.success("Profile updated"); } catch (e) { toast.error((e as Error).message); }
          }} />
        )}
      </Panel>
    </div>
  );
}
