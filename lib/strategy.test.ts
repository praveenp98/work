import { describe, expect, it } from "vitest";
import { POST as strategy } from "../app/api/w/strategy/route";
import type { CampaignRow } from "./parsers/campaign";
import { analyzeBudgets } from "./rules/budget";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { strategyLines, strategyText } from "./strategy";
import { grantTrial } from "./test-utils";
import { brandSettings, createWorkspace } from "./workspace";

const row = (campaign: string, budget: number, spend: number, sales: number): CampaignRow => ({ campaign, status: "enabled", budget, impressions: 1000, clicks: 100, spend, sales, orders: 20, date: null, endDate: null });

describe("strategy: plan lines", () => {
  it("says the goal, target, break-even, budget limit, never-cut list, exceptions and autonomy", () => {
    const L = strategyLines({ mainGoal: "profit", targetAcos: 0.2, breakevenAcos: 0.35, monthlyAdBudget: 6000, protectedCampaigns: ["Brand Defense"], protectedTerms: ["Brand Defense", "bamboo & co"], goals: [{ match: "3-pack", goal: "growth" }, { match: "board", goal: "profit" }] }, "guardrails");
    expect(L[0]).toMatch(/^Profit first/);
    expect(L.join(" ")).toMatch(/ACoS around 20%.*break-even \(35%\)/);
    expect(L.join(" ")).toMatch(/under \$6,000 a month/);
    expect(L.join(" ")).toMatch(/Never cut: “Brand Defense”, “bamboo & co”\./); // deduped
    expect(L.join(" ")).toMatch(/Exceptions: 3-pack → growth first\./); // same-as-main goal not repeated
    expect(L.at(-1)).toMatch(/Money-saving moves/);
  });

  it("only reaches the AI once set, with the owner's notes", () => {
    expect(strategyText({ targetAcos: 0.3, breakevenAcos: 0.45 })).toBe("");
    expect(strategyText({ targetAcos: 0.3, breakevenAcos: 0.45, strategySetAt: "2026-11-24", notes: "Q4 is 40% of our year" })).toMatch(/Owner's strategy.*Owner's notes: Q4 is 40% of our year/);
  });
});

describe("strategy: monthly ad budget limit", () => {
  const rows = [row("Kitchen – Exact", 40, 39 * 30, 39 * 30 * 4)]; // 98% used, ACoS 25%
  it("without a limit, a profitable capped campaign gets a raise", () => {
    expect(analyzeBudgets(rows, 30, { targetAcos: 0.3, breakevenAcos: 0.45 }).proposals).toHaveLength(1);
  });
  it("a raise that passes the limit becomes a note instead", () => {
    const a = analyzeBudgets(rows, 30, { targetAcos: 0.3, breakevenAcos: 0.45, monthlyAdBudget: 1300 }); // $40/day ≈ $1,216/mo; +$10/day passes $1,300
    expect(a.proposals).toHaveLength(0);
    expect(a.findings.some((f) => /ad budget limit/.test(f.title))).toBe(true);
  });
});

describe("POST /api/w/strategy", () => {
  const call = (body: object) => strategy(new Request("https://rocco.works/api/w/strategy", { method: "POST", body: JSON.stringify(body) })).then((r) => r.json());

  it("saves the whole strategy and returns the plan", async () => {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id);
    const r = await call({ t: token, mainGoal: "growth", targetAcos: 0.4, marginPct: "50", monthlyAdBudget: "8000", protectedCampaigns: ["Brand"], protectedTerms: ["Brand"], goals: [{ match: "Journal", goal: "profit" }], autonomy: "guardrails", notes: "Launching in March" });
    expect(r.ok).toBe(true);
    expect(r.plan[0]).toMatch(/^Growth first/);
    const fresh = (await store.getWorkspaceById(ws.id))!;
    const b = Object.keys(fresh.brands)[0];
    expect(fresh.brands[b]).toMatchObject({ mainGoal: "growth", targetAcos: 0.4, breakevenAcos: 0.5, monthlyAdBudget: 8000, notes: "Launching in March" });
    expect(fresh.brands[b].strategySetAt).toBeTruthy();
    expect(fresh.autonomy).toBe("guardrails");
    // Clearing optional fields really clears them
    await call({ t: token, mainGoal: "balance", targetAcos: 0.3, marginPct: "", monthlyAdBudget: "", notes: "" });
    const again = (await store.getWorkspaceById(ws.id))!.brands[b];
    expect(again.monthlyAdBudget).toBeUndefined();
    expect(again.notes).toBeUndefined();
    expect(brandSettings((await store.getWorkspaceById(ws.id))!, b).breakevenAcos).toBeCloseTo(0.45);
  });

  it("refuses a target above break-even, and unpaid teams", async () => {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    expect((await call({ t: token, targetAcos: 0.3 })).ok).toBe(false);
    await grantTrial(store, ws.id);
    expect(await call({ t: token, targetAcos: 0.4, marginPct: "30" })).toMatchObject({ ok: false, error: expect.stringMatching(/above your break-even/) });
  });
});
