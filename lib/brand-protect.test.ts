import { describe, expect, it } from "vitest";
import { brandPhrases, isBrandText } from "./analyze";

describe("brand protection", () => {
  it("turns account names into brand phrases without the marketplace", () => {
    expect(brandPhrases(["Habit Nest US"])).toEqual(["habit nest", "habitnest"]);
    expect(brandPhrases(["Acme"])).toEqual(["acme"]);
  });
  it("spots brand keywords, not generic ones", () => {
    const b = brandPhrases(["Habit Nest US"]);
    expect(isBrandText("habit nest journal", b)).toBe(true);
    expect(isBrandText("HabitNest planner", b)).toBe(true);
    expect(isBrandText("bird nest", b)).toBe(false);
    expect(isBrandText("habit tracker", b)).toBe(false);
  });
});
