import { describe, expect, it } from "vitest";
import type { DoeAccount } from "./datadoe";
import { accountHealth } from "./health";

const acct = { id: "a1", name: "Habit Nest US", country: "US" };
const doe = (o: Partial<DoeAccount> = {}): DoeAccount => ({
  id: "a1", name: "Habit Nest US", accountType: "SELLER", marketplaceCountryCode: "US", rowCount: 1,
  sellerCentralConnection: { id: "sc", name: "SC", initialLoadComplete: true, needsReauthorization: false },
  amazonAdsConnection: { id: "ads", name: "Ads", initialLoadComplete: true, needsReauthorization: false }, ...o,
});
const now = new Date().toISOString();
const sc = { business_report: now, inventory: now };

describe("data health", () => {
  it("all four in → all flowing", () => {
    const h = accountHealth({ account: acct, doe: doe(), sync: { at: now, kinds: ["business_report", "inventory", "sp_search_term", "sp_campaign"], errors: [] }, latestAt: { ...sc, sp_search_term: now, sp_campaign: now } });
    expect(h.allOk).toBe(true);
    expect(h.summary).toBe("All 4 reports flowing");
  });

  it("Ads connected and loaded but no ad rows → says why and what to check (the Habit Nest case)", () => {
    const h = accountHealth({ account: acct, doe: doe(), sync: { at: now, kinds: ["business_report", "inventory"], errors: ["sp_search_term: no rows yet", "sp_campaign: no rows yet"] }, latestAt: sc });
    const st = h.reports.find((r) => r.kind === "sp_search_term")!;
    expect(st.state).toBe("missing");
    expect(st.why).toMatch(/sent no rows/);
    expect(st.fix).toMatch(/right advertiser/);
    expect(h.summary).toBe("2 of 4 reports in · 2 need attention");
  });

  it("Ads still on first load → loading, with the 48-hour note", () => {
    const h = accountHealth({ account: acct, doe: doe({ amazonAdsConnection: { id: "ads", name: "Ads", initialLoadComplete: false, initialLoadStage: "FETCHING_HISTORY", needsReauthorization: false } }), sync: { at: now, kinds: ["business_report", "inventory"], errors: ["sp_search_term: no rows yet (history 40% loaded)"] }, latestAt: sc });
    expect(h.reports.find((r) => r.kind === "sp_search_term")).toMatchObject({ state: "loading", fix: expect.stringMatching(/48 hours/) });
    expect(h.summary).toMatch(/still loading/);
  });

  it("no Ads connection → off, with Connect Amazon Ads", () => {
    const h = accountHealth({ account: acct, doe: doe({ amazonAdsConnection: null }), latestAt: sc });
    expect(h.ads.state).toBe("off");
    expect(h.reports.find((r) => r.kind === "sp_campaign")).toMatchObject({ state: "off", fix: expect.stringMatching(/Connect Amazon Ads/) });
  });

  it("table switched off in DataDoe → tells the owner where to turn it on", () => {
    const h = accountHealth({ account: acct, doe: doe(), sync: { at: now, kinds: ["business_report", "inventory", "sp_campaign"], errors: ["sp_search_term: table not available yet"] }, latestAt: { ...sc, sp_campaign: now } });
    expect(h.reports.find((r) => r.kind === "sp_search_term")!.fix).toMatch(/Settings → Data/);
  });
});
