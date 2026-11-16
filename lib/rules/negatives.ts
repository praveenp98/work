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
}

const ASIN = /^b0[a-z0-9]{8}$/i;
/** Words that almost never buy. Used to flag junk traffic in the roast copy. */
export const JUNK_WORDS = ["free", "diy", "how to", "used", "near me", "repair", "manual", "pdf", "reddit", "youtube", "wholesale", "jobs", "template", "rental", "what is"];

export const isAsin = (s: string) => ASIN.test(s.trim());
export const isJunk = (term: string) => JUNK_WORDS.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(term));

/** Search terms that took ≥ minClicks clicks with zero orders → negative exact (or negative product for ASINs). */
export function findNegatives(terms: TermStats[], s: RoastSettings): NegativeFix[] {
  return terms
    .filter((t) => t.orders === 0 && t.clicks >= s.minClicksNegative && t.spend > 0)
    .filter((t) => !(t.matchType === "EXACT" && t.targeting.toLowerCase() === t.searchTerm)) // can't negate your own exact keyword; that's a bid/pause fix
    .map((t) => ({
      campaign: t.campaign,
      adGroup: t.adGroup,
      keyword: t.searchTerm,
      matchType: isAsin(t.searchTerm) ? ("NEGATIVE_PRODUCT" as const) : ("NEGATIVE_EXACT" as const),
      clicks: t.clicks,
      spend: round2(t.spend),
      reason: isJunk(t.searchTerm) ? `${t.clicks} clicks, 0 orders, and it's junk intent` : `${t.clicks} clicks, 0 orders`,
    }))
    .sort((a, b) => b.spend - a.spend);
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
