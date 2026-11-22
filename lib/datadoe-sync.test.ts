import { describe, expect, it } from "vitest";
import { detectKind } from "./analyze";
import { PULLS, toAmazonTable } from "./datadoe-sync";

const pull = (k: string) => PULLS.find((p) => p.kind === k)!;

describe("DataDoe exports → Amazon-shaped reports (columns verified on a real account, Nov 22)", () => {
  it("search terms: daily rows, Sponsored Products only, recognised as a search term report with IDs", () => {
    const t = toAmazonTable([
      { date: "2026-11-01", ad_campaign_name: "C", ad_group_name: "A", ad_targeting_text: "board", ad_match_type: "BROAD", ad_search_term: "plastic mat", ad_impressions: "900", ad_clicks: "12", ad_spend: "9.5", ad_sales: "0", ad_orders: "0", ad_campaign_id: "1", ad_group_id: "2", ad_keyword_id: "3", ad_campaign_type: "SPONSORED_PRODUCTS" },
      { date: "2026-11-01", ad_campaign_name: "SB", ad_group_name: "A", ad_targeting_text: "x", ad_match_type: "BROAD", ad_search_term: "y", ad_impressions: "1", ad_clicks: "1", ad_spend: "1", ad_sales: "0", ad_orders: "0", ad_campaign_id: "9", ad_group_id: "9", ad_keyword_id: "9", ad_campaign_type: "SPONSORED_BRANDS" },
    ], pull("sp_search_term"));
    expect(t).toHaveLength(2);
    expect(t[0]).toContain("Customer Search Term");
    expect(t[0]).not.toContain("_type");
    expect(detectKind(t)).toBe("sp_search_term");
  });

  it("campaigns: one row per campaign with period dates, summed metrics, latest budget", () => {
    const t = toAmazonTable([
      { date: "2026-11-01", ad_campaign_id: "1", ad_campaign_name: "C", ad_campaign_status: "ENABLED", ad_campaign_budget_amount: "20", ad_impressions: "100", ad_clicks: "5", ad_spend: "4", ad_sales: "10", ad_orders: "1" },
      { date: "2026-11-02", ad_campaign_id: "1", ad_campaign_name: "C", ad_campaign_status: "ENABLED", ad_campaign_budget_amount: "25", ad_impressions: "50", ad_clicks: "3", ad_spend: "2", ad_sales: "0", ad_orders: "0" },
    ], pull("sp_campaign"));
    expect(t).toHaveLength(2);
    const h = t[0] as string[], r = t[1];
    expect(r[h.indexOf("Start Date")]).toBe("2026-11-01");
    expect(r[h.indexOf("End Date")]).toBe("2026-11-02");
    expect(r[h.indexOf("Spend")]).toBe(6);
    expect(r[h.indexOf("Budget")]).toBe("25");
    expect(detectKind(t)).toBe("sp_campaign");
  });

  it("sales & traffic: summed per ASIN with page-view-weighted Buy Box; inventory: latest snapshot per SKU", () => {
    const b = toAmazonTable([
      { child_asin: "B0X", product_name: "Journal", session: "100", page_views: "100", total_units: "4", total_sales: "80", buybox_percentage: "100" },
      { child_asin: "B0X", product_name: "Journal", session: "50", page_views: "300", total_units: "1", total_sales: "20", buybox_percentage: "80" },
    ], pull("business_report"));
    const bh = b[0] as string[];
    expect(b[1][bh.indexOf("Sessions - Total")]).toBe(150);
    expect(b[1][bh.indexOf("Featured Offer (Buy Box) Percentage")]).toBe("85.0%");
    expect(detectKind(b)).toBe("business_report");

    const inv = toAmazonTable([
      { date: "2026-11-19", sku: "S1", child_asin: "B0X", product_name: "J", available: "10", units_shipped_t30: "60", days_of_supply: "5" },
      { date: "2026-11-21", sku: "S1", child_asin: "B0X", product_name: "J", available: "4", units_shipped_t30: "60", days_of_supply: "2" },
    ], pull("inventory"));
    expect(inv).toHaveLength(2);
    expect(inv[1][(inv[0] as string[]).indexOf("Available")]).toBe("4");
    expect(detectKind(inv)).toBe("inventory");
  });
});
