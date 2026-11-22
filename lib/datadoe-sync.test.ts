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

describe("group pull: one export per report for many accounts", () => {
  it("exports once per report for the whole group, splits rows by account, and retires old per-account schedules", async () => {
    const { vi } = await import("vitest");
    const { MemoryStore } = await import("./store/memory");
    const { createWorkspace } = await import("./workspace");
    const { syncGroup } = await import("./datadoe-sync");
    vi.stubEnv("DATADOE_API_KEY", "k");
    const store = new MemoryStore();
    const a = await createWorkspace(store), b = await createWorkspace(store);
    a.ws.amazon = { accounts: [{ id: "acc-a", name: "Brand A", country: "US", connectedAt: "2026-11-22" }], schedules: { "acc-a": { sp_search_term: "sch-1", inventory: "sch-2" } } };
    b.ws.amazon = { accounts: [{ id: "acc-b", name: "Brand B", country: "US", connectedAt: "2026-11-22" }] };
    await store.saveWorkspace(a.ws); await store.saveWorkspace(b.ws);
    const created: { sellerOrVendorIds: string[]; columns: string[] }[] = [];
    const deleted: string[] = [];
    const csv = (cols: string[], rows: string[][]) => [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
    vi.stubGlobal("setTimeout", ((fn: () => void) => { fn(); return 0; }) as unknown as typeof setTimeout);
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      const url = String(u), m = init?.method ?? "GET";
      if (url.includes("/exports/sources")) {
        const q = decodeURIComponent(url.match(/query=([^&]+)/)![1]);
        const p = PULLS.find((x) => x.query === q)!;
        return Response.json({ sources: [{ id: `src-${p.kind}`, name: p.kind, tableName: p.table, requiresDatePeriod: true, initialLoadProgress: 100 }] });
      }
      if (url.endsWith("/exports") && m === "POST") { const body = JSON.parse(String(init!.body)); created.push(body); return Response.json({ id: `ex-${body.sourceId}` }); }
      if (/\/exports\/schedules\//.test(url) && m === "DELETE") { deleted.push(url.split("/").pop()!); return new Response(null, { status: 204 }); }
      if (url.endsWith("/raw")) {
        const kind = url.match(/ex-src-(\w+)\/raw/)![1];
        if (kind !== "sp_search_term") return new Response("seller_or_vendor_id\n");
        const cols = ["seller_or_vendor_id", "date", "ad_campaign_name", "ad_group_name", "ad_targeting_text", "ad_match_type", "ad_search_term", "ad_impressions", "ad_clicks", "ad_spend", "ad_sales", "ad_orders", "ad_campaign_id", "ad_group_id", "ad_keyword_id", "ad_campaign_type"];
        return new Response(csv(cols, [
          ["acc-a", "2026-11-01", "C", "G", "journal", "BROAD", "free pdf journal", "900", "40", "30", "0", "0", "1", "2", "3", "SPONSORED_PRODUCTS"],
          ["acc-b", "2026-11-01", "D", "G", "planner", "BROAD", "planner 2027", "500", "20", "10", "40", "2", "4", "5", "6", "SPONSORED_PRODUCTS"],
        ]));
      }
      if (/\/exports\/ex-/.test(url)) return Response.json({ status: "COMPLETED" });
      return Response.json({}, { status: 404 });
    }));
    const res = await syncGroup(store, [{ wsId: a.ws.id, id: "acc-a", name: "Brand A" }, { wsId: b.ws.id, id: "acc-b", name: "Brand B" }]);
    expect(created).toHaveLength(PULLS.length); // 4 exports for both accounts, not 8
    expect(created.every((c) => c.sellerOrVendorIds.join() === "acc-a,acc-b" && c.columns.includes("seller_or_vendor_id"))).toBe(true);
    expect(res.get("acc-a")!.kinds).toEqual(["sp_search_term"]);
    expect(res.get("acc-b")!.kinds).toEqual(["sp_search_term"]);
    const snapA = await store.listSnapshots(a.ws.id, { limit: 5 });
    const snapB = await store.listSnapshots(b.ws.id, { limit: 5 });
    expect(snapA.map((s) => s.brand)).toEqual(["Brand A"]);
    expect(snapB.map((s) => s.brand)).toEqual(["Brand B"]);
    expect(deleted.sort()).toEqual(["sch-1", "sch-2"]);
    expect((await store.getWorkspaceById(a.ws.id))!.amazon!.schedules?.["acc-a"]).toBeUndefined();
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });
});
