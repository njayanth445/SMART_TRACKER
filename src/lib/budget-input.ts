/** Accept native Telugu/Hindi digits while storing numeric budget values. */
export function parseBudgetAmount(text: string): number | null {
  const normalized = text.trim().replace(/[౦-౯]/g, (digit) => String(digit.charCodeAt(0) - 0x0c66)).replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - 0x0966)).replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}