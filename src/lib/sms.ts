import { todayISO } from "./finance";

export type ParsedSms = {
  raw: string;
  kind: "income" | "expense";
  amount: number;
  date: string;
  party: string;
  category: string;
  payment_method: string;
};

const CREDIT = /\b(credited|received|deposited|refund(ed)?|cr\b|credit of)/i;
const DEBIT = /\b(debited|spent|paid|withdrawn|purchase|sent|dr\b|debit of|txn of|transferred)/i;
const OTP = /\b(otp|one[- ]time password|verification code)\b/i;
const AMOUNT = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

const CATEGORY_HINTS: [RegExp, string][] = [
  [/swiggy|zomato|restaurant|cafe|food|dominos|kfc|mcdonald/i, "Food"],
  [/uber|ola|rapido|irctc|metro|fuel|petrol|indian oil|hpcl|bpcl/i, "Transport"],
  [/amazon|flipkart|myntra|ajio|meesho|mart|store/i, "Shopping"],
  [/netflix|hotstar|prime video|spotify|bookmyshow|pvr/i, "Entertainment"],
  [/electricity|bescom|airtel|jio|vodafone|\bvi\b|recharge|broadband|gas|water bill/i, "Bills"],
  [/rent/i, "Rent"],
  [/hospital|pharmacy|apollo|medplus|clinic/i, "Healthcare"],
  [/school|college|course|udemy|fees/i, "Education"],
];

function parseDate(s: string): string {
  const today = todayISO();
  const mon = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
  let m = s.match(/\b(\d{1,2})[-/ ](\d{1,2})[-/ ](\d{2,4})\b/);
  let iso: string | null = null;
  if (m) {
    const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!;
    iso = `${y}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  } else if ((m = s.match(new RegExp(`\\b(\\d{1,2})[- ]?(${mon})[a-z]*[- ]?(\\d{2,4})?\\b`, "i")))) {
    const idx = mon.split("|").indexOf(m[2]!.toLowerCase()) + 1;
    const y = m[3] ? (m[3].length === 2 ? `20${m[3]}` : m[3]) : today.slice(0, 4);
    iso = `${y}-${String(idx).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  }
  if (!iso || isNaN(new Date(iso).getTime()) || iso > today) return today;
  return iso;
}

function party(s: string): string {
  const all = [...s.matchAll(/\b(?:to|at|from|by|towards)\s+(?:VPA\s+)?([A-Za-z0-9@._& -]{2,40}?)(?=\s+(?:on|ref|via|using|upi|avl|a\/c|bal)\b|\.|$)/gi)]
    .map((x) => x[1]!.trim()).filter((p) => !/^(your|you|a\/c|ac|account|upi|imps|neft)\b/i.test(p));
  if (all.length) return all[all.length - 1]!;
  const m = s.match(/\b(?:to|at|from|by|towards)\s+(?:VPA\s+)?([A-Za-z0-9@._& -]{2,40}?)(?=\s+(?:on|ref|via|using|upi|avl|a\/c|bal|\.|$))/i);
  return (m?.[1] ?? "").trim();
}

export function parseSms(raw: string): ParsedSms | null {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s || OTP.test(s)) return null;
  const a = s.match(AMOUNT);
  if (!a) return null;
  const amount = Number(a[1]!.replace(/,/g, ""));
  if (!amount || amount <= 0) return null;
  const isCredit = CREDIT.test(s), isDebit = DEBIT.test(s);
  if (!isCredit && !isDebit) return null;
  // "debited ... credited to X" → the debit wins (money left your account)
  const kind: ParsedSms["kind"] = isDebit && (!isCredit || s.search(DEBIT) < s.search(CREDIT)) ? "expense" : "income";
  const p = party(s);
  const category = kind === "income" ? (/salary/i.test(s) ? "Salary" : "Other") : CATEGORY_HINTS.find(([r]) => r.test(s))?.[1] ?? "Other";
  const payment_method = /upi|vpa/i.test(s) ? "UPI" : /credit card/i.test(s) ? "Credit Card" : /debit card|atm|pos/i.test(s) ? "Debit Card" : /neft|imps|rtgs/i.test(s) ? "Bank Transfer" : "Other";
  return { raw: s, kind, amount, date: parseDate(s), party: p, category, payment_method };
}

/** Split pasted text into messages (blank lines, or lines each looking like a separate SMS). */
export function parseMany(text: string): ParsedSms[] {
  const chunks = text.split(/\n\s*\n/).flatMap((c) => (c.split("\n").filter((l) => AMOUNT.test(l)).length > 1 ? c.split("\n") : [c]));
  return chunks.map(parseSms).filter((x): x is ParsedSms => !!x);
}

/** Indian mobile: 10 digits starting 6-9, optional +91 / 91 / 0 prefix. */
export function normalizeIndianPhone(v: string): string | null {
  const d = v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(d) ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : null;
}
