import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyze } from "./analyze";
import { readTables } from "./readTable";
import { buildWrapped, decodeShare, encodeShare, shortName } from "./wrapped";

const load = async (f: string) => analyze((await readTables(new File([readFileSync(`public/samples/${f}`, "utf8")], f)))[0]);
const NOW = new Date("2026-11-25T12:00:00Z");

describe("Seller Wrapped", () => {
  it("tells the year from the business report", async () => {
    const b = await load("business-report-year.csv");
    const w = buildWrapped({ biz: b.business!, period: "This year so far", hide: false, now: NOW })!;
    const ids = w.slides.map((s) => s.id);
    expect(ids.slice(0, 5)).toEqual(["units", "sales", "traffic", "hero", "persona"]);
    expect(ids).toEqual(expect.arrayContaining(["gem", "leaky", "zombies", "buybox", "resolution"]));
    // free slides first, deeper cuts locked
    expect(w.slides.filter((s) => !s.locked).map((s) => s.id)).toEqual(["units", "sales", "traffic", "hero", "persona"]);
    expect(w.slides.find((s) => s.id === "gem")!.line).toMatch(/Cutting Board Oil/);
    expect(w.slides.find((s) => s.id === "leaky")!.line).toMatch(/Set of 3/);
    expect(w.slides.find((s) => s.id === "units")!.sub).toMatch(/one every \d+ minutes/);
  });

  it("hides money everywhere when asked", async () => {
    const b = await load("business-report-year.csv"), st = await load("sp-search-term-report.csv");
    const w = buildWrapped({ biz: b.business!, terms: st.report!.rows, roast: st.roast, period: "Last 12 months", hide: true, now: NOW })!;
    const text = w.slides.map((s) => `${s.big} ${s.line} ${s.sub ?? ""}`).join(" ");
    expect(text).not.toMatch(/\$\d/);
    expect(w.share.sales).toBeUndefined();
    expect(w.code).not.toMatch(/bamboo|board/i);
  });

  it("adds the ads story with a search term report", async () => {
    const b = await load("business-report-year.csv"), st = await load("sp-search-term-report.csv");
    const w = buildWrapped({ biz: b.business!, terms: st.report!.rows, roast: st.roast, period: "This year so far", hide: false, now: NOW })!;
    expect(w.slides.map((s) => s.id)).toEqual(expect.arrayContaining(["search", "donation", "adshare"]));
    expect(w.slides.find((s) => s.id === "search")!.big).toBe("“bamboo cutting board”");
  });

  it("share code round-trips and stays short", async () => {
    const b = await load("business-report-year.csv");
    const w = buildWrapped({ biz: b.business!, period: "This year so far", hide: false, now: NOW })!;
    expect(w.code.length).toBeLessThan(60);
    expect(decodeShare(w.code)).toEqual(w.share);
    expect(decodeShare("nope.1.2")).toBeNull();
    expect(decodeShare(encodeShare({ persona: "closer", units: 10, minutes: 5, topShare: 40, products: 2, conv: 16.2, days: 30 }))!.conv).toBe(16.2);
  });

  it("short names cut at the first comma and never mid-word", () => {
    expect(shortName("The Weightlifting Transformation Gym Buddy Journal, 12 Week Planner")).toBe("The Weightlifting Transformation…");
    expect(shortName("Bamboo Cutting Board Large, 18x12")).toBe("Bamboo Cutting Board Large");
  });
});
