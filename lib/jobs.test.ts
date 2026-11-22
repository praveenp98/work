import { afterEach, describe, expect, it, vi } from "vitest";
import { applyMany, planFor } from "./apply";
import { skusByAdGroup } from "./create-campaign";
import { buildJobs } from "./jobs";
import type { Proposal } from "./rules/types";
import type { Snapshot } from "./store/types";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const P = (code: string, kind: Proposal["kind"], v: number, extra: Partial<Proposal> = {}): Proposal =>
  ({ code, kind, campaign: "SP - Board", adGroup: "ag", target: `term ${code}`, reason: "r", valueMonthly: v, undo: "", ...extra });

describe("today's work as jobs, not 20 single-change cards", () => {
  const ps = [
    P("N1", "negative", 40), P("N2", "negative", 25), P("N3", "negative", 5),
    P("B1", "bid", 30, { current: 1.2, proposed: 0.9 }), P("B2", "bid", 0, { current: 0.5, proposed: 0.6 }),
    P("H1", "harvest", 0, { proposed: 0.8 }), P("H2", "harvest", 0, { proposed: 0.7 }),
    P("G1", "budget", 120, { current: 20, proposed: 25 }), P("G2", "budget", 60, { current: 50, proposed: 30 }),
  ];
  it("groups by the job a manager would do, with one approve per job", () => {
    const jobs = buildJobs(ps);
    const by = Object.fromEntries(jobs.map((j) => [j.kind, j]));
    expect(by.negatives.title).toBe("Block 3 searches that waste money");
    expect(by.negatives.codes).toEqual(["N1", "N2", "N3"]);
    expect(by.negatives.value).toBe(70);
    expect(by.bids_down.codes).toEqual(["B1"]);
    expect(by.bids_up.codes).toEqual(["B2"]);
    expect(by.new_campaign).toMatchObject({ mode: "create", title: "New exact campaign: 2 proven searches" });
    expect(by.budget_up.codes).toEqual(["G1"]);
    expect(by.budget_down.codes).toEqual(["G2"]);
    expect(by.bids_down.items[0].detail).toContain("$1.20 → $0.90");
  });
  it("Claude's picks lead and give the why; Seller Central risks come before money otherwise", () => {
    const inv = { kind: "inventory", stats: { atRisk: 2 }, extra: { findings: [{ title: "SKU-1 runs out in 9 days", detail: "send 300" }] } } as unknown as Snapshot;
    const plan = { at: "", basis: "", brief: null, picks: [{ codes: ["G1"], title: "x", why: "Profitable and capped by budget." }] };
    const jobs = buildJobs(ps, { plan, inv });
    expect(jobs[0]).toMatchObject({ kind: "budget_up", why: "Profitable and capped by budget." });
    expect(jobs[0].items[0].picked).toBe(true);
    expect(jobs[1]).toMatchObject({ kind: "restock", mode: "manual", title: "Restock 2 products before they run out" });
    expect(buildJobs(ps, { inv })[0].kind).toBe("restock");
  });
});

describe("making the changes", () => {
  it("budget changes use DataDoe's campaign update (format checked with a dry run)", () => {
    expect(planFor(P("G1", "budget", 1, { current: 20, proposed: 25, ids: { campaignId: "55" } }))).toEqual({ type: "AMAZON_ADS_CAMPAIGNS_UPDATE", details: { campaigns: [{ campaignId: "55", budgets: [{ budgetType: "MONETARY", recurrenceTimePeriod: "DAILY", budgetValue: { monetaryBudgetValue: { monetaryBudget: { value: 25 } } } }] }] } });
  });
  it("a job goes out as one Action per type; a rejected batch is retried item by item", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const sent: { type: string; n: number; dry: boolean }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init?: RequestInit) => {
      const b = JSON.parse(String(init!.body));
      const list = (b.details.targets ?? b.details.campaigns) as { targetDetails?: { keywordTarget: { keyword: string } } }[];
      sent.push({ type: b.type, n: list.length, dry: !!b.dryRun });
      const bad = list.some((x) => x.targetDetails?.keywordTarget.keyword === "term N2");
      if (b.dryRun && bad) return Response.json({ message: "invalid keyword" }, { status: 400 });
      return Response.json({ actionId: b.dryRun ? null : `a-${sent.length}`, status: b.dryRun ? "VALIDATED" : "QUEUED" });
    }));
    const ids = { campaignId: "1", adGroupId: "2" };
    const out = await applyMany("acct", [P("N1", "negative", 1, { ids }), P("N2", "negative", 1, { ids }), P("N3", "negative", 1, { ids }), P("G1", "budget", 1, { proposed: 25, ids: { campaignId: "9" } }), P("H1", "harvest", 0)], "k");
    expect(out.map((o) => `${o.code}:${o.status}`)).toEqual(["N1:applied", "N2:failed", "N3:applied", "G1:applied", "H1:manual"]);
    expect(sent[0]).toEqual({ type: "AMAZON_ADS_TARGETS_ADD", n: 3, dry: true }); // whole job first
    expect(sent.filter((s) => !s.dry && s.type === "AMAZON_ADS_CAMPAIGNS_UPDATE")).toHaveLength(1);
  });
  it("finds the SKU a search sells through (ads raw format seen on a real account)", () => {
    const m = skusByAdGroup([
      { ad_group_id: "10", ad_campaign_type: "SPONSORED_PRODUCTS", ad_state: "ENABLED", ad_creative_products: '[{"productId":"W4-3ZND-PRCY","productIdType":"SKU"}]' },
      { ad_group_id: "10", ad_campaign_type: "SPONSORED_PRODUCTS", ad_state: "ENABLED", ad_creative_products: '[{"productId":"B0ASIN","productIdType":"ASIN"}]' },
      { ad_group_id: "11", ad_campaign_type: "SPONSORED_BRANDS", ad_state: "ENABLED", ad_creative_products: '[{"productId":"0692726713","productIdType":"ASIN"}]' },
      { ad_group_id: "12", ad_campaign_type: "SPONSORED_PRODUCTS", ad_state: "ARCHIVED", ad_creative_products: '[{"productId":"OLD","productIdType":"SKU"}]' },
    ]);
    expect(m.get("10")).toEqual([{ id: "W4-3ZND-PRCY", type: "SKU" }, { id: "B0ASIN", type: "ASIN" }]);
    expect(m.has("11")).toBe(false);
    expect(m.has("12")).toBe(false);
  });
});
