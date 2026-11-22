import { describe, expect, it } from "vitest";
import { countdown, nextEvent } from "./urgency";

describe("live countdown", () => {
  it("counts to midnight US Eastern on the day", () => {
    const now = new Date("2026-11-22T05:00:00Z");
    const e = nextEvent(now)!;
    expect(e.name).toBe("Black Friday");
    expect(countdown(e.startsAt - now.getTime())).toBe("5d 00h 00m 00s");
  });
  it("on the day it says it's on; then moves to the next event", () => {
    expect(countdown(nextEvent(new Date("2026-11-27T12:00:00Z"))!.startsAt - Date.parse("2026-11-27T12:00:00Z"))).toBeNull();
    expect(nextEvent(new Date("2026-11-28T06:00:00Z"))!.name).toBe("Cyber Monday");
  });
  it("nothing close → no timer", () => {
    expect(nextEvent(new Date("2027-01-10T00:00:00Z"))).toBeNull();
  });
});
