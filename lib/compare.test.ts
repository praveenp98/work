import { describe, expect, it } from "vitest";
import { COMPETITORS, yearlyCost } from "./compare";

describe("compare pages data", () => {
  it("slugs are unique, URL-safe and not dr-ppc (it has its own page)", () => {
    const slugs = COMPETITORS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
    expect(slugs).not.toContain("dr-ppc");
  });

  it("every entry says where its numbers came from and has both honest lists", () => {
    for (const c of COMPETITORS) {
      expect(c.source.length).toBeGreaterThan(10);
      expect(c.pickThem.length).toBeGreaterThan(0);
      expect(c.pickRocco.length).toBeGreaterThan(0);
    }
  });

  it("yearly estimates follow the published model", () => {
    const t = COMPETITORS.find((c) => c.slug === "teikametrics")!;
    expect(yearlyCost(t, 5000)).toBe(179 * 12);
    expect(yearlyCost(t, 30000)).toBe(Math.round((499 + 0.03 * 20000) * 12));
    expect(yearlyCost(COMPETITORS.find((c) => c.slug === "bidx")!, 10000)).toBeNull(); // % not published
  });
});
