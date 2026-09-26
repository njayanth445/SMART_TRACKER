import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, GoogleButton } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleSignIn } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Smart Ledger" },
      { name: "description", content: "Create your free Smart Ledger account." },
      { property: "og:title", content: "Create account — Smart Ledger" },
      { property: "og:description", content: "Create your free Smart Ledger account." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (f.password !== f.confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: window.location.origin + "/profile-setup", data: { full_name: f.name } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) return nav({ to: "/profile-setup" });
    nav({ to: "/verify", search: { email: f.email } });
  }

  return (
    <AuthCard title="Create your account" subtitle="Start tracking in under a minute." footer={<>Already have an account? <Link to="/login" className="font-medium text-primary">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="n">Full name</Label><Input id="n" required value={f.name} onChange={set("name")} /></div>
        <div className="space-y-1.5"><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={f.email} onChange={set("email")} /></div>
        <div className="space-y-1.5"><Label htmlFor="p">Password</Label><Input id="p" type="password" required value={f.password} onChange={set("password")} /><p className="text-xs text-muted-foreground">At least 8 characters.</p></div>
        <div className="space-y-1.5"><Label htmlFor="c">Confirm password</Label><Input id="c" type="password" required value={f.confirm} onChange={set("confirm")} /></div>
        <Button type="submit" disabled={loading} className="w-full rounded-xl">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create account</Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
      <GoogleButton onClick={googleSignIn} />
    </AuthCard>
  );
}
