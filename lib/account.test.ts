import { describe, expect, it } from "vitest";
import { closeBlocker, closeWorkspace } from "./account";
import type { Workspace } from "./store/types";

const ws = (o: Partial<Workspace> = {}) => ({ id: "w1", licensed: true, ownerEmail: "o@x.com", ownerVerified: true, members: [{ email: "m@x.com" }], amazon: { accounts: [{ id: "a1", name: "Habit Nest US", country: "US", connectedAt: "2026-11-01T00:00:00Z" }] }, reminders: { cadence: "daily", approveByText: true, setAt: "x" }, brands: {}, ...o }) as unknown as Workspace;

describe("delete my Rocco", () => {
  it("is blocked while a plan is active, allowed once cancelled", () => {
    expect(closeBlocker(ws({ subscriptionId: "s1", subStatus: "active" }))).toMatch(/Cancel it first/);
    expect(closeBlocker(ws({ subscriptionId: "s1", subStatus: "cancelled" }))).toBeNull();
    expect(closeBlocker(ws())).toBeNull();
  });
  it("unlinks people, releases accounts for DataDoe deletion, stops reminders and access", () => {
    const w = closeWorkspace(ws(), "o@x.com", new Date("2026-11-25T10:00:00Z"));
    expect(w.ownerEmail).toMatch(/^deleted-/);
    expect(w.ownerVerified).toBe(false);
    expect(w.members).toEqual([]);
    expect(w.amazon?.accounts).toEqual([]);
    expect(w.removedAccounts?.[0]).toMatchObject({ id: "a1", by: "o@x.com" });
    expect(w.reminders?.cadence).toBe("off");
    expect(w.licensed).toBe(false);
    expect(w.deletedAt).toBe("2026-11-25T10:00:00.000Z");
  });
});
