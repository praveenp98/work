import type { BusinessRow } from "./parsers/business";
import type { SearchTermRow } from "./parsers/searchTerm";
import type { RoastResult } from "./rules/roast";

/**
 * Amazon Seller Wrapped: a year (or any period) told as a story, from the seller's own Business Report and,
 * optionally, their search term report. Every slide is a number the reports prove; nothing is benchmarked
 * against "other sellers". Pure and tested (lib/wrapped.test.ts).
 *
 * The public share link carries only a short numeric code (persona + a few totals), never product names or
 * search terms: those stay on the seller's device.
 */
export type Grad = "sunset" | "ocean" | "lime" | "grape" | "ember" | "night" | "gold" | "mint";
export interface Slide { id: string; kicker: string; big: string; line: string; sub?: string; grad: Grad; locked?: boolean; num?: number; prefix?: string; suffix?: string }
export interface Persona { key: string; name: string; line: string; why: string; emoji: string }
export interface Share { persona: string; units: number; minutes: number; topShare: number; products: number; conv: number; waste?: number; sales?: number; aov?: number; adShare?: number; days: number }
export interface Wrapped { persona: Persona; slides: Slide[]; share: Share; code: string; periodLabel: string; resolution?: { title: string; value: string } }

export const PERIODS: Record<string, { label: string; days: (now: Date) => number }> = {
  "This year so far": { label: "year so far", days: (d) => Math.max(1, Math.round((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000)) },
  "Last 12 months": { label: "last 12 months", days: () => 365 },
  "Last 90 days": { label: "last 90 days", days: () => 90 },
  "Last 60 days": { label: "last 60 days", days: () => 60 },
  "Last 30 days": { label: "last 30 days", days: () => 30 },
};

export const PERSONAS: Record<string, Omit<Persona, "why">> = {
  onehit: { key: "onehit", name: "The One-Hit Wonder", line: "One product carries the whole band.", emoji: "🎸" },
  donor: { key: "donor", name: "The Generous Donor", line: "Amazon's favourite ad customer.", emoji: "🎁" },
  window: { key: "window", name: "The Window Display", line: "Everyone stops to look. Few come in.", emoji: "🪟" },
  closer: { key: "closer", name: "The Closer", line: "They come. They buy. Next.", emoji: "🤝" },
  sniper: { key: "sniper", name: "The Sniper", line: "Every ad dollar has a target.", emoji: "🎯" },
  junkie: { key: "junkie", name: "The Ad Junkie", line: "Ads off? Sales off.", emoji: "💉" },
  organic: { key: "organic", name: "The Organic Legend", line: "Shoppers find you without being paid to.", emoji: "🌱" },
  collector: { key: "collector", name: "The Collector", line: "A little of everything, selling steadily.", emoji: "🗂️" },
  accountant: { key: "accountant", name: "The Accountant", line: "Tight, tidy, profitable.", emoji: "🧮" },
  grinder: { key: "grinder", name: "The Grinder", line: "Steady, solid, always shipping.", emoji: "⚙️" },
};

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const n0 = (n: number) => Math.round(n).toLocaleString("en-US");
const p1 = (n: number) => `${Math.round(n * 10) / 10}%`;
export const shortName = (t: string, max = 34) => {
  const s = t.replace(/\s*[,|(–-].*$/, "").trim() || t;
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s;
};
const every = (days: number, units: number) => {
  if (units <= 0) return "";
  const min = (days * 1440) / units;
  if (min < 1) return `one every ${Math.max(1, Math.round(min * 60))} seconds`;
  if (min < 90) return `one every ${Math.round(min)} minutes`;
  if (min < 1440 * 1.5) return `one every ${Math.round(min / 60)} hours`;
  return `${(units / days).toFixed(1)} a day`;
};

export interface WrappedIn { biz: BusinessRow[]; terms?: SearchTermRow[]; roast?: RoastResult; period: string; hide: boolean; now?: Date }

export function buildWrapped(i: WrappedIn): Wrapped | null {
  const rows = i.biz.filter((r) => r.sessions > 0 || r.units > 0);
  if (!rows.length) return null;
  const per = PERIODS[i.period] ?? PERIODS["This year so far"];
  const days = per.days(i.now ?? new Date());
  const units = rows.reduce((t, r) => t + r.units, 0), sales = rows.reduce((t, r) => t + r.sales, 0), sessions = rows.reduce((t, r) => t + r.sessions, 0);
  const aov = units ? sales / units : 0, conv = sessions ? (units / sessions) * 100 : 0;
  const bySales = [...rows].sort((a, b) => b.sales - a.sales);
  const top = bySales[0], topShare = sales ? (top.sales / sales) * 100 : 0;
  let acc = 0, k80 = 0;
  for (const r of bySales) { acc += r.sales; k80++; if (acc >= sales * 0.8) break; }
  const cv = (r: BusinessRow) => (r.sessions ? (r.units / r.sessions) * 100 : 0);
  const medSessions = [...rows].map((r) => r.sessions).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  const gem = rows.filter((r) => r.units >= 5 && r.sessions <= medSessions && cv(r) >= conv * 1.5 && r !== top).sort((a, b) => cv(b) - cv(a))[0];
  const leaky = rows.filter((r) => r.sessions >= sessions * 0.08 && cv(r) < conv * 0.6).sort((a, b) => b.sessions - a.sessions)[0];
  const leakyUnits = leaky ? Math.round(leaky.sessions * (conv / 100) - leaky.units) : 0;
  const leakyAov = leaky && leaky.units ? leaky.sales / leaky.units : aov;
  const zombies = rows.filter((r) => r.units === 0 && r.sessions >= 30);
  const bb = rows.filter((r) => r.buyBoxPct >= 0 && r.sessions >= sessions * 0.05 && r.buyBoxPct < 90).sort((a, b) => a.buyBoxPct - b.buyBoxPct)[0];

  // Ads (search term report)
  const st = i.roast, T = i.terms ?? [];
  const adSpend = st?.totals.spend ?? 0, adSales = st?.totals.sales ?? 0;
  const adDays = st?.days || 30;
  const adShare = st && sales ? Math.min(100, ((adSales / adDays) / (sales / days)) * 100) : undefined;
  const waste = st ? st.leakPct * 100 : undefined;
  const termAgg = new Map<string, { clicks: number; spend: number; sales: number; orders: number }>();
  for (const r of T) { const k = r.searchTerm.toLowerCase(); const x = termAgg.get(k) ?? { clicks: 0, spend: 0, sales: 0, orders: 0 }; x.clicks += r.clicks; x.spend += r.spend; x.sales += r.sales; x.orders += r.orders; termAgg.set(k, x); }
  const selling = [...termAgg.entries()].filter(([, x]) => x.sales > 0).sort((a, b) => b[1].sales - a[1].sales);
  let half = 0, kHalf = 0;
  for (const [, x] of selling) { half += x.sales; kHalf++; if (half >= adSales / 2) break; }
  const pricey = [...termAgg.entries()].filter(([, x]) => x.clicks >= 3).map(([t, x]) => ({ t, cpc: x.spend / x.clicks })).sort((a, b) => b.cpc - a.cpc)[0];

  // Persona: first rule that fits, with the numbers that earned it.
  const pick = (): [string, string] => {
    if (topShare >= 60 && rows.length >= 3) return ["onehit", `${p1(topShare)} of your sales came from one product.`];
    if (waste !== undefined && waste >= 25) return ["donor", `${p1(waste)} of your ad spend went to searches that never sold.`];
    if (adShare !== undefined && adShare >= 60) return ["junkie", `Ads drove about ${p1(adShare)} of your sales.`];
    if (conv >= 15) return ["closer", `${p1(conv)} of shoppers who opened a listing bought.`];
    if (conv > 0 && conv < 6 && sessions >= 1000) return ["window", `${n0(sessions)} shoppers looked; ${p1(conv)} bought.`];
    if (st && st.totals.acos > 0 && st.totals.acos < 0.2 && (waste ?? 100) < 10) return ["sniper", `${p1(st.totals.acos * 100)} ACoS with only ${p1(waste ?? 0)} wasted.`];
    if (adShare !== undefined && adShare <= 20 && adSpend > 0) return ["organic", `Only about ${p1(adShare)} of sales came from ads.`];
    if (topShare <= 25 && rows.length >= 8) return ["collector", `Your best seller is only ${p1(topShare)} of sales across ${rows.length} products.`];
    if (conv >= 9) return ["accountant", `${p1(conv)} conversion, no single product carrying the rest.`];
    return ["grinder", `${n0(units)} units, ${every(days, units)}.`];
  };
  const [pk, why] = pick();
  const persona: Persona = { ...PERSONAS[pk], why };

  const slides: Slide[] = [];
  slides.push({ id: "units", kicker: `Your ${per.label} on Amazon`, big: `${n0(units)}`, num: units, line: "things sold.", sub: `That's ${every(days, units)}. Day and night.`, grad: "sunset" });
  if (!i.hide) slides.push({ id: "sales", kicker: "The money", big: $(sales), num: sales, prefix: "$", line: `in sales. ${$(sales / days)} a day.`, sub: `Average sale: ${$(aov)}.`, grad: "gold" });
  slides.push({ id: "traffic", kicker: "The crowd", big: n0(sessions), num: sessions, line: "shoppers opened your listings.", sub: `${p1(conv)} of them bought. ${conv >= 10 ? "That's a strong close." : conv < 6 ? "Most of them left without buying." : ""}`.trim(), grad: "ocean" });
  slides.push({ id: "hero", kicker: "Your MVP", big: p1(topShare), num: Math.round(topShare), suffix: "%", line: `of sales came from ${shortName(top.title || top.asin)}.`, sub: rows.length > 2 ? `${k80} of your ${rows.length} products made 80% of the money.${topShare >= 50 ? " If it sneezes, the whole business catches a cold." : ""}` : undefined, grad: "grape" });
  slides.push({ id: "persona", kicker: "Your seller personality", big: `${persona.emoji} ${persona.name}`, line: persona.line, sub: `Why: ${persona.why}`, grad: "night" });

  // Locked deeper cuts (email unlocks).
  if (gem) slides.push({ id: "gem", kicker: "Your hidden gem", big: p1(cv(gem)), line: `conversion on ${shortName(gem.title || gem.asin)}.`, sub: `${(cv(gem) / Math.max(conv, 0.1)).toFixed(1)}× your average, yet it got only ${p1((gem.sessions / sessions) * 100)} of your shoppers. More traffic here is the cheapest growth you have.`, grad: "mint", locked: true });
  if (leaky && leakyUnits > 0) slides.push({ id: "leaky", kicker: "The leaky bucket", big: i.hide ? `+${n0(leakyUnits)} units` : `+${$(leakyUnits * leakyAov)}`, line: `if ${shortName(leaky.title || leaky.asin)} converted like the rest of your store.`, sub: `It pulled ${p1((leaky.sessions / sessions) * 100)} of all your shoppers and only ${p1(cv(leaky))} bought. Price, main image, reviews or title: something here is turning people away.`, grad: "ember", locked: true });
  if (zombies.length) slides.push({ id: "zombies", kicker: "The zombies", big: `${zombies.length} product${zombies.length > 1 ? "s" : ""}`, line: `got ${n0(zombies.reduce((t, r) => t + r.sessions, 0))} visits and sold nothing.`, sub: zombies.slice(0, 3).map((z) => shortName(z.title || z.asin, 26)).join(" · "), grad: "night", locked: true });
  if (bb) slides.push({ id: "buybox", kicker: "Someone else's button", big: p1(100 - bb.buyBoxPct), line: `of shoppers on ${shortName(bb.title || bb.asin)} saw another seller's Buy Box.`, sub: `That's about ${n0(bb.sessions * (1 - bb.buyBoxPct / 100))} shoppers who could have bought from someone else.`, grad: "ember", locked: true });
  if (st && selling[0]) slides.push({ id: "search", kicker: "Search of the year", big: `“${selling[0][0]}”`, line: i.hide ? `Your best-selling ad search.` : `${$(selling[0][1].sales)} in ad sales at ${p1((selling[0][1].spend / Math.max(1, selling[0][1].sales)) * 100)} ACoS.`, sub: selling.length > 3 ? `Shoppers found your ads through ${n0(termAgg.size)} different searches. Just ${kHalf} of them made half your ad sales.` : undefined, grad: "lime", locked: true });
  if (st && st.leakTotal > 0) {
    const gifts = aov > 0 ? Math.round(st.leakTotal / aov) : 0;
    slides.push({ id: "donation", kicker: "Your donation to Amazon", big: i.hide ? p1(waste ?? 0) : $(st.leakTotal), line: i.hide ? "of ad spend bought clicks that never became orders." : `on clicks that never became an order (in ${adDays} days).`, sub: gifts > 0 ? `That's the price of ${n0(gifts)} of your own products, given away.${st.eaten[0] ? ` Biggest one: “${st.eaten[0].term}”.` : ""}` : undefined, grad: "sunset", locked: true });
  }
  if (pricey && pricey.cpc >= 1.5 && !i.hide) slides.push({ id: "pricey", kicker: "Your most expensive click", big: `$${pricey.cpc.toFixed(2)}`, line: `per click on “${pricey.t}”.`, sub: "Each click, before anyone bought anything.", grad: "gold", locked: true });
  if (adShare !== undefined) slides.push({ id: "adshare", kicker: "Ads vs. organic", big: p1(adShare), line: "of your sales came from ads.", sub: adShare >= 50 ? "Your ads are the engine. Turn them off and most sales go with them." : adShare <= 25 ? "Most shoppers find you on their own. That's rank you've earned." : "A healthy mix of paid and organic.", grad: "ocean", locked: true });

  // Resolution: the biggest money lever we can prove.
  const yr = 365 / days;
  const levers: { title: string; v: number; show: string; hidden: string }[] = [];
  if (leaky && leakyUnits > 0) levers.push({ title: `Fix the listing for ${shortName(leaky.title || leaky.asin, 30)}`, v: leakyUnits * leakyAov * yr, show: `Worth ~${$(leakyUnits * leakyAov * yr)} a year.`, hidden: `Worth ~${n0(leakyUnits * yr)} more units a year.` });
  if (st && st.leakYearly > 0) levers.push({ title: "Block the searches that never sell", v: st.leakYearly, show: `~${$(st.leakYearly)} a year back in your pocket.`, hidden: `${p1(waste ?? 0)} of your ad spend, back.` });
  if (gem) levers.push({ title: `Send more shoppers to ${shortName(gem.title || gem.asin, 30)}`, v: gem.sales * yr * 0.5, show: "Your cheapest growth.", hidden: "Your cheapest growth." });
  const best = levers.sort((a, b) => b.v - a.v)[0];
  const resolution = best ? { title: best.title, value: i.hide ? best.hidden : best.show } : undefined;
  if (resolution) slides.push({ id: "resolution", kicker: `Rocco's resolution for you, ${new Date((i.now ?? new Date()).getTime() + 40 * 86_400_000).getUTCFullYear()}`, big: resolution.title, line: resolution.value, sub: "I'd start on it tomorrow morning.", grad: "mint", locked: true });

  const share: Share = { persona: pk, units, minutes: Math.round((days * 1440) / Math.max(1, units)), topShare: Math.round(topShare), products: rows.length, conv: Math.round(conv * 10) / 10, days, ...(waste !== undefined ? { waste: Math.round(waste) } : {}), ...(adShare !== undefined ? { adShare: Math.round(adShare) } : {}), ...(!i.hide ? { sales: Math.round(sales), aov: Math.round(aov * 100) / 100 } : {}) };
  return { persona, slides, share, code: encodeShare(share), periodLabel: per.label, resolution };
}

// Share code: persona key + base36 numbers, "_" for missing. Example: onehit.7ho.1j.1o.e.35.u._._._.a5
const KEYS = ["units", "minutes", "topShare", "products", "conv10", "days", "waste", "adShare", "sales", "aov100"] as const;
export function encodeShare(s: Share): string {
  const v: Record<(typeof KEYS)[number], number | undefined> = { units: s.units, minutes: s.minutes, topShare: s.topShare, products: s.products, conv10: Math.round(s.conv * 10), days: s.days, waste: s.waste, adShare: s.adShare, sales: s.sales, aov100: s.aov === undefined ? undefined : Math.round(s.aov * 100) };
  return [s.persona, ...KEYS.map((k) => (v[k] === undefined ? "_" : Math.max(0, Math.round(v[k]!)).toString(36)))].join(".").replace(/(\._)+$/, "");
}
export function decodeShare(code: string): Share | null {
  const [p, ...rest] = String(code).slice(0, 120).split(".");
  if (!PERSONAS[p]) return null;
  const n = (i: number) => { const x = rest[i]; if (!x || x === "_" || !/^[0-9a-z]{1,10}$/.test(x)) return undefined; const v = parseInt(x, 36); return Number.isFinite(v) ? v : undefined; };
  const units = n(0), minutes = n(1), topShare = n(2), products = n(3), conv10 = n(4), days = n(5);
  if (units === undefined || minutes === undefined || topShare === undefined || products === undefined || conv10 === undefined || days === undefined) return null;
  const waste = n(6), adShare = n(7), sales = n(8), aov100 = n(9);
  return { persona: p, units, minutes, topShare: Math.min(100, topShare), products, conv: conv10 / 10, days, ...(waste !== undefined ? { waste: Math.min(100, waste) } : {}), ...(adShare !== undefined ? { adShare: Math.min(100, adShare) } : {}), ...(sales !== undefined ? { sales } : {}), ...(aov100 !== undefined ? { aov: aov100 / 100 } : {}) };
}
/** "one every 55 minutes" from a share (for cards). */
export const everyFromShare = (s: Share) => every(s.days, s.units);
export const shareText = (s: Share) => `My Amazon Seller Wrapped: I'm ${PERSONAS[s.persona].name} ${PERSONAS[s.persona].emoji} ${n0(s.units)} units sold, ${every(s.days, s.units)}. Get yours:`;
