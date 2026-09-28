const dict = {
  en: {
    dashboard: "Dashboard", expenses: "Expenses", income: "Income", budgets: "Budgets", analytics: "Analytics",
    insights: "Insights", reports: "Reports", notifications: "Notifications", profile: "Profile", settings: "Settings",
    logout: "Log out", addExpense: "Add expense", addIncome: "Add income", greeting: "Hello", sms: "Bank SMS",
  },
  te: {
    dashboard: "డాష్‌బోర్డ్", expenses: "ఖర్చులు", income: "ఆదాయం", budgets: "బడ్జెట్లు", analytics: "విశ్లేషణ",
    insights: "అంతర్దృష్టులు", reports: "నివేదికలు", notifications: "నోటిఫికేషన్లు", profile: "ప్రొఫైల్", settings: "సెట్టింగ్‌లు",
    logout: "లాగ్ అవుట్", addExpense: "ఖర్చు జోడించండి", addIncome: "ఆదాయం జోడించండి", greeting: "నమస్తే", sms: "బ్యాంక్ SMS",
  },
  hi: {
    dashboard: "डैशबोर्ड", expenses: "खर्च", income: "आय", budgets: "बजट", analytics: "विश्लेषण",
    insights: "अंतर्दृष्टि", reports: "रिपोर्ट", notifications: "सूचनाएँ", profile: "प्रोफ़ाइल", settings: "सेटिंग्स",
    logout: "लॉग आउट", addExpense: "खर्च जोड़ें", addIncome: "आय जोड़ें", greeting: "नमस्ते", sms: "बैंक SMS",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];
export function t(lang: string | undefined, key: TKey) {
  const d = (dict as Record<string, Record<TKey, string>>)[lang ?? "en"] ?? dict.en;
  return d[key] ?? dict.en[key];
}
