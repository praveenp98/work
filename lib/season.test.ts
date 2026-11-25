import { describe, expect, it } from "vitest";
import { blackFriday, cyberMonday, easter, eventsFor, marketOf, momentsOn, phaseOn, seasonLine, upcoming, when } from "./season";

const at = (d: string) => new Date(`${d}T15:00:00Z`);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe("seller calendar", () => {
  it("computes the moving dates", () => {
    expect(ymd(blackFriday(2026))).toBe("2026-11-27");
    expect(ymd(cyberMonday(2026))).toBe("2026-11-30");
    expect(ymd(blackFriday(2027))).toBe("2027-11-26");
    expect(ymd(easter(2026))).toBe("2026-04-05");
    expect(ymd(easter(2027))).toBe("2027-03-28");
    const y27 = eventsFor(2027);
    expect(y27.find((e) => e.name === "Mother's Day")!.start).toBe("2027-05-09");
    expect(y27.find((e) => e.name === "Mother's Day (UK)")!.start).toBe("2027-03-07");
    expect(y27.find((e) => e.name === "Father's Day")!.start).toBe("2027-06-20");
  });

  it("two days before Black Friday 2026, US sellers are ramping up", () => {
    const m = momentsOn("US", at("2026-11-25"))[0];
    expect(m.event.name).toBe("Black Friday & Cyber Monday");
    expect(m.phase.key).toBe("ramp");
    expect(when(m)).toBe("in 2 days");
    expect(m.actions.map((a) => a.id)).toContain("budgets");
  });

  it("Black Friday through Cyber Monday is live; Dec 2 is cool-down", () => {
    expect(momentsOn("UK", at("2026-11-28"))[0].phase.key).toBe("live");
    expect(when(momentsOn("UK", at("2026-11-28"))[0])).toBe("on now · ends in 2 days");
    const after = momentsOn("US", at("2026-12-02")).find((m) => m.event.name.startsWith("Black Friday"))!;
    expect(after.phase.key).toBe("after");
  });

  it("Christmas prep shows in early December alongside Q4 storage", () => {
    const ms = momentsOn("US", at("2026-12-05")).map((m) => `${m.event.name}:${m.phase.key}`);
    expect(ms).toContain("Christmas:prepare");
    expect(momentsOn("US", at("2026-12-12")).map((m) => `${m.event.name}:${m.phase.key}`)).toContain("Christmas:ramp");
    expect(ms).toContain("Q4 storage rates:on");
  });

  it("each marketplace gets its own calendar", () => {
    expect(upcoming("IN", at("2027-08-01")).some((e) => e.name === "Great Indian Festival")).toBe(true);
    expect(upcoming("IN", at("2026-11-25")).some((e) => e.name.startsWith("Black Friday"))).toBe(false);
    expect(upcoming("AE", at("2027-01-05")).some((e) => e.name === "Ramadan")).toBe(true);
    expect(marketOf("GB")).toBe("UK");
    expect(marketOf("FR")).toBe("DE");
    expect(marketOf(undefined)).toBe("US");
  });

  it("phases cover the right days", () => {
    const bf = eventsFor(2026).find((e) => e.id.startsWith("bfcm"))!;
    expect(phaseOn(bf, "2026-10-22")).toBeNull();
    expect(phaseOn(bf, "2026-10-23")?.key).toBe("prepare");
    expect(phaseOn(bf, "2026-11-13")?.key).toBe("ramp");
    expect(phaseOn(bf, "2026-11-30")?.key).toBe("live");
    expect(phaseOn(bf, "2026-12-07")?.key).toBe("after");
    expect(phaseOn(bf, "2026-12-09")).toBeNull();
  });

  it("the January reset counts down instead of saying it ended", () => {
    const m = momentsOn("UK", at("2027-01-08")).find((x) => x.event.name === "New Year reset")!;
    expect(when(m)).toBe("on now · 14 days left");
  });

  it("brief line names the event and the first action", () => {
    expect(seasonLine("US", at("2026-11-25"))).toMatch(/^Black Friday & Cyber Monday in 2 days \(ramp up\): Block the searches/);
  });
});
