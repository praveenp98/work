import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStore } from "./store/memory";
import { loadFixture } from "./test-utils";
import { applyChanges, buildBrief, createWorkspace, expandCodes, loadWorkspace, revertChanges, runAnalysis, setBrandSettings } from "./workspace";

const HEADER = ["Date", "Campaign Name", "Ad Group Name", "Targeting", "Match Type", "Customer Search Term", "Impressions", "Clicks", "Spend", "7 Day Total Sales", "7 Day Total Orders (#)"];
/** Daily rows for Nov 5–11, 2026: the negated junk term no longer spends; the bid-cut target improves. */
function laterReport(): unknown[][] {
  const rows: unknown[][] = [HEADER];
  for (let d = 5; d <= 11; d++) {
    const date = `2026-11-${String(d).padStart(2, "0")}`;
    rows.push([date, "SP - Bamboo Board - Broad", "Broad", "cutting board", "BROAD", "cutting board", 600, 5, 6.0, 24.0, 1]);
    rows.push([date, "SP - Bamboo Board - Exact", "Exact", "bamboo cutting board", "EXACT", "bamboo cutting board", 500, 5, 7.0, 40.0, 1]);
  }
  return rows;
}

describe("workspace memory loop", () => {
  let store: MemoryStore;
  beforeEach(() => { store = new MemoryStore(); });

  it("creates a workspace reachable only by its token", async () => {
    const { token, ws } = await createWorkspace(store);
    expect(token).toMatch(/^rw_[A-Za-z0-9]{24}$/);
    expect((await loadWorkspace(store, token))?.id).toBe(ws.id);
    expect(await loadWorkspace(store, "rw_" + "x".repeat(24))).toBeNull();
    expect(await loadWorkspace(store, "nope")).toBeNull();
  });

  it("analyze → apply → newer report → results → brief → revert", async () => {
    const { ws } = await createWorkspace(store);
    await setBrandSettings(store, ws, "main", { targetAcos: 0.3, protectedTerms: ["bamboo"] });
    const first = await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    expect(first.run?.proposals.length).toBeGreaterThan(0);
    // protected term never proposed as a negative
    expect(first.run!.proposals.some((p) => p.kind === "negative" && p.target.includes("bamboo"))).toBe(false);

    const neg = first.run!.proposals.find((p) => p.kind === "negative" && p.target === "plastic cutting board dishwasher safe")!;
    const bid = first.run!.proposals.find((p) => p.kind === "bid" && p.target === "cutting board")!;
    const { actions, unknown } = await applyChanges(store, ws, [neg.code, bid.code, "Z9"]);
    expect(actions).toHaveLength(2);
    expect(unknown).toContain("Z9");
    // applying again doesn't duplicate
    expect((await applyChanges(store, ws, [neg.code])).actions).toHaveLength(0);

    // pretend the changes were applied on Nov 3
    for (const a of await store.listActions(ws.id)) { a.appliedAt = "2026-11-03T10:00:00Z"; await store.saveAction(a); }
    const second = await runAnalysis(store, ws, "main", laterReport());
    const byTarget = Object.fromEntries(second.checked.map((a) => [a.proposal.target, a]));
    expect(byTarget["plastic cutting board dishwasher safe"].status).toBe("worked");
    expect(byTarget["plastic cutting board dishwasher safe"].result?.savedEstimate).toBeGreaterThan(0);
    expect(byTarget["cutting board"].status).toBe("worked"); // ACoS 52% → 25%

    const brief = await buildBrief(store, ws, new Date("2026-11-20T09:00:00Z"));
    expect(brief.saved).toBeGreaterThan(0);
    expect(brief.totals.worked).toBe(2);
    expect(brief.season).toMatch(/Black Friday/);
    expect(brief.perBrand[0].stale).toContain("inventory");

    const reverted = await revertChanges(store, ws, [actions[1].id.slice(0, 8)]);
    expect(reverted[0].status).toBe("reverted");
  });

  it("uses the last ads snapshot for TACoS on a business report", async () => {
    const { ws } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const b = await runAnalysis(store, ws, "main", loadFixture("business-report.csv"));
    expect(b.out.analysis.stats.tacosPct).toBeGreaterThan(0);
  });
});

describe("expandCodes", () => {
  it("expands ranges and lists", () => {
    expect(expandCodes(["N1-N3, b2", "H1"])).toEqual(["N1", "N2", "N3", "B2", "H1"]);
    expect(expandCodes(["N2-4"])).toEqual(["N2", "N3", "N4"]);
  });
});

describe("budget result checks", () => {
  it("judges a budget raise from a newer campaign report", async () => {
    const store = new MemoryStore();
    const { ws } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-campaign-report.csv"));
    const { actions } = await applyChanges(store, ws, ["G2"]);
    expect(actions[0].proposal.campaign).toBe("SP - Bamboo Board - Exact");
    for (const a of await store.listActions(ws.id)) { a.appliedAt = "2026-11-03T10:00:00Z"; await store.saveAction(a); }
    const later: unknown[][] = [["Date", "Campaign Name", "Budget", "Impressions", "Clicks", "Spend", "7 Day Total Sales", "7 Day Total Orders (#)"]];
    for (let d = 5; d <= 11; d++) later.push([`2026-11-${String(d).padStart(2, "0")}`, "SP - Bamboo Board - Exact", "15", "900", "9", "14.5", "70", "2"]);
    const res = await runAnalysis(store, ws, "main", later);
    expect(res.checked[0].status).toBe("worked");
  });
});
