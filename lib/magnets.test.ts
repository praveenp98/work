import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyze } from "./analyze";
import { parseAdviceRules } from "./magnets-ai";
import { checkAdvice, MAGNETS, magnet, type Reports } from "./magnets";
import { readTables } from "./readTable";

async function load(files: string[]): Promise<Reports> {
  const out: Reports = {};
  for (const f of files) {
    const t = (await readTables(new File([readFileSync(`public/samples/${f}`, "utf8")], f)))[0];
    const a = analyze(t); out[a.kind] = a;
  }
  return out;
}
const NOW = ["sp-search-term-report.csv", "sp-campaign-report.csv", "business-report.csv", "restock-inventory.csv", "sp-placement-report.csv"];

describe("free tools", () => {
  it("has 10 unique slugs", () => {
    expect(MAGNETS).toHaveLength(10);
    expect(new Set(MAGNETS.map((m) => m.slug)).size).toBe(10);
  });

  it("every tool returns a result on the sample account", async () => {
    const now = await load(NOW), before = await load(["sp-search-term-report-before.csv", "sp-campaign-report-before.csv"]);
    for (const m of MAGNETS) {
      const advice = m.slug === "claude-vs-rocco" ? checkAdvice(parseAdviceRules('Add "free cutting board" as a negative.\nRaise the bid on "bamboo cutting board" by 40%.'), now, 35) : undefined;
      const r = m.run({ now, before, form: { tasks: "negatives,bids,creative", fee: "1500", margin: "35", agency: "1200", hide: "yes" }, advice });
      expect(r.headline, m.slug).toBeTruthy();
      expect(r.items.length, m.slug).toBeGreaterThan(0);
      expect(r.share.length, m.slug).toBeLessThan(200);
    }
  });

  it("leak detector sums monthly leaks and states the year", async () => {
    const r = magnet("amazon-money-leak-detector")!.run({ now: await load(NOW), form: {} });
    expect(r.score).toBeGreaterThan(0);
    expect(r.stats.find((s) => s.k === "Per year")!.v).toBe(`$${(r.score! * 12).toLocaleString("en-US")}`);
  });

  it("agency audit catches burners never blocked in both periods", async () => {
    const r = magnet("amazon-agency-audit")!.run({ now: await load(["sp-search-term-report.csv"]), before: await load(["sp-search-term-report-before.csv"]), form: { fee: "1500" } });
    expect(r.items.some((x) => /never blocked/.test(x.title))).toBe(true);
    expect(r.sub).toMatch(/not why/);
  });

  it("wrapped hides money when asked", async () => {
    const now = await load(["business-report.csv", "sp-search-term-report.csv"]);
    expect(magnet("amazon-seller-wrapped")!.run({ now, form: { hide: "yes" } }).card!.s).toBe("");
    expect(magnet("amazon-seller-wrapped")!.run({ now, form: { hide: "no" } }).card!.s).toMatch(/^\$/);
  });

  it("advice check rejects blocking a search that sells, agrees on a dead one, cautions on big jumps", async () => {
    const now = await load(["sp-search-term-report.csv"]);
    const c = checkAdvice([
      { kind: "negative", target: "charcuterie board large", text: "" },
      { kind: "negative", target: "free cutting board", text: "" },
      { kind: "bid_up", target: "bamboo cutting board", amountPct: 40, text: "" },
      { kind: "restructure", target: "", text: "" },
      { kind: "negative", target: "not in report", text: "" },
    ], now, 35);
    expect(c.map((x) => x.verdict)).toEqual(["disagree", "agree", "caution", "caution", "unknown"]);
  });

  it("rule fallback splits quoted targets", () => {
    const a = parseAdviceRules('1. Add "free" and "pdf" as negative keywords.\n2. Lower the bid on "x" by 15%.\nThanks!');
    expect(a.map((x) => [x.kind, x.target])).toEqual([["negative", "free"], ["negative", "pdf"], ["bid_down", "x"]]);
    expect(a[2].amountPct).toBe(15);
  });

  it("fire-my-agency scores what's automatable and shows the fee gap", () => {
    const r = magnet("could-i-fire-my-amazon-agency")!.run({ now: {}, form: { tasks: "negatives,bids,creative,calls", fee: "1500" } });
    expect(r.score).toBe(50);
    expect(r.sub).toMatch(/a year difference/);
  });
});
