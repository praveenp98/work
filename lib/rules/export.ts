import { k, type BulkIndex } from "../parsers/bulk";
import type { RoastResult } from "./roast";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(esc).join(",")).join("\n");

/** Plain-English fix list: works without IDs, applied by hand in the Ads console. */
export function fixListCsv(r: RoastResult): string {
  const rows: unknown[][] = [["Action", "Campaign", "Ad group", "Keyword / target", "Match type", "Current", "New", "Why"]];
  for (const n of r.fixes.negatives) rows.push(["Add negative", n.campaign, n.adGroup, n.keyword, n.matchType === "NEGATIVE_PRODUCT" ? "Negative product" : "Negative exact", "", "", `${n.reason}; spent ${r.currency}${n.spend}`]);
  for (const h of r.fixes.harvest) rows.push(["Add keyword (harvest)", "(your exact/manual campaign)", "", h.keyword, h.matchType === "PRODUCT" ? "Product (ASIN)" : "Exact", "", h.suggestedBid, `${h.reason}. Then add it as a negative exact in ${h.sourceCampaign}`]);
  for (const b of r.fixes.bids) rows.push(["Change bid", b.campaign, b.adGroup, b.targeting, b.matchType, b.currentCpc, b.newBid, `${b.reason} (${b.changePct > 0 ? "+" : ""}${b.changePct}%, capped at ±${Math.round(r.settings.bidCap * 100)}%)`]);
  return toCsv(rows);
}

const BULK_HEADER = ["Product", "Entity", "Operation", "Campaign ID", "Ad Group ID", "Keyword ID", "Product Targeting ID", "Campaign Name (Informational only)", "Ad Group Name (Informational only)", "State", "Bid", "Keyword Text", "Match Type", "Product Targeting Expression"];

/**
 * Bulksheets 2.0 rows for negatives and bid updates, using IDs from the seller's own bulk export.
 * Harvested keywords are left to the fix list (seller picks the destination campaign).
 */
export function bulkSheetCsv(r: RoastResult, idx: BulkIndex): { csv: string; matched: number; skipped: number } {
  const rows: unknown[][] = [BULK_HEADER];
  let skipped = 0;
  for (const n of r.fixes.negatives) {
    const cid = idx.campaigns.get(k(n.campaign));
    const aid = idx.adGroups.get(k(n.campaign, n.adGroup));
    if (!cid || !aid) { skipped++; continue; }
    if (n.matchType === "NEGATIVE_PRODUCT")
      rows.push(["Sponsored Products", "Negative Product Targeting", "Create", cid, aid, "", "", n.campaign, n.adGroup, "enabled", "", "", "", `asin="${n.keyword.toUpperCase()}"`]);
    else rows.push(["Sponsored Products", "Negative Keyword", "Create", cid, aid, "", "", n.campaign, n.adGroup, "enabled", "", n.keyword, "negativeExact", ""]);
  }
  for (const b of r.fixes.bids) {
    const cid = idx.campaigns.get(k(b.campaign));
    const aid = idx.adGroups.get(k(b.campaign, b.adGroup));
    const kw = idx.keywords.get(k(b.campaign, b.adGroup, b.targeting, b.matchType));
    const tg = idx.targets.get(k(b.campaign, b.adGroup, b.targeting));
    if (!cid || !aid || (!kw && !tg)) { skipped++; continue; }
    // Apply the same capped move to the seller's real current bid (CPC is usually below the bid).
    const cur = (kw ?? tg)!.bid;
    const bid = cur > 0 ? Math.max(0.02, Math.round(cur * (b.newBid / b.currentCpc) * 100) / 100) : b.newBid;
    if (kw) rows.push(["Sponsored Products", "Keyword", "Update", cid, aid, kw.id, "", b.campaign, b.adGroup, "", bid, b.targeting, b.matchType.toLowerCase(), ""]);
    else rows.push(["Sponsored Products", "Product Targeting", "Update", cid, aid, "", tg!.id, b.campaign, b.adGroup, "", bid, "", "", b.targeting]);
  }
  return { csv: toCsv(rows), matched: rows.length - 1, skipped };
}
