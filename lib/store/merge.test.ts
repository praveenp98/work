import { describe, expect, it } from "vitest";
import { changedKeys, mergeOnto } from "./merge";
import { MemoryStore } from "./memory";

describe("safe workspace saves", () => {
  it("two requests changing different fields both stick (no lost payment or teammate)", async () => {
    const store = new MemoryStore();
    const ws = await store.createWorkspace("h1");
    const a = (await store.getWorkspaceById(ws.id))!; // e.g. the payment webhook
    const b = (await store.getWorkspaceById(ws.id))!; // e.g. a teammate being added at the same moment
    a.licensed = true; a.paidUntil = "2027-11-22T00:00:00Z";
    b.about = "journals";
    await store.saveWorkspace(a);
    await store.saveWorkspace(b); // b loaded before a saved: must not undo a's payment
    const w = (await store.getWorkspaceById(ws.id))!;
    expect(w.licensed).toBe(true);
    expect(w.paidUntil).toBe("2027-11-22T00:00:00Z");
    expect(w.about).toBe("journals");
  });
  it("a field cleared on purpose is removed", () => {
    expect(changedKeys({ invite: { id: "x" }, a: 1 }, { a: 1 })).toEqual(["invite"]);
    expect(mergeOnto({ invite: { id: "x" }, b: 2 }, { a: 1 }, ["invite"])).toEqual({ b: 2 });
  });
});
