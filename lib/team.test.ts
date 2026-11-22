import { describe, expect, it, vi } from "vitest";
import { MemoryStore } from "./store/memory";
import { teamForUser } from "./signin";
import { addMember, displayName, peopleOf, removeMember, resetLink, roleOf, transferOwner } from "./team";
import { createWorkspace, loadWorkspace, rememberToken, revealToken } from "./workspace";

async function owned() {
  vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
  const store = new MemoryStore();
  const c = await createWorkspace(store);
  c.ws.ownerEmail = "owner@brand.com"; c.ws.ownerVerified = true; c.ws.ownerName = "Olivia Stone";
  await store.saveWorkspace(c.ws); await rememberToken(store, c.ws, c.token);
  return { store, ws: (await store.getWorkspaceById(c.ws.id))!, token: c.token };
}

describe("teams", () => {
  it("owner adds a teammate; they sign in with Google and land on the same Rocco, named", async () => {
    const { store, ws, token } = await owned();
    expect(addMember(ws, "owner@brand.com", "Sam@Brand.com ")).toBeNull();
    await store.saveWorkspace(ws);
    const r = await teamForUser(store, "sam@brand.com", null, "Sam Lee");
    expect(r.token).toBe(token);
    expect(r.created).toBe(false);
    const w = (await store.getWorkspaceById(ws.id))!;
    expect(roleOf(w, "sam@brand.com")).toBe("member");
    expect(peopleOf(w).find((p) => p.email === "sam@brand.com")).toMatchObject({ joined: true, name: "Sam Lee" });
    expect(displayName(w, "sam@brand.com")).toBe("Sam");
    expect(w.ownerEmail).toBe("owner@brand.com"); // signing in as a member never takes ownership
  });

  it("only the owner manages people; members can leave; owner can't leave", async () => {
    const { ws } = await owned();
    addMember(ws, "owner@brand.com", "sam@brand.com");
    expect(addMember(ws, "sam@brand.com", "eve@x.com")).toBe("not_owner");
    expect(addMember(ws, "owner@brand.com", "sam@brand.com")).toBe("already");
    expect(addMember(ws, "owner@brand.com", "nope")).toBe("bad_email");
    expect(removeMember(ws, "sam@brand.com", "owner@brand.com")).toBe("not_owner");
    expect(removeMember(ws, "owner@brand.com", "owner@brand.com")).toBe("owner_cant_leave");
    expect(removeMember(ws, "sam@brand.com", "sam@brand.com")).toBeNull();
    expect(roleOf(ws, "sam@brand.com")).toBeNull();
  });

  it("hand over: only to someone who signed in once; old owner stays as a member", async () => {
    const { store, ws } = await owned();
    addMember(ws, "owner@brand.com", "sam@brand.com");
    expect(transferOwner(ws, "owner@brand.com", "sam@brand.com")).toBe("not_joined");
    await store.saveWorkspace(ws);
    await teamForUser(store, "sam@brand.com", null, "Sam Lee");
    const w = (await store.getWorkspaceById(ws.id))!;
    expect(transferOwner(w, "owner@brand.com", "sam@brand.com")).toBeNull();
    expect(roleOf(w, "sam@brand.com")).toBe("owner");
    expect(roleOf(w, "owner@brand.com")).toBe("member");
  });

  it("an email that was never invited can't get in", async () => {
    const { store, token } = await owned();
    const r = await teamForUser(store, "stranger@x.com");
    expect(r.token).not.toBe(token);
    expect(r.created).toBe(true);
  });

  it("reset link: the old link stops working, sign-in still finds the team", async () => {
    const { store, ws, token } = await owned();
    const fresh = await resetLink(store, ws);
    expect(await loadWorkspace(store, token)).toBeNull();
    expect((await loadWorkspace(store, fresh))?.id).toBe(ws.id);
    expect(revealToken((await store.getWorkspaceById(ws.id))!)).toBe(fresh);
    expect((await teamForUser(store, "owner@brand.com")).token).toBe(fresh);
  });
});
