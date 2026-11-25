import type { Proposal } from "./rules/types";
import type { ManagerView, Snapshot } from "./store/types";

/**
 * Today's work, the way an Amazon manager actually works: a few jobs, not 20 cards of single bid tweaks.
 *   Block wasteful searches · Lower bids that overspend · Raise bids on winners · New exact campaign from winners ·
 *   Raise budgets on winners · Cut budgets on losers · Placements · Low-stock ads · Structure,
 * plus Seller Central jobs from the latest reports (restock, listings not selling, Buy Box).
 * Each job is approved once (all its changes, or the ones left ticked). Claude's picks decide the order and the
 * "why now" line; without them, risks first, then money.
 */
export type JobKind = "negatives" | "bids_down" | "bids_up" | "new_campaign" | "budget_up" | "budget_down" | "placement" | "stock_ads" | "structure" | "restock" | "listings" | "buybox";
export type JobMode = "auto" | "create" | "manual";

export interface JobItem { code: string; label: string; detail: string; value: number; picked?: boolean; sku?: string; qty?: number }
export interface Job {
  id: string;
  kind: JobKind;
  icon: string;
  title: string;
  summary: string;
  value: number;
  mode: JobMode;
  /** Approvable codes (empty for Seller Central jobs that are steps only). */
  codes: string[];
  items: JobItem[];
  why?: string;
  steps?: string;
  /** Manual jobs: why Rocco can't do this one for you (shown on the card). */
  manualWhy?: string;
}

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const s = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const money = (n?: number) => (typeof n === "number" ? `$${n.toFixed(2)}` : "?");

function itemOf(p: Proposal): JobItem {
  const where = p.campaign && !p.campaign.startsWith("(") ? p.campaign : "";
  // Low-stock items: the product name (from the reason, "Name: N days of stock…"), not the SKU code.
  const label = p.kind === "budget" || p.kind === "placement" ? p.campaign : p.kind === "ads_down" && p.reason.includes(": ") ? p.reason.split(": ")[0] : `“${p.target}”`;
  const change = p.kind === "bid" || p.kind === "budget" ? `${money(p.current)} → ${money(p.proposed)}` : p.kind === "harvest" && p.proposed ? `exact, bid ${money(p.proposed)}` : "";
  return { code: p.code, label, detail: [change, p.kind === "budget" ? "" : where].filter(Boolean).join(" · "), value: p.valueMonthly };
}

const META: Record<Exclude<JobKind, "restock" | "listings" | "buybox">, { icon: string; title: (n: number, v: number) => string; summary: (n: number, v: number) => string; mode: JobMode }> = {
  negatives: { icon: "✂️", mode: "auto", title: (n) => `Block ${s(n, "search", "searches")} that waste money`, summary: (_, v) => `They get clicks but no orders. Blocking them saves ~${$(v)}/mo.` },
  bids_down: { icon: "📉", mode: "auto", title: (n) => `Lower ${s(n, "bid")} that overspend`, summary: (_, v) => `Above your target ACoS. Bringing them back saves ~${$(v)}/mo.` },
  bids_up: { icon: "📈", mode: "auto", title: (n) => `Raise ${s(n, "bid")} on winners`, summary: () => `Profitable and under target ACoS: room to win more sales.` },
  new_campaign: { icon: "🌱", mode: "create", title: (n) => `New exact campaign: ${s(n, "proven search", "proven searches")}`, summary: () => `These searches already sell. I'll give them their own exact campaign and stop paying twice for them in the old one.` },
  budget_up: { icon: "💰", mode: "auto", title: (n) => `Raise ${s(n, "budget")} on profitable campaigns`, summary: (_, v) => `They run out of money while under target ACoS. ~${$(v)}/mo more sales.` },
  budget_down: { icon: "🧯", mode: "auto", title: (n) => `Cut ${s(n, "budget")} on losing campaigns`, summary: (_, v) => `Spending above breakeven. ~${$(v)}/mo back while bids get fixed.` },
  placement: { icon: "🎯", mode: "manual", title: (n) => `Tune placements on ${s(n, "campaign")}`, summary: () => `Top-of-search vs product pages: shift money to where it converts.` },
  stock_ads: { icon: "📦", mode: "manual", title: (n) => `Ease ads on ${s(n, "low-stock product")}`, summary: () => `Don't pay for clicks you can't ship.` },
  structure: { icon: "🧹", mode: "manual", title: (n) => `Clean up ${s(n, "structure issue")}`, summary: () => `Overlaps and leaks between campaigns.` },
};

function kindOf(p: Proposal): keyof typeof META {
  if (p.kind === "negative") return "negatives";
  if (p.kind === "bid") return (p.proposed ?? 0) < (p.current ?? 0) ? "bids_down" : "bids_up";
  if (p.kind === "harvest") return "new_campaign";
  if (p.kind === "budget") return (p.proposed ?? 0) < (p.current ?? 0) ? "budget_down" : "budget_up";
  if (p.kind === "ads_down") return "stock_ads";
  return p.kind as "placement" | "structure";
}

export function restockTitle(n: number, out: number): string {
  if (out >= n) return n === 1 ? "Restock 1 product: it's out of stock" : `Restock ${n} products: they're out of stock`;
  if (out > 0) return `Restock ${n} products (${out} already out of stock)`;
  return n === 1 ? "Restock 1 product before it runs out" : `Restock ${n} products before they run out`;
}

