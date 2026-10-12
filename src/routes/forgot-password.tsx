import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Smart Ledger" },
      { name: "description", content: "Get a link to reset your Smart Ledger password." },
      { property: "og:title", content: "Reset password — Smart Ledger" },
      { property: "og:description", content: "Get a link to reset your Smart Ledger password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }
  return (
    <AuthCard title="Forgot password?" subtitle="We'll email you a reset link." footer={<Link to="/login" className="text-primary">Back to log in</Link>}>
      {sent ? (
        <p className="text-sm">If an account exists for <b>{email}</b>, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button type="submit" className="w-full rounded-xl">Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
