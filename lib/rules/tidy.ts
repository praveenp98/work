/**
 * "Tidy your campaigns": the structure a top 1% ads manager keeps, so 200+ campaigns read at a glance.
 *   Name:      SP | <Product> | <Targeting> | <Detail>      e.g. "SP | Morning Sidekick Journal | Exact | morning routine journal"
 *   Portfolio: one per product (budget caps and reporting per product)
 *   Flags:     campaigns mixing match types (split them), campaigns that did nothing in 30 days (pause them)
 * Pure: the scan (lib/tidy-scan.ts) gathers the inputs from DataDoe; this decides the plan.
 */
export type Targeting = "Auto" | "Exact" | "Phrase" | "Broad" | "Product" | "Category" | "Mixed" | "Unknown";

export interface TidyCampaign { id: string; name: string; state: string; portfolioId?: string; auto: boolean }
export interface TidyTarget { campaignId: string; type: string; match: string; negative: boolean; state: string; keyword?: string }
export interface TidyAd { campaignId: string; products: { id: string; type: string }[] }
export interface TidyProduct { asin: string; sku?: string; title?: string; brand?: string }
export interface TidyPerf { campaignId: string; impressions: number; clicks: number; spend: number; sales: number }

export interface TidyItem {
  id: string;
  oldName: string;
  newName: string;
  product: string;
  targeting: Targeting;
  state: string;
  rename: boolean;
  portfolio?: string; // product portfolio to put it in (only when it has none)
  issue?: "mixed" | "idle" | "no_product";
  note?: string;
  spend: number;
  sales: number;
}

export interface TidyPlan {
  at: string;
  total: number;
  readable: number;
  items: TidyItem[];
  products: { name: string; campaigns: number; spend: number; sales: number }[];
  portfolios: string[];
  mixed: number;
  idle: number;
}

const STOP = new Set(["the", "a", "an", "for", "and", "with", "of", "by", "to", "in", "on", "&"]);

/** "The Morning Sidekick Journal: Habit-Building Morning Routine…" → "Morning Sidekick Journal" */
export function shortProduct(title: string | undefined, brand?: string, fallback = "Product"): string {
  if (!title) return fallback;
  let t = title.split(/[:|(–—\-,]| by /i)[0].trim();
  if (brand && t.toLowerCase().startsWith(brand.toLowerCase() + " ")) t = t.slice(brand.length + 1);
  const words = t.split(/\s+/).filter(Boolean);
  while (words.length && STOP.has(words[0].toLowerCase())) words.shift();
  let out = "";
  for (const w of words) { if ((out + " " + w).trim().length > 30) break; out = (out + " " + w).trim(); }
  const ws = out.split(" ");
  while (ws.length > 1 && STOP.has(ws[ws.length - 1].toLowerCase())) ws.pop();
  return ws.join(" ").replace(/[.,;:!]+$/, "") || fallback;
}

/** One label for a campaign advertising several products: their shared words ("Morning Sidekick Journal"), else the first +N. */
export function familyName(names: string[], brand?: string): string {
  const u = [...new Set(names)];
  if (u.length <= 1) return u[0] ?? "";
  const split = u.map((n) => n.split(" "));
  const common: string[] = [];
  for (let i = 0; i < split[0].length; i++) { const w = split[0][i]; if (split.every((s) => s[i]?.toLowerCase() === w.toLowerCase())) common.push(w); else break; }
  if (common.length >= 2) return common.join(" ");
  // A range ("Morning Sidekick Journal", "Budgeting Sidekick Journal", …): the words every title shares.
  // Words most of the titles share (≥60%), in reading order: "Sidekick Journal".
  const freq = new Map<string, number>();
  for (const s of split) for (const w of new Set(s.map((x) => x.toLowerCase()))) freq.set(w, (freq.get(w) ?? 0) + 1);
  const order = [...new Set(split.flat().map((w) => w.toLowerCase()))];
  const shared = order.filter((w) => (freq.get(w) ?? 0) >= Math.ceil(split.length * 0.6) && !STOP.has(w));
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
  if (shared.length) return `${shared.slice(0, 3).map(cap).join(" ")} Range`;
  if (u.length > 3) return brand ? `${brand} Range` : "Mixed Range";
  const top = [...u].sort((a, b) => names.filter((n) => n === b).length - names.filter((n) => n === a).length)[0];
  return `${top} +${u.length - 1}`;
}

/** A name a human can read: no bare ASINs/ISBNs or 8-digit dates, and it says how it targets. */
export function isReadable(name: string): boolean {
  if (/\b(B0[A-Z0-9]{8}|\d{9}[\dX])\b|\b20\d{6}\b/i.test(name)) return false;
  return /\b(auto|exact|phrase|broad|product|pat|asin|category|cat)\b/i.test(name);
}

/** What's left of an old name once the codes are gone ("BR_0692726713_20191118_morning sidekick journal" → "morning sidekick journal"). */
const CODE_WORDS = /^(sp|sb|sd|br|ow|op|p|hn|new|old|test|optim|opt|atm|kw|kws|pat|auto|man|manual|exact|exa|phrase|phr|broad|brd|product|products|prod|asin|cat|category|campaign|camp|v\d+|\d+)$/i;
export function humanPart(name: string, drop: string[] = []): string {
  const quoted = name.match(/KW\s*=\s*"([^"]+)"/i)?.[1];
  if (quoted) return quoted.trim().slice(0, 40);
  const words = name
    .replace(/Bid\s*=\s*[\d.]+/gi, " ")
    .replace(/[_|·\-–=]+/g, " ") // underscores are word characters: split first, then strip codes
    .split(/\s+/)
    .filter((w) => w && !/^(B0[A-Z0-9]{8}|\d{9}[\dX]|20\d{6})$/i.test(w) && !CODE_WORDS.test(w));
  // Leftovers that only repeat the product name ("Badass", "Budgeting") add nothing; real wording stays whole.
  const product = new Set(drop.flatMap((d) => d.toLowerCase().split(/\s+/)));
  if (words.every((w) => product.has(w.toLowerCase()))) return "";
  return words.join(" ").trim().slice(0, 40);
}

