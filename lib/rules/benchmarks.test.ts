import { describe, expect, it } from "vitest";
import { benchmark, betterThan, MIN_ACCOUNTS } from "./benchmarks";

describe("benchmarks", () => {
  it("computes the share of accounts beaten", () => {
    expect(betterThan(10, [5, 15, 20, 30], false)).toBe(75); // lower leak is better
    expect(betterThan(10, [5, 15, 20, 30], true)).toBe(25);
  });
  it("stays hidden until enough accounts exist", () => {
    const peers = Array.from({ length: MIN_ACCOUNTS - 1 }, (_, i) => ({ leakPct: i * 5 }));
    expect(benchmark("sp_search_term", { leakPct: 20 }, peers).ready).toBe(false);
  });
  it("reports median and percentile once ready", () => {
    const peers = Array.from({ length: 20 }, (_, i) => ({ leakPct: i * 2, acosPct: 20 + i }));
    const b = benchmark("sp_search_term", { leakPct: 10, acosPct: 25 }, peers);
    expect(b.ready).toBe(true);
    const leak = b.lines.find((l) => l.label === "ad spend leaking")!;
    expect(leak.median).toBe(19);
    expect(leak.betterThanPct).toBe(70);
  });
});
