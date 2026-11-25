import Papa from "papaparse";
import { exportCsv, findSource, type Pull } from "./datadoe-sync";
import { fetchListings, type Listing } from "./listings";

/**
 * Instant first look (Nov 25): what Rocco can tell from live data in a minute or two, while Amazon's history loads
 * (which takes hours). Two reads: the Listings snapshot (every SKU's status, price, FBA stock, keywords, bullets,
 * costs; no date range, so it's there right after connecting) and Amazon's own issue check on the top listings.
 * Facts only, no estimates: counts and named SKUs.
 */
export const LISTINGS: Pull = {
  kind: "inventory", table: "amazon_listings_with_cogs", query: "listings", days: 1, shape: "latest_by_sku",
  cols: {
    sku: "_sku", child_asin: "_asin", item_name: "_name", listing_status: "_status", listing_fulfillment_channel: "_ch",
    listing_price_value: "_price", fba_quantity_available: "_avail", fba_quantity_inbound: "_inb", fba_has_stranded_inventory: "_str",
    generic_keyword: "_kw", bullet_point_1: "_b1", bullet_point_2: "_b2", bullet_point_3: "_b3", cogs_present: "_cogs",
  },
};

export interface LookItem { sku: string; name: string }
export interface Finding { id: string; icon: string; title: string; detail: string; items: LookItem[]; severity: "high" | "medium" | "low" }
export interface FirstLook { at: string; skus: number; active: number; findings: Finding[]; checked: number; error?: string }

const num = (v: unknown) => { const x = Number(String(v ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(x) ? x : 0; };
const yes = (v: unknown) => /^(true|1|yes|y)$/i.test(String(v ?? "").trim());
const short = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
const item = (r: Record<string, unknown>): LookItem => ({ sku: String(r.sku ?? ""), name: short(r.item_name) || String(r.sku ?? "") });

/** Rules over the listings snapshot (+ Amazon's issue check). Pure; tested in lib/first-look.test.ts. */
export function analyzeLook(rows: Record<string, unknown>[], checked: Listing[] = [], now = new Date()): FirstLook {
  const all = rows.filter((r) => r.sku);
  const active = all.filter((r) => /active/i.test(String(r.listing_status ?? "")) && !/inactive/i.test(String(r.listing_status ?? "")));
  const fba = (r: Record<string, unknown>) => /amazon|afn|fba/i.test(String(r.listing_fulfillment_channel ?? ""));
  const f: Finding[] = [];
  const add = (x: Omit<Finding, "items"> & { rows: Record<string, unknown>[] }) => { if (x.rows.length) f.push({ id: x.id, icon: x.icon, title: x.title, detail: x.detail, severity: x.severity, items: x.rows.slice(0, 8).map(item) }); };

  add({ id: "oos", icon: "📦", severity: "high", title: "out of stock at Amazon, nothing on the way", detail: "Shoppers can't buy these from FBA right now, and any ads on them are wasted clicks.",
    rows: all.filter((r) => fba(r) && num(r.fba_quantity_available) === 0 && num(r.fba_quantity_inbound) === 0 && !/inactive|closed/i.test(String(r.listing_status ?? ""))) });
  add({ id: "stranded", icon: "🧊", severity: "high", title: "with stranded stock", detail: "Units sit in Amazon's warehouse but can't sell until the listing is fixed. They also pay storage.",
    rows: all.filter((r) => yes(r.fba_has_stranded_inventory)) });
  const issues = checked.filter((l) => l.issues.some((i) => i.severity === "ERROR"));
  if (issues.length) f.push({ id: "issues", icon: "🚨", severity: "high", title: "with errors Amazon flagged on the listing", detail: issues[0].issues.find((i) => i.severity === "ERROR")?.message.slice(0, 160) ?? "Amazon reports errors that can stop them selling.", items: issues.slice(0, 8).map((l) => ({ sku: l.sku, name: short(l.title) || l.sku })) });
  add({ id: "inactive", icon: "⏸️", severity: "medium", title: "inactive", detail: "Listed but not for sale. Some are on purpose; check the ones that should be selling.",
    rows: all.filter((r) => /inactive/i.test(String(r.listing_status ?? ""))) });
  add({ id: "kw", icon: "🔎", severity: "medium", title: "with no backend search terms", detail: "Backend search terms are free extra reach: words shoppers use that don't fit in the title.",
    rows: active.filter((r) => !String(r.generic_keyword ?? "").trim()) });
  add({ id: "bullets", icon: "📝", severity: "low", title: "with fewer than 3 bullet points", detail: "Bullets are where shoppers decide. Thin ones convert worse.",
    rows: active.filter((r) => [r.bullet_point_1, r.bullet_point_2, r.bullet_point_3].filter((b) => String(b ?? "").trim()).length < 3) });
  add({ id: "cogs", icon: "🧾", severity: "low", title: "with no product cost entered", detail: "Without cost per unit I can't show real profit or break-even ACoS for them.",
    rows: active.filter((r) => !yes(r.cogs_present)) });

  const order = { high: 0, medium: 1, low: 2 };
  // Count shown in the title is the real total, not the 8 named.
  const totals: Record<string, number> = {
    oos: all.filter((r) => fba(r) && num(r.fba_quantity_available) === 0 && num(r.fba_quantity_inbound) === 0 && !/inactive|closed/i.test(String(r.listing_status ?? ""))).length,
    stranded: all.filter((r) => yes(r.fba_has_stranded_inventory)).length, issues: issues.length,
    inactive: all.filter((r) => /inactive/i.test(String(r.listing_status ?? ""))).length,
    kw: active.filter((r) => !String(r.generic_keyword ?? "").trim()).length,
    bullets: active.filter((r) => [r.bullet_point_1, r.bullet_point_2, r.bullet_point_3].filter((b) => String(b ?? "").trim()).length < 3).length,
    cogs: active.filter((r) => !yes(r.cogs_present)).length,
  };
  const findings = f.map((x) => ({ ...x, title: `${totals[x.id]} SKU${totals[x.id] === 1 ? "" : "s"} ${x.title}` })).sort((a, b) => order[a.severity] - order[b.severity]);
  return { at: now.toISOString(), skus: all.length, active: active.length, findings, checked: checked.length };
}

/** Live reads: one Listings export + Amazon's issue check on up to 20 active SKUs (FBA in stock first). */
export async function pullFirstLook(accountId: string, now = new Date()): Promise<FirstLook> {
  const src = await findSource(accountId, LISTINGS);
  if (!src) return { at: now.toISOString(), skus: 0, active: 0, findings: [], checked: 0, error: "Amazon hasn't sent your listings yet. I'll try again in a few minutes." };
  const rows = Papa.parse<Record<string, unknown>>(await exportCsv(accountId, src, LISTINGS, now), { header: true, skipEmptyLines: true }).data;
  const top = rows.filter((r) => /active/i.test(String(r.listing_status ?? "")) && !/inactive/i.test(String(r.listing_status ?? "")))
    .sort((a, b) => num(b.fba_quantity_available) - num(a.fba_quantity_available)).slice(0, 20).map((r) => String(r.sku));
  const checked = top.length ? (await fetchListings(accountId, top).catch(() => ({ listings: [] as Listing[] }))).listings : [];
  return analyzeLook(rows, checked, now);
}
