import { describe, expect, it } from "vitest";
import { changeLine, cleanValue, guardNumbers, historyText, kindOf, parseHistory, summarizeHistory } from "./history";

const now = new Date("2026-11-22T00:00:00Z");
const row = (o: Record<string, string>) => ({ ad_entity_id: "1", ad_entity_type: "CAMPAIGN", ad_change_type: "BID_AMOUNT", ad_change_at_utc: "2026-10-01T00:00:00Z", ad_campaign_id: "", ad_group_id: "", ad_new_value: "null", ad_previous_value: "null", ad_change_metadata: "", ...o });

describe("before-Rocco history", () => {
  it("classifies change types", () => {
    expect(kindOf("RULE_BASED_BUDGET_VALUE")).toBe("budget");
    expect(kindOf("BID_AMOUNT")).toBe("bid");
    expect(kindOf("STATUS")).toBe("state");
    expect(kindOf("CREATED")).toBe("created");
    expect(kindOf("WHATEVER")).toBe("other");
  });
  it("cleans values", () => {
    expect(cleanValue("3300.0")).toBe("3300");
    expect(cleanValue("null")).toBeUndefined();
    expect(cleanValue("0.75")).toBe("0.75");
  });
  it("parses real rows: campaign id from the entity, names, rule flag, newest first", () => {
    const ch = parseHistory([
      row({ ad_change_type: "RULE_BASED_BUDGET_VALUE", ad_entity_id: "9", ad_previous_value: "3300.0", ad_change_at_utc: "2026-09-02T07:04:57Z" }),
      row({ ad_change_type: "BID_AMOUNT", ad_entity_type: "KEYWORD", ad_campaign_id: "9", ad_previous_value: "1.2", ad_new_value: "0.9", ad_change_at_utc: "2026-10-21T00:00:00Z" }),
    ], new Map([["9", "Bamboo SP Exact"]]));
    expect(ch[0].kind).toBe("bid");
    expect(changeLine(ch[0])).toBe("Bid on “Bamboo SP Exact”: 1.2 → 0.9");
    expect(ch[1].byRule).toBe(true);
    expect(changeLine(ch[1])).toBe("Budget rule on “Bamboo SP Exact” ended (budget was 3300)");
  });
  it("summarizes: by rule, by hand, no bids, busiest", () => {
    const ch = parseHistory(Array.from({ length: 4 }, (_, i) => row({ ad_change_type: "RULE_BASED_BUDGET_VALUE", ad_entity_id: "9", ad_new_value: "3300.0", ad_change_at_utc: `2026-10-0${i + 1}T00:00:00Z` })), new Map([["9", "Main"]]));
    const s = summarizeHistory(ch, now);
    expect(s.total).toBe(4);
    expect(s.byRule).toBe(4);
    expect(s.notes.join(" ")).toMatch(/made by Amazon budget rules/);
    expect(s.notes.join(" ")).toMatch(/No change was made by hand/);
    expect(s.notes.join(" ")).toMatch(/No bid was changed/);
    expect(s.notes.join(" ")).toMatch(/Most edited: “Main” \(4 changes\)/);
    expect(historyText({ at: now.toISOString(), summary: s, changes: ch })).toMatch(/Before Rocco/);
  });
  it("empty history says so", () => {
    expect(summarizeHistory([], now).notes[0]).toMatch(/empty/);
  });
  it("drops AI sentences with made-up numbers", () => {
    expect(guardNumbers("Budgets ran on rules 4 times. You'll save 30% fast.", "4 changes")).toBe("Budgets ran on rules 4 times.");
  });
});
