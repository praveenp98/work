import { describe, expect, it } from "vitest";
import { shortName, sortFindings } from "./types";

describe("shortName", () => {
  it("keeps the product's own name from a long Amazon title", () => {
    expect(shortName("The Nutrition Sidekick Journal: Weight Loss Journal. Food Journals for Tracking Meals")).toBe("The Nutrition Sidekick Journal");
    expect(shortName("The Morning Sidekick Journal - Habit Tracker Journal! A Guided Journal")).toBe("The Morning Sidekick Journal");
    expect(shortName("Short")).toBe("Short");
  });
  it("cuts very long names at a word", () => {
    const s = shortName("Weightlifting Elevate Exercise Cards Comprehensive Weightlifting Card Deck for Gym Fitness");
    expect(s.length).toBeLessThanOrEqual(49);
    expect(s.endsWith("…")).toBe(true);
  });
});

describe("sortFindings", () => {
  it("puts urgent findings first (so they survive the saved top 12) and merges duplicates", () => {
    const fs = [
      { severity: "medium" as const, title: "A: no sales" }, { severity: "low" as const, title: "B: overstock" },
      { severity: "medium" as const, title: "A: no sales" }, { severity: "high" as const, title: "C: ~0 days of stock left" },
    ];
    expect(sortFindings(fs).map((f) => f.title)).toEqual(["C: ~0 days of stock left", "A: no sales", "B: overstock"]);
  });
});
