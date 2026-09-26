import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — Smart Ledger" },
      { name: "description", content: "Choose a new password for Smart Ledger." },
      { property: "og:title", content: "Set new password — Smart Ledger" },
      { property: "og:description", content: "Choose a new password for Smart Ledger." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [c, setC] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== c) return toast.error("Passwords do not match.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    nav({ to: "/dashboard" });
  }
  return (
    <AuthCard title="Set a new password">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="p">New password</Label><Input id="p" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="c">Confirm password</Label><Input id="c" type="password" required value={c} onChange={(e) => setC(e.target.value)} /></div>
        <Button type="submit" className="w-full rounded-xl">Update password</Button>
      </form>
    </AuthCard>
  );
}
