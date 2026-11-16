import type { ParsedReport } from "../parsers/searchTerm";
import { acos, aggregateTerms, type TermStats } from "./aggregate";
import { findBidChanges, type BidFix } from "./bids";
import { findHarvest, type HarvestFix } from "./harvest";
import { findNegatives, isJunk, round2, type NegativeFix } from "./negatives";
import { DEFAULT_SETTINGS, type RoastSettings } from "./settings";

export type LeakKind = "zero_sale" | "junk_intent" | "over_target" | "missed_harvest";

export interface Leak {
  kind: LeakKind;
  title: string;
  /** Money wasted in the report period. 0 for opportunity-type leaks. */
  wasted: number;
  monthly: number;
  count: number;
  example: string;
  line: string; // Rocco's one-liner
}

export interface RoastResult {
  currency: string;
  days: number;
  totals: { spend: number; sales: number; orders: number; clicks: number; acos: number; terms: number };
  leakTotal: number;
  leakMonthly: number;
  leakPct: number;
  grade: "A" | "B" | "C" | "D" | "F";
  headline: string;
  leaks: Leak[]; // sorted, biggest first
  win: { term: string; sales: number; acos: number } | null;
  /** Aha numbers */
  leakYearly: number;
  /** ACoS if the leaked spend is cut and sales hold (sales from cut terms are ~0 by definition). */
  projectedAcos: number;
  /** Search terms Rocco "eats": the junk and zero-sale terms, biggest spend first (names only). */
  eaten: { term: string; spend: number }[];
  fixes: { negatives: NegativeFix[]; harvest: HarvestFix[]; bids: BidFix[] };
  settings: RoastSettings;
  warnings: string[];
}

const fmt = (c: string, n: number) => `${c}${Math.round(n).toLocaleString("en-US")}`;

export function gradeFor(leakPct: number): RoastResult["grade"] {
  if (leakPct < 0.1) return "A";
  if (leakPct < 0.2) return "B";
  if (leakPct < 0.3) return "C";
  if (leakPct < 0.4) return "D";
  return "F";
}

