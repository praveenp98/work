import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as approve } from "../app/api/w/approve/route";
import { planFor } from "./apply";
import type { Proposal } from "./rules/types";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial, loadFixture } from "./test-utils";
import { createWorkspace, runAnalysis } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const neg: Proposal = { code: "N1", kind: "negative", campaign: "C", adGroup: "A", target: "plastic mat", matchType: "negative exact", reason: "r", valueMonthly: 10, ids: { campaignId: "111", adGroupId: "222" } };

describe("approve → Rocco makes the change in Amazon", () => {
  it("maps fixes to DataDoe write actions only when Amazon's IDs are known", () => {
    expect(planFor(neg)).toEqual({ type: "AMAZON_ADS_TARGETS_ADD", details: { targets: [{ campaignId: "111", adGroupId: "222", adProduct: "SPONSORED_PRODUCTS", negative: true, state: "ENABLED", targetType: "KEYWORD", targetDetails: { keywordTarget: { keyword: "plastic mat", matchType: "EXACT" } } }] } });
    expect(planFor({ ...neg, ids: undefined })).toBeNull();
    expect(planFor({ ...neg, code: "B1", kind: "bid", proposed: 0.853, ids: { keywordId: "999" } })).toEqual({ type: "AMAZON_ADS_TARGETS_UPDATE", details: { targets: [{ targetId: "999", adProduct: "SPONSORED_PRODUCTS", bid: 0.85 }] } });
  });

  it("dry run first, then live; logs the change; fixes without IDs come back with steps", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const sent: { dryRun?: boolean; type: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      if (String(u).endsWith("/actions")) { const b = JSON.parse(String(init!.body)); sent.push({ dryRun: b.dryRun, type: b.type }); return Response.json({ id: b.dryRun ? undefined : "act-1", status: b.dryRun ? "VALID" : "PENDING" }, { status: b.dryRun ? 200 : 202 }); }
      return Response.json({}, { status: 404 });
    }));
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const fresh = (await store.getWorkspaceById(ws.id))!;
    fresh.amazon = { accounts: [{ id: "acct-1", name: "main", country: "US", connectedAt: new Date().toISOString() }] };
    await store.saveWorkspace(fresh);
    await grantTrial(store, ws.id);
    // Give N1 Amazon IDs (as DataDoe's search term export will), leave N2 without.
    const run = (await store.listRuns(ws.id, { limit: 1 }))[0];
    run.proposals[0].ids = { campaignId: "111", adGroupId: "222" };
    await store.addRun({ ...run, id: "run-with-ids", createdAt: new Date(Date.now() + 1000).toISOString() });

    const r = await (await approve(new Request("https://rocco.works/api/w/approve", { method: "POST", body: JSON.stringify({ t: token, brand: "main", codes: ["N1", "N2"] }) }))).json();
    expect(r.direct).toBe(true);
    expect(r.results[0]).toMatchObject({ code: "N1", status: "applied", actionId: "act-1" });
    expect(r.results[1]).toMatchObject({ code: "N2", status: "manual" });
    expect(r.results[1].how).toMatch(/Negative targeting/);
    expect(sent).toEqual([{ dryRun: true, type: "AMAZON_ADS_TARGETS_ADD" }, { dryRun: undefined, type: "AMAZON_ADS_TARGETS_ADD" }]);
    expect((await store.listActions(ws.id)).map((a) => a.code)).toEqual(["N1"]);
  });
});
