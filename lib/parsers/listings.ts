import { findColumns, headerRowWith } from "./columns";

/**
 * Listing health: Seller Central's Suppressed Listings / "Fix your products" report, the All Listings report
 * (status column), or listing issues from Amazon's Selling Partner connector (Listings Items API: sku, asin,
 * status, issues). One row per listing.
 */
export interface ListingRow {
  sku: string;
  asin: string;
  name: string;
  status: string; // as reported: Active, Inactive, Incomplete, Search Suppressed, DISCOVERABLE, BUYABLE…
  issue: string; // what Amazon says is wrong, if anything
}

const SPEC = {
  sku: ["seller-sku", "seller sku", "sku", "merchant sku"],
  asin: ["asin1", "asin"],
  name: ["item-name", "item name", "product name", "product-name", "title"],
  status: ["status", "listing status", "item status"],
  issue: ["issue description", "issues", "issue", "reason", "suppression reason", "alert", "status reason", "issue-description"],
};

export function isListingsReport(table: unknown[][]): boolean {
  const hi = headerRowWith(table, SPEC, ["sku"]);
  if (hi < 0) return false;
  const c = findColumns(table[hi], SPEC);
  if (c.status === undefined && c.issue === undefined) return false;
  // Inventory/restock exports also have SKUs; they carry stock columns, listings reports don't.
  const head = (table[hi] ?? []).map((h) => String(h ?? "").toLowerCase());
  return !head.some((h) => /available|fulfillable|units sold|days of supply|sessions/.test(h));
}

export function parseListingsReport(table: unknown[][]): ListingRow[] {
  const hi = headerRowWith(table, SPEC, ["sku"]);
  if (hi < 0 || !isListingsReport(table)) throw new Error("Not a listings report Rocco can read. Use Seller Central → Inventory → Inventory Reports → All Listings, or the Suppressed Listings report.");
  const c = findColumns(table[hi], SPEC);
  const g = (r: unknown[], i?: number) => (i === undefined ? "" : String(r[i] ?? "").trim());
  const rows: ListingRow[] = [];
  for (const r of table.slice(hi + 1)) {
    const sku = g(r, c.sku);
    if (!sku) continue;
    rows.push({ sku, asin: g(r, c.asin), name: g(r, c.name), status: g(r, c.status), issue: cleanIssue(g(r, c.issue)) });
  }
  return rows;
}

/** Connector output often has issues as a JSON array: keep the human message(s). */
function cleanIssue(s: string): string {
  // From connector JSON flattened as "ERROR: Price is missing; WARNING: …": keep errors and warnings only.
  if (/^(ERROR|WARNING|INFO): /.test(s)) return s.split("; ").filter((x) => !/^INFO: /.test(x)).map((x) => x.replace(/^(ERROR|WARNING): /, "")).join("; ");
  if (!s.startsWith("[") && !s.startsWith("{")) return s;
  try {
    const v = JSON.parse(s) as unknown;
    const list = (Array.isArray(v) ? v : [v]) as { message?: string; severity?: string }[];
    return list.filter((x) => !x.severity || /error|warning/i.test(x.severity)).map((x) => x.message ?? "").filter(Boolean).join("; ");
  } catch { return s; }
}
