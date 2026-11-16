import { describe, expect, it } from "vitest";
import { surgePlan } from "./surge";

const base = { dailyBudget: 100, targetAcos: 0.3, breakevenAcos: 0.45, aggression: "normal" as const };

describe("surgePlan", () => {
  it("covers Nov 19 to Dec 2 with Black Friday as the biggest day", () => {
    const p = surgePlan(base);
    expect(p.days).toHaveLength(14);
    expect(p.days[0].date).toBe("2026-11-19");
    const bf = p.days.find((d) => d.date === "2026-11-27")!;
    expect(bf.budget).toBe(Math.max(...p.days.map((d) => d.budget)));
    expect(bf.budget).toBe(220);
  });
  it("never raises winner bids more than 20% per step", () => {
    for (const a of ["careful", "normal", "bold"] as const) {
      expect(Math.max(...surgePlan({ ...base, aggression: a }).days.map((d) => d.winnerBidPct))).toBeLessThanOrEqual(20);
    }
  });
  it("scales with aggression", () => {
    const c = surgePlan({ ...base, aggression: "careful" }).extraBudget;
    const b = surgePlan({ ...base, aggression: "bold" }).extraBudget;
    expect(c).toBeLessThan(surgePlan(base).extraBudget);
    expect(b).toBeGreaterThan(surgePlan(base).extraBudget);
  });
  it("lets peak days run up to breakeven ACoS", () => {
    const p = surgePlan(base);
    expect(p.days.find((d) => d.phase === "peak")!.acosCeiling).toBe(0.45);
    expect(p.days[0].acosCeiling).toBe(0.36);
  });
  it("warns when target is above breakeven", () => {
    expect(surgePlan({ ...base, breakevenAcos: 0.25 }).warnings.length).toBeGreaterThan(0);
  });
});
