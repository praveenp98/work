import { describe, expect, it } from "vitest";
import { analyze } from "../analyze";
import { proposalsApiChanges } from "../rules/export";
import { jsonToTable } from "./json";

/** Shaped like Amazon Ads API v3 spSearchTerm report rows. */
const adsRows = [
  { campaignName: "SP - Broad", campaignId: "111", adGroupName: "Broad", adGroupId: "211", keyword: "cutting board", keywordId: "311", targeting: "cutting board", matchType: "BROAD", searchTerm: "plastic cutting board dishwasher safe", impressions: 7600, clicks: 64, cost: 90.88, purchases7d: 0, sales7d: 0, startDate: "2026-10-15", endDate: "2026-11-13" },
  { campaignName: "SP - Broad", campaignId: "111", adGroupName: "Broad", adGroupId: "211", keyword: "cutting board", keywordId: "311", targeting: "cutting board", matchType: "BROAD", searchTerm: "cutting board", impressions: 22100, clicks: 180, cost: 279, purchases7d: 18, sales7d: 539.64, startDate: "2026-10-15", endDate: "2026-11-13" },
  { campaignName: "SP - Auto", campaignId: "112", adGroupName: "Auto", adGroupId: "212", keyword: "", keywordId: "321", targeting: "close-match", matchType: "TARGETING_EXPRESSION_PREDEFINED", searchTerm: "charcuterie board large", impressions: 9800, clicks: 96, cost: 125.76, purchases7d: 30, sales7d: 899.4, startDate: "2026-10-15", endDate: "2026-11-13" },
];

/** Shaped like SP-API GET_SALES_AND_TRAFFIC_REPORT (child ASIN). */
const salesTraffic = {
  reportSpecification: { reportType: "GET_SALES_AND_TRAFFIC_REPORT" },
  salesAndTrafficByAsin: [
    { parentAsin: "B0P1", childAsin: "B0BAMBOO01", salesByAsin: { unitsOrdered: 520, orderedProductSales: { amount: 15594.8, currencyCode: "USD" } }, trafficByAsin: { sessions: 4200, pageViews: 5100, buyBoxPercentage: 99 } },
    { parentAsin: "B0P1", childAsin: "B0BAMBOO02", salesByAsin: { unitsOrdered: 64, orderedProductSales: { amount: 2559.36, currencyCode: "USD" } }, trafficByAsin: { sessions: 2100, pageViews: 2600, buyBoxPercentage: 98 } },
    { parentAsin: "B0P2", childAsin: "B0CHARC001", salesByAsin: { unitsOrdered: 150, orderedProductSales: { amount: 5998.5, currencyCode: "USD" } }, trafficByAsin: { sessions: 1800, pageViews: 2300, buyBoxPercentage: 72 } },
  ],
};

describe("connector JSON → Rocco", () => {
  it("reads Amazon Ads API search term rows and keeps IDs", () => {
    const out = analyze(jsonToTable(JSON.stringify({ rows: adsRows }))!);
    expect(out.kind).toBe("sp_search_term");
    const n1 = out.analysis.proposals.find((p) => p.kind === "negative")!;
    expect(n1.target).toBe("plastic cutting board dishwasher safe");
    expect(n1.ids).toEqual({ campaignId: "111", adGroupId: "211" });
    const bid = out.analysis.proposals.find((p) => p.kind === "bid" && p.target === "cutting board")!;
    expect(bid.ids?.keywordId).toBe("311");
    const api = proposalsApiChanges([n1, bid]);
    expect(api[0]).toMatchObject({ action: "create", entity: "sp negative keyword", body: { campaignId: "111", adGroupId: "211", matchType: "NEGATIVE_EXACT" } });
    expect(api[1]).toMatchObject({ action: "update", body: { id: "311", bidChangePercent: -20 } });
  });

  it("reads SP-API Sales & Traffic JSON (nested, money objects)", () => {
    const out = analyze(jsonToTable(salesTraffic)!);
    expect(out.kind).toBe("business_report");
    const t = out.analysis.findings.map((f) => f.title).join(" | ");
    expect(t).toMatch(/B0BAMBOO02 gets traffic but doesn't convert/);
    expect(t).toMatch(/B0CHARC001 only wins the buy box 72%/);
  });

  it("returns null for JSON without rows", () => {
    expect(jsonToTable('{"ok":true}')).toBeNull();
    expect(jsonToTable("not json")).toBeNull();
  });
});
