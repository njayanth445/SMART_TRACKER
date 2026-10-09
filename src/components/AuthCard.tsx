import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { setStoredLang, useStoredLang } from "./AutoTranslate";
import { LANGUAGES } from "@/lib/finance";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  const lang = useStoredLang();
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <select aria-label="Language" value={lang} onChange={(e) => setStoredLang(e.target.value)} className="absolute right-4 top-4 rounded-xl border border-input bg-background px-3 py-1.5 text-sm">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
      <div className="mb-8"><Logo /></div>
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function GoogleButton({ onClick, label = "Continue with Google" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm font-medium transition hover:bg-secondary">
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95S8.78 6.5 12 6.5c1.84 0 3.07.78 3.77 1.45l2.57-2.48C16.7 3.95 14.55 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.6-.07-1.05-.29-1.1z"/></svg>
      {label}
    </button>
  );
}
