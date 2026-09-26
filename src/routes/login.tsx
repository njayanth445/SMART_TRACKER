import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthCard, GoogleButton } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Smart Ledger" },
      { name: "description", content: "Log in to your Smart Ledger account." },
      { property: "og:title", content: "Log in — Smart Ledger" },
      { property: "og:description", content: "Log in to your Smart Ledger account." },
    ],
  }),
  component: Login,
});

export async function googleSignIn() {
  const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
  if (r.error) toast.error("Google sign-in failed. Please try again.");
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already signed in (e.g. after Google), go to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard", replace: true }); });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("not confirmed") ? "Please verify your email first." : "Invalid email or password.");
      return;
    }
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to manage your money." footer={<>New here? <Link to="/signup" className="font-medium text-primary">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label htmlFor="pw">Password</Label><Link to="/forgot-password" className="text-xs text-primary">Forgot password?</Link></div>
          <div className="relative">
            <Input id="pw" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-xl">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Log in</Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
      <GoogleButton onClick={googleSignIn} />
    </AuthCard>
  );
}