/** Seller Central jobs from the latest reports (steps, not approvals). */
function sellerJobs(snaps: { inv?: Snapshot; biz?: Snapshot; lh?: Snapshot }): Job[] {
  const out: Job[] = [];
  const f = (x?: Snapshot) => (x?.extra?.findings ?? []) as { title: string; detail?: string; valueMonthly?: number }[];
  const atRisk = Number(snaps.inv?.stats.atRisk ?? 0);
  if (atRisk > 0) {
    // Only the running-out findings (the inventory report also flags overstock and dead stock: different jobs).
    const items = (f(snaps.inv) as { title: string; detail?: string; valueMonthly?: number; restock?: { sku: string; suggest: number } }[]).filter((x) => x.restock || /stock left|run(s)? out|out of stock/i.test(`${x.title} ${x.detail ?? ""}`)).slice(0, 8).map((x, i) => ({ code: `R${i + 1}`, label: x.title, detail: x.detail ?? "", value: x.valueMonthly ?? 0, ...(x.restock ? { sku: x.restock.sku, qty: x.restock.suggest } : {}) }));
    out.push({ id: "restock", kind: "restock", icon: "🚚", title: restockTitle(atRisk, items.filter((x) => /out of stock/i.test(x.label)).length), summary: "Running out costs sales and ranking. Send a shipment to FBA now.", value: items.reduce((t, x) => t + x.value, 0), mode: "manual", codes: [], items, steps: "Seller Central → Inventory → FBA Inventory → Restock Inventory, then Send to Amazon for these SKUs." });
  }
  const notSelling = Number(snaps.lh?.stats.problems ?? 0);
  if (notSelling > 0) out.push({ id: "listings", kind: "listings", icon: "🚨", title: `Fix ${s(notSelling, "listing")} that can't sell`, summary: "Suppressed or inactive listings: every day off is lost sales.", value: 0, mode: "manual", codes: [], items: f(snaps.lh).slice(0, 8).map((x, i) => ({ code: `L${i + 1}`, label: x.title, detail: x.detail ?? "", value: 0 })), steps: "Seller Central → Inventory → Manage All Inventory → filter Inactive/Suppressed → Fix." });
  const bb = Number(snaps.biz?.stats.buyBoxLow ?? 0);
  if (bb > 0) out.push({ id: "buybox", kind: "buybox", icon: "⚠️", title: `Win back the Buy Box on ${s(bb, "product")}`, summary: "Without the Buy Box, ads and organic traffic don't turn into your sales.", value: 0, mode: "manual", codes: [], items: [], steps: "Seller Central → Pricing → Manage Pricing: check competing offers, price and stock for these ASINs." });
  return out;
}

const RISK: JobKind[] = ["restock", "listings", "buybox", "stock_ads"];

/** Why a job is steps for you, not one tap (honest, so a manual card never feels like a missing button). */
export const MANUAL_WHY: Partial<Record<JobKind, string>> = {
  restock: "Steps for you in Seller Central (about 10 minutes). Connect Amazon directly and I create the shipment plan for you.",
  listings: "You do this one: fixing a suppressed listing means editing it in Seller Central.",
  buybox: "You do this one: price and offer changes stay with you.",
  stock_ads: "You do this one for now: easing one product's ads isn't one tap yet. Steps below.",
  placement: "You do this one for now: placement changes aren't one-tap yet.",
  structure: "You do this one for now: structure fixes need a look before anything moves.",
};

export function buildJobs(proposals: Proposal[], o: { plan?: ManagerView | null; inv?: Snapshot; biz?: Snapshot; lh?: Snapshot } = {}): Job[] {
  const groups = new Map<keyof typeof META, Proposal[]>();
  for (const p of proposals) { const k = kindOf(p); groups.set(k, [...(groups.get(k) ?? []), p]); }
  const picked = new Map<string, { order: number; why: string }>();
  (o.plan?.picks ?? []).forEach((pk, i) => pk.codes.forEach((c) => picked.set(c, { order: i, why: pk.why })));

  const jobs: (Job & { rank: number })[] = [];
  for (const [k, ps] of groups) {
    const m = META[k];
    const sorted = [...ps].sort((a, b) => (picked.has(a.code) ? 0 : 1) - (picked.has(b.code) ? 0 : 1) || b.valueMonthly - a.valueMonthly);
    const value = ps.reduce((t, p) => t + p.valueMonthly, 0);
    const pick = sorted.map((p) => picked.get(p.code)).filter(Boolean).sort((a, b) => a!.order - b!.order)[0];
    jobs.push({
      id: k, kind: k, icon: m.icon, mode: m.mode, title: m.title(ps.length, value), summary: m.summary(ps.length, value), value,
      codes: sorted.map((p) => p.code), items: sorted.map((p) => ({ ...itemOf(p), picked: picked.has(p.code) })), why: pick?.why,
      rank: pick ? pick.order : 100 + (RISK.includes(k) ? -50 : 0) - Math.min(value, 49_999) / 1000,
    });
  }
  for (const j of sellerJobs(o)) jobs.push({ ...j, rank: 40 + RISK.indexOf(j.kind) });
  return jobs.sort((a, b) => a.rank - b.rank).map(({ rank: _rank, ...j }) => (j.mode === "manual" && MANUAL_WHY[j.kind] ? { ...j, manualWhy: MANUAL_WHY[j.kind] } : j));
}
