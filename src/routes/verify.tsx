import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>) => ({ email: typeof s["email"] === "string" ? (s["email"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "Verify your email — Smart Ledger" },
      { name: "description", content: "Confirm your email address to activate Smart Ledger." },
      { property: "og:title", content: "Verify your email — Smart Ledger" },
      { property: "og:description", content: "Confirm your email address to activate Smart Ledger." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  async function resend() {
    if (!email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin + "/profile-setup" } });
    if (error) toast.error(error.message);
    else toast.success("Verification email sent again.");
  }
  return (
    <AuthCard title="Check your inbox" subtitle={email ? `We sent a verification link to ${email}.` : "We sent you a verification link."}>
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="h-14 w-14 text-primary" />
        <p className="text-sm text-muted-foreground">Click the link in the email to activate your account, then continue setting up your profile.</p>
        {email && <Button variant="outline" className="w-full rounded-xl" onClick={resend}>Resend email</Button>}
        <Button asChild className="w-full rounded-xl"><Link to="/login">Back to log in</Link></Button>
      </div>
    </AuthCard>
  );
}
