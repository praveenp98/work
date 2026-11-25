import { describe, expect, it } from "vitest";
import { cooldown, tagAll, weekTotal } from "./job-history";
import type { Proposal } from "./rules/types";
import type { Action, Run } from "./store/types";

const P = (code: string, target: string, value = 10): Proposal => ({ code, kind: "bid", campaign: "C", adGroup: "G", target, matchType: "exact", reason: "", valueMonthly: value, undo: "" } as Proposal);
const now = new Date("2026-11-25T12:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const A = (p: Proposal, days: number, status: Action["status"] = "applied") => ({ id: p.code, workspaceId: "w", brand: "b", runId: "r0", code: p.code, proposal: p, appliedAt: ago(days), followUpAt: ago(days - 7), status } as Action);
const R = (id: string, days: number, ps: Proposal[]) => ({ id, workspaceId: "w", brand: "b", kind: "sp_search_term", createdAt: ago(days), proposals: ps } as Run);

describe("jobs over time", () => {
  it("holds back anything changed in the last 7 days", () => {
    const r = cooldown([P("B1", "journal"), P("B2", "planner")], [A(P("X", "journal"), 3), A(P("Y", "planner"), 9)], now);
    expect(r.kept.map((p) => p.target)).toEqual(["planner"]);
    expect(r.cooling).toBe(1);
  });
  it("tags new, repeat and follow-up", () => {
    const t = tagAll([P("B1", "journal"), P("B2", "planner"), P("B3", "notebook")], [R("old", 1, [P("Z", "planner")])], [A(P("X", "notebook"), 10)]);
    expect(t).toEqual({ B1: "new", B2: "repeat", B3: "follow-up" });
  });
  it("counts each fix once across the week, at its newest value", () => {
    const w = weekTotal([R("a", 3, [P("B1", "journal", 50)]), R("b", 1, [P("B1", "journal", 40), P("B2", "planner", 10)]), R("c", 9, [P("B9", "old", 999)])], [A(P("X", "x"), 2)], now);
    expect(w).toEqual({ found: 2, value: 50, approved: 1 });
  });
});
