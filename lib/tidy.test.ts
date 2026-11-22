import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTidy, familyName, humanPart, isReadable, shortProduct } from "./rules/tidy";
import { applyTidy, undoTidy } from "./tidy-apply";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("tidy: names a human can read (patterns from a real account)", () => {
  it("strips codes, dates and IDs, keeps the real wording", () => {
    expect(humanPart("OW_1950045994_20221202_fitness journal for women")).toBe("fitness journal for women");
    expect(humanPart('NEW_SP_1950045994_KW="resistance band"_Bid=0.67')).toBe("resistance band");
    expect(humanPart("BR_P_1950045234_20210505_home workout journal", ["Bodyweight Home Workout"])).toBe("home workout journal");
    expect(humanPart("NEW_1950045994_Badass_Auto", ["Badass Body Goals"])).toBe("");
    expect(isReadable("BR_0692726713_20191118_morning sidekick journal")).toBe(false);
    expect(isReadable("SP | Morning Sidekick Journal | Exact | morning routine journal")).toBe(true);
  });
  it("short product names and ranges", () => {
    expect(shortProduct("The Morning Sidekick Journal: Habit-Building Morning Routine Planner", "Habit Nest")).toBe("Morning Sidekick Journal");
    expect(shortProduct("Budgeting Sidekick Journal by Habit Nest")).toBe("Budgeting Sidekick Journal");
    expect(familyName(["Morning Sidekick Journal", "Morning Sidekick Journal Red"])).toBe("Morning Sidekick Journal");
    expect(familyName(["Morning Sidekick Journal", "Budgeting Sidekick Journal", "Gratitude Sidekick Journal"])).toBe("Sidekick Journal Range");
    expect(familyName(["Yoga Cards", "Dumbbell Plan", "Diet Log", "Budget Book"], "Habit Nest")).toBe("Habit Nest Range");
  });
  it("plans renames, product portfolios, idle and mixed flags", () => {
    const plan = buildTidy({
      campaigns: [
        { id: "1", name: "OW_0692726713_20221202_morning routine journal", state: "ENABLED", auto: false },
        { id: "2", name: "0692726713_ATM", state: "ENABLED", auto: true },
        { id: "3", name: "BR_P_0692726713_20210505_journal", state: "ENABLED", auto: false, portfolioId: "P9" },
        { id: "4", name: "old paused", state: "PAUSED", auto: false },
      ],
      targets: [
        { campaignId: "1", type: "KEYWORD", match: "EXACT", negative: false, state: "ENABLED", keyword: "morning routine journal" },
        { campaignId: "3", type: "KEYWORD", match: "BROAD", negative: false, state: "ENABLED", keyword: "journal" },
        { campaignId: "3", type: "PRODUCT", match: "PRODUCT_EXACT", negative: false, state: "ENABLED" },
        { campaignId: "3", type: "KEYWORD", match: "EXACT", negative: true, state: "ENABLED", keyword: "free" },
      ],
      ads: ["1", "2", "3"].map((c) => ({ campaignId: c, products: [{ id: "MSJ-1", type: "SKU" }] })),
      products: [{ asin: "0692726713", sku: "MSJ-1", title: "The Morning Sidekick Journal: Habit Planner", brand: "Habit Nest" }],
      perf: [{ campaignId: "1", impressions: 900, clicks: 20, spend: 30, sales: 120 }, { campaignId: "3", impressions: 50, clicks: 2, spend: 3, sales: 0 }],
    }, new Date("2026-11-22"));
    expect(plan.total).toBe(3); // live only by default
    const by = Object.fromEntries(plan.items.map((i) => [i.id, i]));
    expect(by["1"]).toMatchObject({ newName: "SP | Morning Sidekick Journal | Exact | morning routine journal", targeting: "Exact", rename: true, portfolio: "Morning Sidekick Journal" });
    expect(by["2"]).toMatchObject({ newName: "SP | Morning Sidekick Journal | Auto", targeting: "Auto", issue: "idle" });
    expect(by["3"]).toMatchObject({ targeting: "Mixed", issue: "mixed", portfolio: undefined }); // already has a portfolio
    expect(plan).toMatchObject({ readable: 0, idle: 1, mixed: 1, portfolios: ["Morning Sidekick Journal"] });
  });
});

describe("tidy: apply in Amazon and undo", () => {
  it("creates the portfolio, renames in one batch, moves campaigns; undo puts names back", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    vi.stubGlobal("setTimeout", ((fn: () => void) => { fn(); return 0; }) as unknown as typeof setTimeout);
    const sent: { type: string; dry: boolean; details: Record<string, unknown[]> }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      if (String(u).includes("/actions/act-")) return Response.json({ status: "COMPLETED", result: { portfolios: [{ portfolioId: "PF1" }] } });
      const b = JSON.parse(String(init!.body));
      sent.push({ type: b.type, dry: !!b.dryRun, details: b.details });
      return Response.json({ actionId: b.dryRun ? null : `act-${sent.length}`, status: b.dryRun ? "VALIDATED" : "QUEUED" });
    }));
    const plan = { at: "x", total: 2, readable: 0, products: [], portfolios: ["Journal"], mixed: 0, idle: 1, items: [
      { id: "1", oldName: "a_1", newName: "SP | Journal | Exact", product: "Journal", targeting: "Exact" as const, state: "ENABLED", rename: true, portfolio: "Journal", spend: 1, sales: 2 },
      { id: "2", oldName: "b_2", newName: "SP | Journal | Auto", product: "Journal", targeting: "Auto" as const, state: "ENABLED", rename: true, portfolio: "Journal", issue: "idle" as const, spend: 0, sales: 0 },
    ] };
    const done = await applyTidy("acct", plan, { rename: true, portfolios: true, pauseIdle: true }, "k");
    expect(done.errors).toEqual([]);
    expect(done.renamed).toEqual([{ id: "1", from: "a_1", to: "SP | Journal | Exact" }, { id: "2", from: "b_2", to: "SP | Journal | Auto" }]);
    expect(done.portfolios).toEqual([{ name: "Journal", id: "PF1", campaigns: ["1", "2"] }]);
    expect(done.paused).toEqual(["2"]);
    const live = sent.filter((s) => !s.dry).map((s) => `${s.type}:${JSON.stringify(s.details).slice(0, 60)}`);
    expect(live[0]).toContain("AMAZON_ADS_CAMPAIGNS_UPDATE:{\"campaigns\":[{\"campaignId\":\"1\",\"name\"");
    expect(live.some((l) => l.startsWith("AMAZON_ADS_PORTFOLIOS_ADD"))).toBe(true);
    expect(sent.filter((s) => s.dry).length).toBe(sent.filter((s) => !s.dry).length); // every live call was dry-run first
    sent.length = 0;
    expect(await undoTidy("acct", done, "k")).toEqual([]);
    expect(JSON.stringify(sent.filter((s) => !s.dry)[0].details)).toContain("\"name\":\"a_1\"");
    expect(JSON.stringify(sent.filter((s) => !s.dry)[1].details)).toContain("\"state\":\"ENABLED\"");
  });
});
