import { normHeader, toDate, toNumber } from "./normalize";

export type ReportType = "sp_search_term";

export interface SearchTermRow {
  campaign: string;
  adGroup: string;
  targeting: string;
  matchType: string; // EXACT | PHRASE | BROAD | "-" (auto/product targets)
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  date: Date | null;
  endDate: Date | null;
}

export interface ParsedReport {
  type: ReportType;
  rows: SearchTermRow[];
  currency: string;
  days: number; // length of the period covered by the report
  warnings: string[];
}

type Field = keyof Omit<SearchTermRow, "date" | "endDate"> | "date" | "startDate" | "endDate" | "currency";

/** Header synonyms, matched against normHeader() output. First exact match wins, then prefix match. */
const FIELDS: Record<Field, string[]> = {
  campaign: ["campaign name", "campaign"],
  adGroup: ["ad group name", "ad group"],
  targeting: ["targeting", "keyword", "target", "keyword or product targeting"],
  matchType: ["match type"],
  searchTerm: ["customer search term", "search term", "customer search terms"],
  impressions: ["impressions"],
  clicks: ["clicks"],
  spend: ["spend", "cost", "total cost"],
  sales: ["7 day total sales", "14 day total sales", "total sales", "sales", "7 day sales", "14 day sales"],
  orders: ["7 day total orders", "14 day total orders", "total orders", "orders", "purchases", "7 day total orders"],
  date: ["date"],
  startDate: ["start date"],
  endDate: ["end date"],
  currency: ["currency"],
};

const REQUIRED: Field[] = ["searchTerm", "clicks", "spend"];

function findColumns(header: unknown[]): Partial<Record<Field, number>> | null {
  const norm = header.map(normHeader);
  const cols: Partial<Record<Field, number>> = {};
  for (const f of Object.keys(FIELDS) as Field[]) {
    const syns = FIELDS[f];
    let idx = -1;
    for (const s of syns) {
      idx = norm.indexOf(s);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      for (const s of syns) {
        idx = norm.findIndex((h) => h.startsWith(s + " ") || h === s);
        if (idx >= 0) break;
      }
    }
    if (idx >= 0) cols[f] = idx;
  }
  // "targeting" must not swallow "customer search term"
  if (cols.targeting !== undefined && cols.targeting === cols.searchTerm) delete cols.targeting;
  return REQUIRED.every((f) => cols[f] !== undefined) ? cols : null;
}

/** Report-type detection by header row. Scans the first 10 rows (some exports have a title row). */
export function detectReport(table: unknown[][]): { type: ReportType; headerRow: number } | null {
  for (let i = 0; i < Math.min(10, table.length); i++) {
    if (findColumns(table[i] ?? [])) return { type: "sp_search_term", headerRow: i };
  }
  return null;
}

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", CAD: "C$", GBP: "£", EUR: "€", INR: "₹", AUD: "A$", MXN: "MX$", JPY: "¥" };

export function parseSearchTermReport(table: unknown[][]): ParsedReport {
  const det = detectReport(table);
  if (!det) throw new Error("This doesn't look like a Sponsored Products search term report. Rocco needs columns for Customer Search Term, Clicks and Spend.");
  const header = table[det.headerRow];
  const cols = findColumns(header)!;
  const warnings: string[] = [];
  if (cols.orders === undefined) warnings.push("No orders column found; conversions are estimated from sales only.");
  if (cols.sales === undefined) warnings.push("No sales column found; ACoS can't be calculated.");

  const get = (r: unknown[], f: Field) => (cols[f] === undefined ? undefined : r[cols[f]!]);
  const rows: SearchTermRow[] = [];
  let minD: number | null = null;
  let maxD: number | null = null;
  let currency = "";
  const symbolFromHeader = header.map(String).join(" ").match(/[$£€₹¥]/)?.[0] ?? "";

  for (let i = det.headerRow + 1; i < table.length; i++) {
    const r = table[i] ?? [];
    const term = String(get(r, "searchTerm") ?? "").trim();
    if (!term) continue;
    const sales = toNumber(get(r, "sales"));
    let orders = toNumber(get(r, "orders"));
    if (cols.orders === undefined && sales > 0) orders = 1;
    const d1 = toDate(get(r, "date") ?? get(r, "startDate"));
    const d2 = toDate(get(r, "endDate")) ?? d1;
    for (const d of [d1, d2]) {
      if (!d) continue;
      const t = d.getTime();
      minD = minD === null ? t : Math.min(minD, t);
      maxD = maxD === null ? t : Math.max(maxD, t);
    }
    if (!currency) currency = String(get(r, "currency") ?? "").trim().toUpperCase();
    rows.push({
      campaign: String(get(r, "campaign") ?? "").trim(),
      adGroup: String(get(r, "adGroup") ?? "").trim(),
      targeting: String(get(r, "targeting") ?? "").trim(),
      matchType: String(get(r, "matchType") ?? "").trim().toUpperCase() || "-",
      searchTerm: term,
      impressions: toNumber(get(r, "impressions")),
      clicks: toNumber(get(r, "clicks")),
      spend: toNumber(get(r, "spend")),
      sales,
      orders,
      date: d1,
      endDate: d2,
    });
  }
  if (rows.length === 0) throw new Error("Found the header row but no data rows.");

  let days = 30;
  if (minD !== null && maxD !== null) days = Math.max(1, Math.round((maxD - minD) / 86400000) + 1);
  else warnings.push("No dates found; assuming the report covers 30 days.");

  const symbol = CURRENCY_SYMBOL[currency] ?? (symbolFromHeader || "$");
  return { type: det.type, rows, currency: symbol, days, warnings };
}
