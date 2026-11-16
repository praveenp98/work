/** Normalize a header cell: lowercase, drop currency/units in brackets, keep letters+digits. */
export function normHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parse "$1,234.56", "12.5%", "₹ 90", "-", "" into a number (NaN-safe → 0). */
export function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s || s === "-" || s === "--") return 0;
  // European style "1.234,56" → "1234.56"
  let clean = s.replace(/[^0-9,.\-]/g, "");
  if (/,\d{1,2}$/.test(clean) && clean.includes(".")) clean = clean.replace(/\./g, "").replace(",", ".");
  else if (/^\-?\d+,\d{1,2}$/.test(clean)) clean = clean.replace(",", ".");
  else clean = clean.replace(/,/g, "");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

export function toDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
