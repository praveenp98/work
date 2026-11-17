import { k, type BulkIndex } from "../parsers/bulk";
import type { RoastResult } from "./roast";
import type { Proposal } from "./types";

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
 * Approved changes as a change list for Amazon's Ads connector (Ads API v3 shapes).
 * Bids are given as a % change so they apply to the live bid; harvests need the seller's chosen campaign/ad group.
 */
export function proposalsApiChanges(ps: Proposal[]) {
  return ps.map((p) => {
    const ids = p.ids ?? {};
    const base = { code: p.code, campaign: p.campaign, adGroup: p.adGroup, target: p.target };
    switch (p.kind) {
      case "negative":
        return p.matchType === "negative product"
          ? { ...base, action: "create", entity: "sp negative targeting clause", body: { campaignId: ids.campaignId, adGroupId: ids.adGroupId, expression: [{ type: "ASIN_SAME_AS", value: p.target.toUpperCase() }], state: "ENABLED" } }
          : { ...base, action: "create", entity: "sp negative keyword", body: { campaignId: ids.campaignId, adGroupId: ids.adGroupId, keywordText: p.target, matchType: "NEGATIVE_EXACT", state: "ENABLED" } };
      case "bid":
        return { ...base, action: "update", entity: ids.keywordId && p.matchType && p.matchType !== "-" ? "sp keyword" : "sp target", body: { id: ids.keywordId, bidChangePercent: p.changePct, suggestedBidFromAvgCpc: p.proposed }, note: "Read the live bid, apply bidChangePercent (never more than ±20%)." };
      case "budget":
        return { ...base, action: "update", entity: "sp campaign", body: { campaignId: ids.campaignId, budget: { budget: p.proposed, budgetType: "DAILY" } } };
      case "placement":
        return { ...base, action: "update", entity: "sp campaign placement bidding", body: { campaignId: ids.campaignId, placement: p.target === "Top of search" ? "PLACEMENT_TOP" : p.target === "Rest of search" ? "PLACEMENT_REST_OF_SEARCH" : "PLACEMENT_PRODUCT_PAGE", percentageChangePoints: p.proposed === 0 ? "set to 0" : `+${p.proposed}` } };
      case "harvest":
        return { ...base, action: "create", entity: p.matchType === "product" ? "sp target" : "sp keyword", body: { keywordText: p.target, matchType: p.matchType === "product" ? undefined : "EXACT", bid: p.proposed, campaignId: "<seller's manual exact campaign>", adGroupId: "<chosen ad group>" }, note: "Ask the seller which manual campaign/ad group to use. Then add the term as a negative exact in the source ad group." };
      default:
        return { ...base, action: "manual", note: p.reason };
    }
  });
}

/** Plain fix list from generic proposals (any report type). */
export function proposalsCsv(ps: Proposal[]): string {
  return toCsv([
    ["Code", "Type", "Campaign", "Ad group", "Keyword / target / SKU", "Match type", "Current", "New", "Why", "Est. $/month", "How to undo"],
    ...ps.map((p) => [p.code, p.kind, p.campaign, p.adGroup, p.target, p.matchType ?? "", p.current ?? "", p.proposed ?? "", p.reason, p.valueMonthly || "", p.undo]),
  ]);
}

/**
 * Bulksheets 2.0 rows for approved proposals using the seller's bulk-file IDs:
 * negatives (create), bids (update, scaled from the real current bid), budgets (update).
 * Harvests and stock/structure items stay in the fix list (they need the seller's choice of campaign).
 */
export function proposalsBulkCsv(ps: Proposal[], idx: BulkIndex): { csv: string; matched: number; skipped: string[] } {
  const rows: unknown[][] = [[...BULK_HEADER, "Daily Budget"]];
  const skipped: string[] = [];
  for (const p of ps) {
    const cid = idx.campaigns.get(k(p.campaign));
    const aid = idx.adGroups.get(k(p.campaign, p.adGroup));
    if (p.kind === "budget" && cid && p.proposed) { rows.push(["Sponsored Products", "Campaign", "Update", cid, "", "", "", p.campaign, "", "", "", "", "", "", p.proposed]); continue; }
    if (p.kind === "negative" && cid && aid) {
      if (p.matchType === "negative product") rows.push(["Sponsored Products", "Negative Product Targeting", "Create", cid, aid, "", "", p.campaign, p.adGroup, "enabled", "", "", "", `asin="${p.target.toUpperCase()}"`, ""]);
      else rows.push(["Sponsored Products", "Negative Keyword", "Create", cid, aid, "", "", p.campaign, p.adGroup, "enabled", "", p.target, "negativeExact", "", ""]);
      continue;
    }
    if (p.kind === "bid" && cid && aid && p.current && p.proposed) {
      const kw = idx.keywords.get(k(p.campaign, p.adGroup, p.target, p.matchType ?? ""));
      const tg = idx.targets.get(k(p.campaign, p.adGroup, p.target));
      const cur = (kw ?? tg)?.bid ?? 0;
      const bid = cur > 0 ? Math.max(0.02, Math.round(cur * (p.proposed / p.current) * 100) / 100) : p.proposed;
      if (kw) { rows.push(["Sponsored Products", "Keyword", "Update", cid, aid, kw.id, "", p.campaign, p.adGroup, "", bid, p.target, (p.matchType ?? "").toLowerCase(), "", ""]); continue; }
      if (tg) { rows.push(["Sponsored Products", "Product Targeting", "Update", cid, aid, "", tg.id, p.campaign, p.adGroup, "", bid, "", "", p.target, ""]); continue; }
    }
    skipped.push(p.code);
  }
  return { csv: toCsv(rows), matched: rows.length - 1, skipped };
}

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
