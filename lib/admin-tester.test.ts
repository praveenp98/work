import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as tester } from "../app/api/admin/tester/route";
import { accessOf } from "./access";
import { teamForUser } from "./signin";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";

afterEach(() => vi.unstubAllEnvs());

describe("founder test access (no payment, never counted as a hire)", () => {
  it("needs the key; fresh=1 archives old teams and starts a new one with access; sign-in lands on it", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("ROCCO_VAULT_KEY", "v");
    const store = new MemoryStore(); setStoreForTests(store);
    const old = await teamForUser(store, "me@x.com");
    const call = (q: string) => tester(new Request(`https://rocco.works/api/admin/tester?${q}`));
    expect((await call("key=nope&email=me@x.com")).status).toBe(401);
    const r = await (await call("key=s3cret&email=me@x.com&fresh=1")).json();
    expect(r).toMatchObject({ ok: true, mode: "fresh", archived: 1 });
    const now = await teamForUser(store, "me@x.com");
    expect(now.ws.id).not.toBe(old.ws.id);
    expect(accessOf(now.ws)).toBe("paid");
    expect(now.ws.comp).toMatch(/founder test/);
    expect((await store.getWorkspaceById(old.ws.id))!.ownerEmail).toMatch(/^archived-/);
  });
});
