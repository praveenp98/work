import { describe, expect, it } from "vitest";
import { buildOffice } from "./office";

const now = new Date("2026-11-24T14:00:00Z");
const fmt = (n: number) => `$${n}`;

describe("Rocco's office timeline", () => {
  it("builds only from real events, in order, and stands at the bell when jobs wait", () => {
    const o = buildOffice({
      now,
      syncs: [{ at: "2026-11-24T13:01:00Z", kinds: ["sp_search_term", "inventory"], errors: [] }],
      snaps: [{ createdAt: "2026-11-24T13:02:00Z", kind: "sp_search_term", headline: "4,812 searches · 3 wasted." }],
      open: { count: 7, valueMonthly: 1240, fmt },
      actions: [{ code: "N1", appliedAt: "2026-11-24T13:30:00Z", followUpAt: "2026-12-01T13:30:00Z", status: "applied", target: "free yoga mat" }],
    });
    expect(o.events.map((e) => e.station)).toEqual(["dock", "desk", "board", "dock"]);
    expect(o.events[0].text).toBe("Pulled ad search terms, FBA stock from Amazon");
    expect(o.events[2].text).toBe("Pinned 7 jobs to your board, worth ~$1240/mo");
    expect(o.events[3].text).toMatch(/Made N1 \(“free yoga mat”\) in Amazon ✓/);
    expect(o.state).toMatchObject({ station: "bell", text: "7 jobs waiting for your OK" });
  });

  it("nothing waiting and nothing just now → resting, with the changes it's watching", () => {
    const o = buildOffice({ now, syncs: [], snaps: [], open: { count: 0, valueMonthly: 0, fmt }, actions: [{ code: "N1", appliedAt: "2026-11-20T10:00:00Z", followUpAt: "2026-11-27T10:00:00Z", status: "applied" }], nextRunAt: "2026-11-25T13:00:00Z" });
    expect(o.events).toEqual([]); // older than 3 days: not replayed
    expect(o.state).toMatchObject({ station: "bed", text: "All caught up · watching 1 change", nextRunAt: "2026-11-25T13:00:00Z" });
  });

  it("results land in the lab", () => {
    const o = buildOffice({ now, syncs: [], snaps: [], open: { count: 0, valueMonthly: 0, fmt }, actions: [{ code: "G2", appliedAt: "2026-11-10T10:00:00Z", followUpAt: "2026-11-17T10:00:00Z", status: "worked", result: { checkedAt: "2026-11-24T13:05:00Z", summary: "Worked: $212/mo less wasted." } }] });
    expect(o.events).toEqual([{ at: "2026-11-24T13:05:00Z", station: "lab", text: "Checked G2: Worked: $212/mo less wasted." }]);
  });
});
