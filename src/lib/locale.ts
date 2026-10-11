import { languageLocale } from "@/lib/i18n";

/** Locale for the language remembered on this device (set from Settings). */
export function appLocale() {
  if (typeof window === "undefined") return "en-IN";
  return languageLocale(localStorage.getItem("sl-lang") || "en");
}

export function formatPct(value: number) {
  return new Intl.NumberFormat(appLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value || 0) + "%";
}