export function roast(report: ParsedReport, settings: Partial<RoastSettings> = {}): RoastResult {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const c = report.currency;
  const terms = aggregateTerms(report.rows);
  const perMonth = (n: number) => (n * 30) / report.days;

  const totals = terms.reduce(
    (a, t) => ({ spend: a.spend + t.spend, sales: a.sales + t.sales, orders: a.orders + t.orders, clicks: a.clicks + t.clicks }),
    { spend: 0, sales: 0, orders: 0, clicks: 0 },
  );

  const negatives = findNegatives(terms, s);
  const harvest = findHarvest(terms, s);
  const bids = findBidChanges(terms, s);

  // Leak 1+2: zero-sale terms past the click threshold (split junk-intent out because it's the funniest)
  const zero = terms.filter((t) => t.orders === 0 && t.clicks >= s.minClicksNegative);
  const junk = zero.filter((t) => isJunk(t.searchTerm));
  const plainZero = zero.filter((t) => !isJunk(t.searchTerm));
  // Leak 3: converting but way over target — the spend above what target ACoS would allow
  const over = terms.filter((t) => t.orders > 0 && t.clicks >= s.minClicksNegative && acos(t) > s.targetAcos * 1.5);
  const overWaste = (t: TermStats) => Math.max(0, t.spend - t.sales * s.targetAcos);

  const sum = (ts: TermStats[], f: (t: TermStats) => number = (t) => t.spend) => ts.reduce((a, t) => a + f(t), 0);
  const top = (ts: TermStats[], f: (t: TermStats) => number = (t) => t.spend) => [...ts].sort((a, b) => f(b) - f(a))[0];

  const leaks: Leak[] = [];
  if (junk.length) {
    const t = top(junk);
    const w = sum(junk);
    leaks.push({ kind: "junk_intent", title: "Paying for shoppers who were never going to buy", wasted: round2(w), monthly: round2(perMonth(w)), count: junk.length, example: t.searchTerm,
      line: `You paid ${fmt(c, t.spend)} for people searching "${t.searchTerm}". I ate it. You're welcome.` });
  }
  if (plainZero.length) {
    const t = top(plainZero);
    const w = sum(plainZero);
    leaks.push({ kind: "zero_sale", title: "Search terms with clicks and zero sales", wasted: round2(w), monthly: round2(perMonth(w)), count: plainZero.length, example: t.searchTerm,
      line: `"${t.searchTerm}" took ${t.clicks} clicks and ${fmt(c, t.spend)}. Orders: zero. That's not a keyword, that's a donation.` });
  }
  if (over.length) {
    const t = top(over, overWaste);
    const w = sum(over, overWaste);
    leaks.push({ kind: "over_target", title: `Terms that sell, but way above your ${(s.targetAcos * 100).toFixed(0)}% target ACoS`, wasted: round2(w), monthly: round2(perMonth(w)), count: over.length, example: t.searchTerm,
      line: `"${t.searchTerm}" sells, at ${(acos(t) * 100).toFixed(0)}% ACoS. You're buying customers at a loss and calling it growth.` });
  }
  if (harvest.length) {
    const h = harvest[0];
    leaks.push({ kind: "missed_harvest", title: "Winning search terms you aren't targeting directly", wasted: 0, monthly: 0, count: harvest.length, example: h.keyword,
      line: `"${h.keyword}" made ${fmt(c, h.sales)} by accident in ${h.sourceCampaign || "an auto campaign"}. Give it its own exact keyword before a competitor does.` });
  }
  leaks.sort((a, b) => b.wasted - a.wasted || b.count - a.count);

  const leakTotal = round2(sum(zero) + sum(over, overWaste));
  const leakPct = totals.spend > 0 ? leakTotal / totals.spend : 0;
  const grade = gradeFor(leakPct);
  const winT = top(terms.filter((t) => t.orders > 0 && acos(t) <= s.targetAcos), (t) => t.sales);

  const headline =
    leakTotal === 0
      ? "Honestly? I dug through everything and found nothing to roast. Annoying."
      : `${Math.round(leakPct * 100)}% of your ad spend is leaking. That's about ${fmt(c, perMonth(leakTotal))} a month.`;

  return {
    currency: c,
    days: report.days,
    totals: { ...mapRound(totals), acos: totals.sales > 0 ? round2(totals.spend / totals.sales) : -1, terms: terms.length },
    leakTotal,
    leakMonthly: round2(perMonth(leakTotal)),
    leakPct: round2(leakPct),
    grade,
    headline,
    leaks,
    leakYearly: round2(perMonth(leakTotal) * 12),
    projectedAcos: totals.sales > 0 ? round2(Math.max(0, totals.spend - leakTotal) / totals.sales) : -1,
    eaten: [...zero].sort((a, b) => b.spend - a.spend).slice(0, 8).map((t) => ({ term: t.searchTerm, spend: round2(t.spend) })),
    win: winT ? { term: winT.searchTerm, sales: round2(winT.sales), acos: round2(acos(winT)) } : null,
    fixes: { negatives, harvest, bids },
    settings: s,
    warnings: report.warnings,
  };
}

function mapRound<T extends Record<string, number>>(o: T): T {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, round2(v)])) as T;
}

/** The free tier: score + top 3 leaks + counts. Full fix lists are stripped. */
/** Days until a plan price is paid back by the monthly leak. null if no leak. */
export function paybackDays(price: number, leakMonthly: number): number | null {
  if (leakMonthly <= 0) return null;
  return Math.max(1, Math.ceil(price / (leakMonthly / 30)));
}

export function freeView(r: RoastResult) {
  return {
    ...r,
    leaks: r.leaks.slice(0, 3),
    fixes: undefined,
    fixCounts: { negatives: r.fixes.negatives.length, harvest: r.fixes.harvest.length, bids: r.fixes.bids.length },
  };
}
