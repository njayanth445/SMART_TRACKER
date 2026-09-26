import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CURRENCIES, LANGUAGES } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/data";

export type ProfileFormValues = { full_name: string; phone: string; monthly_income: number | null; currency: string; language: string; avatar_url: string | null };

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function ProfileForm({ profile, onSubmit, submitting, submitLabel }: { profile: Profile | null; onSubmit: (v: ProfileFormValues) => void; submitting: boolean; submitLabel: string }) {
  const [v, setV] = useState<ProfileFormValues>({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    monthly_income: profile?.monthly_income ?? null,
    currency: profile?.currency ?? "INR",
    language: profile?.language ?? "en",
    avatar_url: profile?.avatar_url ?? null,
  });
  const [email, setEmail] = useState(profile?.email ?? "");
  useEffect(() => {
    if (!email) supabase.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); });
  }, [email]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image.");
    setV({ ...v, avatar_url: await resizeToDataUrl(f) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.full_name.trim()) return toast.error("Please enter your name.");
    if (v.phone && !/^[+\d\s-]{7,15}$/.test(v.phone)) return toast.error("Please enter a valid phone number.");
    if (v.monthly_income != null && v.monthly_income < 0) return toast.error("Income can't be negative.");
    onSubmit(v);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {v.avatar_url && <AvatarImage src={v.avatar_url} alt="Profile photo" />}
          <AvatarFallback className="bg-secondary font-display text-lg">{(v.full_name || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <label className="cursor-pointer rounded-xl border border-input px-3 py-2 text-sm hover:bg-secondary">
          Upload photo<input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
      </div>
      <div className="space-y-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" value={v.full_name} onChange={(e) => setV({ ...v, full_name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="em">Email</Label><Input id="em" value={email} disabled /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="ph">Phone</Label><Input id="ph" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
        <div className="space-y-1.5"><Label htmlFor="mi">Monthly income</Label><Input id="mi" type="number" min={0} value={v.monthly_income ?? ""} onChange={(e) => setV({ ...v, monthly_income: e.target.value === "" ? null : Number(e.target.value) })} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Currency</Label>
          <Select value={v.currency} onValueChange={(c) => setV({ ...v, currency: c })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Language</Label>
          <Select value={v.language} onValueChange={(l) => setV({ ...v, language: l })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full rounded-xl">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{submitLabel}</Button>
    </form>
  );
}
