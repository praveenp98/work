import { acos, cpc, type TermStats } from "./aggregate";
import { isAsin, round2 } from "./negatives";
import type { RoastSettings } from "./settings";

export interface HarvestFix {
  sourceCampaign: string;
  sourceAdGroup: string;
  keyword: string;
  matchType: "EXACT" | "PRODUCT";
  orders: number;
  sales: number;
  acos: number;
  suggestedBid: number;
  reason: string;
}

/** Converting search terms from auto/broad/phrase that aren't yet their own exact target. */
export function findHarvest(terms: TermStats[], s: RoastSettings): HarvestFix[] {
  const exactTargets = new Set(
    terms.filter((t) => t.matchType === "EXACT").map((t) => t.targeting.toLowerCase()),
  );
  const best = new Map<string, TermStats>();
  for (const t of terms) {
    if (t.orders < s.harvestMinOrders) continue;
    if (acos(t) > s.targetAcos) continue;
    if (exactTargets.has(t.searchTerm)) continue;
    const prev = best.get(t.searchTerm);
    if (!prev || t.sales > prev.sales) best.set(t.searchTerm, t);
  }
  return [...best.values()]
    .map((t) => ({
      sourceCampaign: t.campaign,
      sourceAdGroup: t.adGroup,
      keyword: t.searchTerm,
      matchType: isAsin(t.searchTerm) ? ("PRODUCT" as const) : ("EXACT" as const),
      orders: t.orders,
      sales: round2(t.sales),
      acos: round2(acos(t)),
      suggestedBid: round2(Math.max(0.1, cpc(t) * 1.1)),
      reason: `${t.orders} orders at ${(acos(t) * 100).toFixed(0)}% ACoS from ${t.matchType === "-" ? "auto/product targeting" : t.matchType.toLowerCase() + " match"}`,
    }))
    .sort((a, b) => b.sales - a.sales);
}
