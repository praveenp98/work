import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as callback } from "../app/api/auth/google/callback/route";
import { GET as start } from "../app/api/auth/google/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { teamForUser } from "./signin";
import { seal } from "./vault";
import { createWorkspace, loadWorkspace, rememberToken } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Google sign-in → the right team", () => {
  it("claims this browser's ownerless team, finds it again on any device, never takes someone else's", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    const c = await createWorkspace(store);
    const a = await teamForUser(store, "Sam@Brand.com", c.token);
    expect(a.token).toBe(c.token);
    expect((await loadWorkspace(store, c.token))!.ownerEmail).toBe("sam@brand.com");

    const again = await teamForUser(store, "sam@brand.com", null); // new laptop, no cookie
    expect(again.token).toBe(c.token);

    const other = await teamForUser(store, "eve@x.com", c.token); // Sam's team in Eve's browser
    expect(other.token).not.toBe(c.token);
    expect(other.created).toBe(true);
    expect((await loadWorkspace(store, c.token))!.ownerEmail).toBe("sam@brand.com");
  });

  it("prefers the team that's paid", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    const paid = await createWorkspace(store);
    paid.ws.ownerEmail = "sam@brand.com"; paid.ws.ownerVerified = true; paid.ws.licensed = true; paid.ws.paidUntil = new Date(Date.now() + 86_400_000 * 300).toISOString();
    await store.saveWorkspace(paid.ws); await rememberToken(store, paid.ws, paid.token);
    const unpaid = await createWorkspace(store);
    unpaid.ws.ownerEmail = "sam@brand.com"; unpaid.ws.ownerVerified = true; await store.saveWorkspace(unpaid.ws); await rememberToken(store, unpaid.ws, unpaid.token);
    expect((await teamForUser(store, "sam@brand.com")).token).toBe(paid.token);
  });

  it("never opens a team someone planted with your email (typed, not verified by Google)", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    const planted = await createWorkspace(store);
    planted.ws.ownerEmail = "victim@brand.com"; // typed on the Hire sheet by an attacker who keeps the link
    await store.saveWorkspace(planted.ws); await rememberToken(store, planted.ws, planted.token);
    const r = await teamForUser(store, "victim@brand.com");
    expect(r.token).not.toBe(planted.token);
    expect(r.created).toBe(true);
  });
});

describe("Google routes", () => {
  function google(email: string, verified = true) {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (String(u).includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "at" });
      if (String(u).includes("userinfo")) return Response.json({ sub: "g-1", email, email_verified: verified, name: "Sam" });
      return Response.json({}, { status: 404 });
    }));
  }
  const env = () => { vi.stubEnv("ROCCO_VAULT_KEY", "test-vault"); vi.stubEnv("GOOGLE_CLIENT_ID", "cid"); vi.stubEnv("GOOGLE_CLIENT_SECRET", "sec"); vi.stubEnv("DODO_PRODUCT_ID", "pdt_x"); };

  it("is off without keys", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    const r = await start(new Request("https://rocco.works/api/auth/google?intent=hire"));
    expect(r.headers.get("location")).toMatch(/\/pricing\?signin=off$/);
  });

  it("hire: Google → team created → checkout (pay at signup), tagged with the team; cookies set", async () => {
    env();
    const store = new MemoryStore(); setStoreForTests(store);
    const s = await start(new Request("https://rocco.works/api/auth/google?intent=hire"));
    const loc = new URL(s.headers.get("location")!);
    expect(loc.host).toBe("accounts.google.com");
    expect(loc.searchParams.get("scope")).toBe("openid email profile");
    const nonce = s.headers.get("set-cookie")!.match(/rocco_gstate=([^;]+)/)![1];
    google("sam@brand.com");
    const r = await callback(new Request(`https://rocco.works/api/auth/google/callback?code=c&state=${encodeURIComponent(loc.searchParams.get("state")!)}`, { headers: { cookie: `rocco_gstate=${nonce}` } }));
    expect(r.headers.get("location")).toMatch(/^https:\/\/checkout\.dodopayments\.com\/buy\/pdt_\w+\?.*metadata_ref=/);
    const cookies = r.headers.get("set-cookie")!;
    expect(cookies).toMatch(/rocco_user=/); expect(cookies).toMatch(/rocco_team=/); expect(cookies).toMatch(/rocco_in=1/);
    expect((await store.findWorkspacesByOwner("sam@brand.com")).length).toBe(1);
  });

  it("rejects a forged or replayed state and unverified emails", async () => {
    env();
    setStoreForTests(new MemoryStore());
    const st = seal(JSON.stringify({ i: "hire", n: "abc", x: Date.now() + 60_000 }))!;
    google("sam@brand.com");
    const noCookie = await callback(new Request(`https://rocco.works/api/auth/google/callback?code=c&state=${encodeURIComponent(st)}`));
    expect(noCookie.headers.get("location")).toMatch(/signin=expired/);
    google("sam@brand.com", false);
    const unverified = await callback(new Request(`https://rocco.works/api/auth/google/callback?code=c&state=${encodeURIComponent(st)}`, { headers: { cookie: "rocco_gstate=abc" } }));
    expect(unverified.headers.get("location")).toMatch(/signin=failed/);
  });
});
