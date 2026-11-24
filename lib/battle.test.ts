import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as goals } from "../app/api/w/goals/route";
import { yearlyAt } from "./competitors";
import { pacingAlerts, pacingMessage } from "./pacing";
import { bidFor } from "./rules/bids";
import { targetFor } from "./rules/settings";
import { DEFAULT_SETTINGS } from "./rules/settings";
import type { Proposal } from "./rules/types";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial } from "./test-utils";
import { canUndo, reversePlan } from "./undo";
import { autoEligible } from "./autopilot";
import { createWorkspace } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("price vs a %-of-ad-spend tool", () => {
  it("Dr. PPC = ($299 + 2% of spend) × 12; Rocco flat", () => {
    expect(yearlyAt(10000)).toMatchObject({ drppc: 5988, rocco: 2790, saved: 3198 });
    expect(yearlyAt(50000).drppc).toBe(15588);
  });
});

describe("goal per product", () => {
  const s = { targetAcos: 0.3, goals: [{ match: "Morning Journal", goal: "profit" as const }, { match: "giraffe", goal: "growth" as const }] };
  it("moves the target ACoS for campaigns that name the product", () => {
    expect(targetFor(s, "SP | Morning Journal | Exact")).toBeCloseTo(0.24);
    expect(targetFor(s, "SP | George Giraffe | Auto")).toBeCloseTo(0.39);
    expect(targetFor(s, "Other campaign")).toBe(0.3);
  });
  it("changes the bid Rocco proposes", () => {
    const t = { spend: 40, sales: 100, clicks: 40, orders: 4 }; // ACoS 40%, CPC $1
    const base = bidFor({ ...t, campaign: "Other" }, { ...DEFAULT_SETTINGS, ...s })!;
    const growth = bidFor({ ...t, campaign: "SP | George Giraffe" }, { ...DEFAULT_SETTINGS, ...s });
    expect(base).toBeCloseTo(0.8); // capped −20%
    expect(growth === null || growth > base).toBe(true); // growth goal keeps more of the bid
  });
});

describe("undo in Amazon", () => {
  const p = (x: Partial<Proposal>): Proposal => ({ code: "G1", kind: "budget", campaign: "C", adGroup: "", target: "C", reason: "", valueMonthly: 0, undo: "set it back", ...x });
  it("puts a budget or bid back; negatives stay manual", () => {
    expect(reversePlan(p({ current: 40, proposed: 50, ids: { campaignId: "9" } }))?.back).toBe("budget back to $40.00/day");
    expect(reversePlan(p({ kind: "bid", current: 1.25, proposed: 1, ids: { keywordId: "7" } }))?.type).toBe("AMAZON_ADS_TARGETS_UPDATE");
    expect(reversePlan(p({ kind: "negative", ids: { campaignId: "9", adGroupId: "8" } }))).toBeNull();
    expect(canUndo({ status: "reverted", proposal: p({ current: 40, ids: { campaignId: "9" } }) })).toBe(false);
  });
});

describe("midday budget pacing", () => {
  it("flags profitable campaigns that run dry well before midnight", () => {
    const a = pacingAlerts([
      { campaign: "Winner", budget: 50, spend: 40, sales: 200 }, // 80% by 1pm → out ~4pm, ACoS 20%
      { campaign: "Loser", budget: 50, spend: 45, sales: 60 }, // ACoS 75%: don't feed it
      { campaign: "Calm", budget: 50, spend: 10, sales: 80 }, // 20% used
    ], { localHour: 13, targetAcos: 0.3 });
    expect(a.map((x) => x.campaign)).toEqual(["Winner"]);
    expect(a[0].outAt).toBeCloseTo(16.3, 1);
    expect(pacingMessage("Habit Nest US", a, "https://rocco.works/w/x")).toMatch(/runs out ~4 PM at 20% ACoS/);
  });
});

describe("POST /api/w/goals", () => {
  it("saves target, goals and the auto-undo opt-in", async () => {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id);
    const r = await (await goals(new Request("https://rocco.works/api/w/goals", { method: "POST", body: JSON.stringify({ t: token, targetAcos: 0.25, goals: [{ match: "Journal", goal: "growth" }, { match: "journal", goal: "profit" }, { match: "x", goal: "profit" }], autoUndo: true }) }))).json();
    expect(r).toMatchObject({ ok: true, goals: [{ match: "Journal", goal: "growth" }] }); // dupes and 1-letter words dropped
    const fresh = (await store.getWorkspaceById(ws.id))!;
    expect(fresh.autoUndo).toBe(true);
    expect(Object.values(fresh.brands)[0]).toMatchObject({ targetAcos: 0.25 });
  });
});

describe("autonomy ladder", () => {
  const p = (x: Partial<Proposal>): Proposal => ({ code: "X1", kind: "negative", campaign: "C", adGroup: "", target: "t", reason: "", valueMonthly: 1, undo: "", ...x });
  it("level 1 makes nothing on its own", () => expect(autoEligible(p({}), "approve")).toBe(false));
  it("level 2 makes only money-saving changes", () => {
    expect(autoEligible(p({ kind: "negative" }), "guardrails")).toBe(true);
    expect(autoEligible(p({ kind: "bid", current: 1.2, proposed: 1 }), "guardrails")).toBe(true);
    expect(autoEligible(p({ kind: "bid", current: 1, proposed: 1.2 }), "guardrails")).toBe(false);
    expect(autoEligible(p({ kind: "budget", current: 40, proposed: 50 }), "guardrails")).toBe(false);
  });
  it("level 3 adds raises, never new campaigns or structure", () => {
    expect(autoEligible(p({ kind: "budget", current: 40, proposed: 50 }), "auto")).toBe(true);
    expect(autoEligible(p({ kind: "harvest" }), "auto")).toBe(false);
    expect(autoEligible(p({ kind: "structure" }), "auto")).toBe(false);
  });
});
