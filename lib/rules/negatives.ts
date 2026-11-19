import type { TermStats } from "./aggregate";
import type { RoastSettings } from "./settings";

export interface NegativeFix {
  campaign: string;
  adGroup: string;
  keyword: string;
  matchType: "NEGATIVE_EXACT" | "NEGATIVE_PRODUCT";
  clicks: number;
  spend: number;
  reason: string;
  /** How sure Rocco is that this term won't convert (0..1): 1 - P(0 orders | expected orders). */
  confidence: number;
  /** Which test made the call: statistics (expected orders) or economics (one sale can't pay for it). */
  why: "expected_orders" | "unprofitable" | "both" | "junk_intent";
}

const ASIN = /^b0[a-z0-9]{8}$/i;
/** Words that almost never buy. Used to flag junk traffic in the roast copy. */
export const JUNK_WORDS = ["free", "diy", "how to", "used", "near me", "repair", "manual", "pdf", "reddit", "youtube", "wholesale", "jobs", "template", "rental", "what is"];
/** Campaigns that are meant to spend without immediate sales: never auto-negate inside them (Rocco flags them for review instead). */
export const PROTECTED_CAMPAIGN = /\b(launch|ranking|rank|brand(ed)?\s*(defen[cs]e|protect)|defen[cs]e|defensive|halo|test(ing)?|research|discovery)\b/i;

export const isAsin = (s: string) => ASIN.test(s.trim());
export const isJunk = (term: string) => JUNK_WORDS.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(term));

/**
 * What the account looks like, for judging one term against it.
 * - cvr: orders / clicks for the ad group when it has enough clicks, else the account.
 * - aov: average order value (sales / orders) for the account.
 * - mature: the same terms counted only on days old enough for orders to have landed (daily reports); clicks in
 *   the last few days don't count as proof that a term doesn't sell.
 */
export interface NegativeContext {
  mature?: TermStats[];
  lagDays?: number;
  protectedCampaigns?: string[];
  breakevenAcos?: number;
}

const key = (t: { campaign: string; adGroup: string; searchTerm: string }) => `${t.campaign}\u0001${t.adGroup}\u0001${t.searchTerm}`;
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;
const money = (n: number) => `$${n < 100 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;

/**
 * Search terms to negate. A term qualifies only if it has zero orders, at least minClicks mature clicks, isn't in a
 * protected campaign (launch, ranking, brand defense, tests, or ones the team named), and either:
 *  - expected orders ≥ 2: at the ad group's (or account's) conversion rate it "should" have sold ~2+ times
 *    (≈86%+ chance a real buyer term would have converted at least once), or
 *  - unprofitable: it already spent more than one average order could justify at break-even ACoS.
 *  - junk intent: the search itself says the shopper isn't buying (free, used, how to, repair…).
 * The reason states the math so a human can disagree with it.
 */
export function findNegatives(terms: TermStats[], s: RoastSettings, ctx: NegativeContext = {}): NegativeFix[] {
  const tot = terms.reduce((a, t) => ({ clicks: a.clicks + t.clicks, orders: a.orders + t.orders, sales: a.sales + t.sales }), { clicks: 0, orders: 0, sales: 0 });
  const accountCvr = tot.clicks ? tot.orders / tot.clicks : 0;
  const aov = tot.orders ? tot.sales / tot.orders : 0;
  const breakeven = ctx.breakevenAcos ?? s.targetAcos * 1.5;
  const groups = new Map<string, { clicks: number; orders: number }>();
  for (const t of terms) {
    const g = groups.get(`${t.campaign}\u0001${t.adGroup}`) ?? { clicks: 0, orders: 0 };
    g.clicks += t.clicks; g.orders += t.orders;
    groups.set(`${t.campaign}\u0001${t.adGroup}`, g);
  }
  const mature = ctx.mature ? new Map(ctx.mature.map((t) => [key(t), t])) : null;
  const named = (ctx.protectedCampaigns ?? []).map((p) => p.toLowerCase().trim()).filter(Boolean);
  const isProtected = (c: string) => PROTECTED_CAMPAIGN.test(c) || named.some((p) => c.toLowerCase().includes(p));

  const out: NegativeFix[] = [];
  for (const t of terms) {
    if (t.orders !== 0 || t.spend <= 0) continue;
    if (t.matchType === "EXACT" && t.targeting.toLowerCase() === t.searchTerm) continue; // own exact keyword: a bid/pause fix
    if (isProtected(t.campaign)) continue;
    const m = mature ? mature.get(key(t)) : t;
    const clicks = m?.clicks ?? 0;
    if (clicks < s.minClicksNegative) continue;

    const g = groups.get(`${t.campaign}\u0001${t.adGroup}`);
    const cvr = g && g.clicks >= 50 && g.orders > 0 ? g.orders / g.clicks : accountCvr;
    const expected = clicks * cvr;
    const confidence = 1 - Math.exp(-expected);
    const stat = expected >= 2;
    const econ = aov > 0 && t.spend >= aov * breakeven;
    const junk = isJunk(t.searchTerm);
    if (!stat && !econ && !junk) continue;

    const lag = mature && ctx.lagDays ? ` (not counting the last ${ctx.lagDays} days, orders can still land)` : "";
    const parts = [`${clicks} clicks, 0 orders${lag}.`];
    if (cvr > 0) parts.push(`At ${g && g.clicks >= 50 && g.orders > 0 ? "this ad group's" : "your"} ${pct(cvr)} conversion rate that's ${expected.toFixed(1)} orders expected (${Math.round(confidence * 100)}% sure it's a dud).`);
    if (econ) parts.push(`It spent ${money(t.spend)}; even one ${money(aov)} sale would be ${pct(t.spend / aov)} ACoS, over your ${pct(breakeven)} break-even.`);
    if (junk) parts.push(stat || econ ? "Junk intent too." : "The search itself shows the shopper isn't buying new (junk intent).");
    out.push({
      campaign: t.campaign, adGroup: t.adGroup, keyword: t.searchTerm,
      matchType: isAsin(t.searchTerm) ? "NEGATIVE_PRODUCT" : "NEGATIVE_EXACT",
      clicks, spend: round2(t.spend), reason: parts.join(" "),
      confidence: Math.round(Math.max(confidence, econ ? 0.9 : 0, junk ? 0.8 : 0) * 100) / 100,
      why: stat && econ ? "both" : stat ? "expected_orders" : econ ? "unprofitable" : "junk_intent",
    });
  }
  return out.sort((a, b) => b.spend - a.spend);
}

/** Zero-order terms inside campaigns meant to spend (launch, ranking, brand defense): shown for review, never auto-negated. */
export function protectedZeroTerms(terms: TermStats[], s: RoastSettings, protectedCampaigns: string[] = []): TermStats[] {
  const named = protectedCampaigns.map((p) => p.toLowerCase().trim()).filter(Boolean);
  return terms.filter((t) => t.orders === 0 && t.clicks >= s.minClicksNegative && (PROTECTED_CAMPAIGN.test(t.campaign) || named.some((p) => t.campaign.toLowerCase().includes(p))));
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