function targetingOf(c: TidyCampaign, ts: TidyTarget[]): { t: Targeting; single?: string } {
  if (c.auto || ts.some((x) => x.type === "AUTO")) return { t: "Auto" };
  const live = ts.filter((x) => !x.negative && x.state !== "ARCHIVED");
  const kinds = new Set(live.map((x) => (x.type === "KEYWORD" ? x.match : x.type === "PRODUCT" ? "PRODUCT" : x.type === "PRODUCT_CATEGORY" ? "CATEGORY" : x.type)));
  const kw = live.filter((x) => x.type === "KEYWORD");
  const single = kw.length === 1 ? kw[0].keyword : undefined;
  if (kinds.size === 0) return { t: "Unknown" };
  if (kinds.size > 1) return { t: "Mixed" };
  const k = [...kinds][0];
  const t: Targeting = k === "EXACT" ? "Exact" : k === "PHRASE" ? "Phrase" : k === "BROAD" ? "Broad" : k === "PRODUCT" ? "Product" : k === "CATEGORY" ? "Category" : "Unknown";
  return { t, single };
}

export function buildTidy(input: { campaigns: TidyCampaign[]; targets: TidyTarget[]; ads: TidyAd[]; products: TidyProduct[]; perf: TidyPerf[]; includePaused?: boolean }, now = new Date()): TidyPlan {
  const byAsinOrSku = new Map<string, TidyProduct>();
  for (const p of input.products) { byAsinOrSku.set(p.asin, p); if (p.sku) byAsinOrSku.set(p.sku, p); }
  const tByC = new Map<string, TidyTarget[]>();
  for (const t of input.targets) tByC.set(t.campaignId, [...(tByC.get(t.campaignId) ?? []), t]);
  const aByC = new Map<string, TidyAd["products"]>();
  for (const a of input.ads) aByC.set(a.campaignId, [...(aByC.get(a.campaignId) ?? []), ...a.products]);
  const perf = new Map(input.perf.map((p) => [p.campaignId, p]));

  const scope = input.campaigns.filter((c) => c.state === "ENABLED" || (input.includePaused && c.state === "PAUSED"));
  const used = new Map<string, number>();
  const items: TidyItem[] = scope.map((c) => {
    const prods = aByC.get(c.id) ?? [];
    const metas = prods.map((p) => byAsinOrSku.get(p.id));
    const brands = metas.map((m) => m?.brand).filter(Boolean) as string[];
    const brand = brands.length ? [...brands].sort((a, b) => brands.filter((x) => x === b).length - brands.filter((x) => x === a).length)[0] : undefined;
    const product = familyName(prods.map((p, k) => shortProduct(metas[k]?.title, metas[k]?.brand, p.id)), brand);
    const { t, single } = targetingOf(c, tByC.get(c.id) ?? []);
    // Detail: the single keyword, else whatever human words the old name had (minus product words already in the name).
    const detail = (single ?? humanPart(c.name, [product])).replace(/\s+/g, " ").trim();
    const productPart = product || "Product";
    let name = ["SP", productPart, t === "Unknown" ? "Manual" : t, detail && detail.toLowerCase() !== productPart.toLowerCase() ? detail : ""].filter(Boolean).join(" | ").slice(0, 120);
    const n = (used.get(name) ?? 0) + 1;
    used.set(name, n);
    if (n > 1) name = `${name} ${n}`;
    const pf = perf.get(c.id);
    const idle = c.state === "ENABLED" && (!pf || pf.impressions === 0);
    const issue: TidyItem["issue"] = idle ? "idle" : t === "Mixed" ? "mixed" : !product ? "no_product" : undefined;
    return {
      id: c.id, oldName: c.name, newName: name, product: productPart, targeting: t, state: c.state,
      rename: name !== c.name && !!product, portfolio: !c.portfolioId && product ? productPart : undefined,
      issue,
      note: issue === "idle" ? "No impressions in 30 days: pause it so the account reads clean." : issue === "mixed" ? "Mixes match types: one budget and one bid for very different intent. Split it." : issue === "no_product" ? "I can't tell which product it advertises: left as is." : undefined,
      spend: pf?.spend ?? 0, sales: pf?.sales ?? 0,
    };
  });

  const prodMap = new Map<string, { name: string; campaigns: number; spend: number; sales: number }>();
  for (const i of items) { const p = prodMap.get(i.product) ?? { name: i.product, campaigns: 0, spend: 0, sales: 0 }; p.campaigns++; p.spend += i.spend; p.sales += i.sales; prodMap.set(i.product, p); }
  return {
    at: now.toISOString(),
    total: items.length,
    readable: items.filter((i) => isReadable(i.oldName)).length,
    items: items.sort((a, b) => a.product.localeCompare(b.product) || a.targeting.localeCompare(b.targeting) || a.newName.localeCompare(b.newName)),
    products: [...prodMap.values()].sort((a, b) => b.spend - a.spend),
    portfolios: [...new Set(items.filter((i) => i.portfolio).map((i) => i.portfolio!))],
    mixed: items.filter((i) => i.issue === "mixed").length,
    idle: items.filter((i) => i.issue === "idle").length,
  };
}
