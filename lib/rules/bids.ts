import { acos, aggregateTargets, cpc, type TermStats } from "./aggregate";
import { round2 } from "./negatives";
import type { RoastSettings } from "./settings";

export interface BidFix {
  campaign: string;
  adGroup: string;
  targeting: string;
  matchType: string;
  clicks: number;
  spend: number;
  acos: number;
  currentCpc: number;
  newBid: number;
  changePct: number;
  reason: string;
}

/**
 * Bid formula: new = CPC × (target ACoS / actual ACoS), capped at ±cap per step.
 * Zero-order targets with enough clicks drop by the full cap. Moves under 5% are skipped.
 */
export function bidFor(t: Pick<TermStats, "spend" | "sales" | "clicks" | "orders">, s: RoastSettings): number | null {
  const base = cpc(t);
  if (base <= 0 || t.clicks < s.minClicksNegative) return null;
  const ratio = t.orders === 0 || t.sales === 0 ? 1 - s.bidCap : s.targetAcos / acos(t);
  const capped = Math.min(1 + s.bidCap, Math.max(1 - s.bidCap, ratio));
  if (Math.abs(capped - 1) < 0.05) return null;
  return Math.max(0.02, round2(base * capped));
}

export function findBidChanges(terms: TermStats[], s: RoastSettings): BidFix[] {
  const out: BidFix[] = [];
  for (const t of aggregateTargets(terms)) {
    const nb = bidFor(t, s);
    if (nb === null) continue;
    const cur = round2(cpc(t));
    const a = acos(t);
    out.push({
      campaign: t.campaign,
      adGroup: t.adGroup,
      targeting: t.targeting,
      matchType: t.matchType,
      clicks: t.clicks,
      spend: round2(t.spend),
      acos: Number.isFinite(a) ? round2(a) : -1,
      currentCpc: cur,
      newBid: nb,
      changePct: Math.round(((nb - cur) / cur) * 100),
      reason: t.orders === 0 ? `${t.clicks} clicks, 0 orders` : `ACoS ${(a * 100).toFixed(0)}% vs target ${(s.targetAcos * 100).toFixed(0)}%`,
    });
  }
  return out.sort((a, b) => Math.abs(b.changePct * b.spend) - Math.abs(a.changePct * a.spend));
}
