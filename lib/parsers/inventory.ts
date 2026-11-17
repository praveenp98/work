import { findColumns, headerRowWith } from "./columns";
import { toNumber } from "./normalize";

/** FBA Restock Inventory report (or any inventory export with stock + 30-day sales or days of supply). */
export interface InventoryRow {
  sku: string;
  asin: string;
  name: string;
  available: number;
  inbound: number;
  sold30: number; // -1 if missing
  daysOfSupply: number; // -1 if missing
}

const SPEC = {
  sku: ["merchant sku", "sku", "seller-sku", "seller sku"],
  asin: ["asin"],
  name: ["product name", "product-name", "title"],
  available: ["available", "afn fulfillable quantity", "fulfillable quantity", "available quantity"],
  inbound: ["inbound", "afn inbound shipped quantity", "inbound quantity"],
  sold30: ["units sold last 30 days", "unit sales last 30 days", "units shipped last 30 days"],
  dos: ["total days of supply (including units from open shipments)", "days of supply at amazon fulfillment network", "total days of supply", "days of supply"],
};

export function isInventoryReport(table: unknown[][]) {
  const hi = headerRowWith(table, SPEC, ["available"]);
  if (hi < 0) return false;
  const c = findColumns(table[hi], SPEC);
  return (c.sku !== undefined || c.asin !== undefined) && (c.sold30 !== undefined || c.dos !== undefined);
}

export function parseInventoryReport(table: unknown[][]): InventoryRow[] {
  if (!isInventoryReport(table)) throw new Error("Not an inventory report Rocco can read. Use FBA → Restock Inventory (needs Available and Units Sold Last 30 Days).");
  const hi = headerRowWith(table, SPEC, ["available"]);
  const c = findColumns(table[hi], SPEC);
  const g = (r: unknown[], i?: number) => (i === undefined ? undefined : r[i]);
  const rows: InventoryRow[] = [];
  for (const r of table.slice(hi + 1)) {
    const sku = String(g(r, c.sku) ?? "").trim();
    const asin = String(g(r, c.asin) ?? "").trim();
    if (!sku && !asin) continue;
    rows.push({
      sku, asin,
      name: String(g(r, c.name) ?? "").trim(),
      available: toNumber(g(r, c.available)),
      inbound: toNumber(g(r, c.inbound)),
      sold30: c.sold30 === undefined ? -1 : toNumber(g(r, c.sold30)),
      daysOfSupply: c.dos === undefined ? -1 : toNumber(g(r, c.dos)),
    });
  }
  return rows;
}
