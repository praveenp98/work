import { describe, expect, it } from "vitest";
import { slotState } from "./accounts";
import type { Workspace } from "./store/types";

const base = (o: Partial<Workspace> = {}): Workspace => ({ id: "w", createdAt: "", licensed: true, brands: {}, ...o });
const acc = (id: string) => ({ id, name: id, country: "US", connectedAt: "2026-11-01T00:00:00Z", ads: true });
const now = new Date("2026-11-22T12:00:00Z");

describe("Amazon accounts per plan", () => {
  it("3 included; the 4th needs an extra account", () => {
    expect(slotState(base({ amazon: { accounts: [acc("a"), acc("b")] } }), now).canAdd).toBe(true);
    expect(slotState(base({ amazon: { accounts: [acc("a"), acc("b"), acc("c")] } }), now)).toMatchObject({ used: 3, limit: 3, canAdd: false });
  });
  it("each paid extra account adds a slot until it lapses", () => {
    const ws = base({ amazon: { accounts: [acc("a"), acc("b"), acc("c")] }, extraAccounts: [{ subscriptionId: "s1", until: "2026-12-20T00:00:00Z" }, { subscriptionId: "s2", until: "2026-11-01T00:00:00Z" }] });
    expect(slotState(ws, now)).toMatchObject({ limit: 4, canAdd: true });
  });
  it("swap: a removed account holds its slot 30 days, unless removed within a day of connecting", () => {
    const held = base({ amazon: { accounts: [acc("a"), acc("b")] }, removedAccounts: [{ id: "c", name: "c", connectedAt: "2026-11-01T00:00:00Z", removedAt: "2026-11-20T00:00:00Z" }] });
    expect(slotState(held, now)).toMatchObject({ used: 3, canAdd: false, held: 1 });
    const quick = base({ amazon: { accounts: [acc("a"), acc("b")] }, removedAccounts: [{ id: "c", name: "c", connectedAt: "2026-11-20T00:00:00Z", removedAt: "2026-11-20T05:00:00Z" }] });
    expect(slotState(quick, now).canAdd).toBe(true);
    const old = base({ amazon: { accounts: [acc("a"), acc("b")] }, removedAccounts: [{ id: "c", name: "c", connectedAt: "2026-09-01T00:00:00Z", removedAt: "2026-10-01T00:00:00Z" }] });
    expect(slotState(old, now).canAdd).toBe(true);
  });
});
