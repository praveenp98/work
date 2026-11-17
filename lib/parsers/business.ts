import { findColumns, headerRowWith } from "./columns";
import { toNumber } from "./normalize";

/** Seller Central → Reports → Business Reports → Detail Page Sales and Traffic by Child Item. */
export interface BusinessRow {
  asin: string;
  title: string;
  sessions: number;
  pageViews: number;
  units: number;
  sales: number;
  buyBoxPct: number; // 0–100, -1 if missing
}

const SPEC = {
  asin: ["(child) asin", "child asin", "asin"],
  title: ["title", "product name"],
  sessions: ["sessions - total", "sessions total", "sessions"],
  pageViews: ["page views - total", "page views total", "page views"],
  units: ["units ordered", "units ordered total"],
  sales: ["ordered product sales", "ordered product sales total"],
  buyBox: ["featured offer (buy box) percentage", "featured offer percentage", "buy box percentage"],
};

export function isBusinessReport(table: unknown[][]) {
  return headerRowWith(table, SPEC, ["asin", "sessions", "units"]) >= 0;
}

export function parseBusinessReport(table: unknown[][]): BusinessRow[] {
  const hi = headerRowWith(table, SPEC, ["asin", "sessions", "units"]);
  if (hi < 0) throw new Error("Not a Business Report. Use Detail Page Sales and Traffic by Child Item.");
  const c = findColumns(table[hi], SPEC);
  const g = (r: unknown[], i?: number) => (i === undefined ? undefined : r[i]);
  const rows: BusinessRow[] = [];
  for (const r of table.slice(hi + 1)) {
    const asin = String(g(r, c.asin) ?? "").trim();
    if (!asin) continue;
    rows.push({
      asin,
      title: String(g(r, c.title) ?? "").trim(),
      sessions: toNumber(g(r, c.sessions)),
      pageViews: toNumber(g(r, c.pageViews)),
      units: toNumber(g(r, c.units)),
      sales: toNumber(g(r, c.sales)),
      buyBoxPct: c.buyBox === undefined ? -1 : toNumber(g(r, c.buyBox)),
    });
  }
  return rows;
}
