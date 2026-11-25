import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as callback } from "../app/api/datadoe/callback/route";
import { POST as connect } from "../app/api/w/amazon/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { grantTrial } from "./test-utils";
import { createWorkspace } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const ACCOUNT = {
  id: "d7896284-b29d-42b0-ad5f-f5d31132cb31", name: "Habit Nest US", accountType: "SELLER", marketplaceCountryCode: "US", rowCount: 0,
  sellerCentralConnection: { id: "sc", name: "SC", initialLoadComplete: false, initialLoadStage: "FIRST_STAGE", needsReauthorization: false },
  amazonAdsConnection: { id: "ads", name: "Ads", initialLoadComplete: false, initialLoadStage: "FIRST_STAGE", needsReauthorization: false },
};

let usedBy: string | null = null; // what DataDoe says the invite connected (null = not used yet)
function doe() {
  usedBy = null;
  const calls: { url: string; body?: unknown; key?: string | null }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
    calls.push({ url: String(u), body: init?.body ? JSON.parse(String(init.body)) : undefined, key: new Headers(init?.headers).get("datadoe-api-key") });
    if (String(u).includes("/invitations/")) return Response.json({ id: "inv-1", status: usedBy ? "COMPLETED" : "PENDING", sellerOrVendorId: usedBy });
    if (String(u).endsWith("/util/sellers-and-vendors/invite")) return Response.json({ id: "inv-1", invitationUrl: "https://app.datadoe.com/invitation/abc", expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() }, { status: 201 });
    if (String(u).includes(`/util/sellers-and-vendors/${ACCOUNT.id}`)) return Response.json(ACCOUNT);
    return Response.json({ message: "nope" }, { status: 404 });
  }));
  return calls;
}

describe("Connect Amazon through DataDoe", () => {
  it("creates a read-only invite for the team (reused while valid), then links the account on return", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const calls = doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id); // connecting needs an active plan (pay at signup)
    const post = () => connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }));
    expect(await (await post()).json()).toMatchObject({ ok: true, url: "https://app.datadoe.com/invitation/abc" });
    await post();
    const invites = calls.filter((c) => c.url.endsWith("/invite"));
    expect(invites).toHaveLength(1);
    expect(invites[0].key).toBe("k");
    expect(invites[0].body).toMatchObject({ tenantType: "SELLER", accessLevel: "READ_AND_WRITE", redirectUrl: `https://rocco.works/api/datadoe/callback?ref=${ws.id}` });

    usedBy = ACCOUNT.id;
    const back = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=true&error=&sellerOrVendorId=${ACCOUNT.id}&sellerOrVendorName=Habit+Nest+US&sellerOrVendorMarketplaceCountryCode=US&invitationId=inv-1&invitationType=CONNECT`));
    expect(back.headers.get("location")).toBe("https://rocco.works/me?amazon=connected");
    const w = (await store.getWorkspaceById(ws.id))!;
    expect(w.amazon?.accounts).toMatchObject([{ id: ACCOUNT.id, name: "Habit Nest US", country: "US", ads: true }]);
    expect(w.amazon?.invite).toBeUndefined();
  });

  it("unpaid teams can't open a connection (it costs money)", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const calls = doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const { token } = await createWorkspace(store);
    expect((await connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }))).status).toBe(402);
    expect(calls).toHaveLength(0);
  });

  it("ignores returns for invites it didn't create, and failed connects", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id); // connecting needs an active plan (pay at signup)
    await connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }));
    const forged = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=true&sellerOrVendorId=${ACCOUNT.id}&invitationId=someone-elses`));
    expect(forged.headers.get("location")).toMatch(/amazon=unknown/);
    const failed = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=false&error=SC_ACCOUNT_LACKING_PERMISSIONS&invitationId=inv-1`));
    expect(failed.headers.get("location")).toMatch(/amazon=SC_ACCOUNT_LACKING_PERMISSIONS/);
    expect((await store.getWorkspaceById(ws.id))!.amazon?.accounts).toHaveLength(0);
  });

  it("refuses a swapped account id: DataDoe says which account the invite really connected", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id);
    await connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }));
    const victim = "11111111-2222-3333-4444-555555555555";
    usedBy = ACCOUNT.id; // DataDoe: this invite connected ACCOUNT, not the victim
    const swapped = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=true&sellerOrVendorId=${victim}&invitationId=inv-1`));
    expect(swapped.headers.get("location")).toMatch(/amazon=mismatch/);
    expect((await store.getWorkspaceById(ws.id))!.amazon?.accounts).toHaveLength(0);
  });

  it("refuses an account that already belongs to another Rocco team", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const owner = await createWorkspace(store);
    owner.ws.amazon = { accounts: [{ id: ACCOUNT.id, name: "Habit Nest US", country: "US", connectedAt: new Date().toISOString(), ads: true }] };
    await store.saveWorkspace(owner.ws);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id);
    await connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }));
    usedBy = ACCOUNT.id;
    const r = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=true&sellerOrVendorId=${ACCOUNT.id}&invitationId=inv-1`));
    expect(r.headers.get("location")).toMatch(/amazon=taken/);
  });

  it("a failed connect forgets the used link, so the next tap gets a fresh one", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const calls = doe();
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await grantTrial(store, ws.id);
    const post = () => connect(new Request("https://rocco.works/api/w/amazon", { method: "POST", body: JSON.stringify({ t: token }) }));
    await post();
    await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&success=false&error=SELLER_ALREADY_CONNECTED&invitationId=inv-1`));
    expect((await store.getWorkspaceById(ws.id))!.amazon?.invite).toBeUndefined();
    await post();
    expect(calls.filter((c) => c.url.endsWith("/invite"))).toHaveLength(2);
  });
});

import { idemKey } from "./datadoe";
describe("idempotency keys", () => {
  it("only sends characters DataDoe accepts, stays unique and stable", () => {
    expect(idemKey("rocco:w1:list:SKU-1:keywords")).toBe("rocco:w1:list:SKU-1:keywords");
    const a = idemKey("rocco:w1:list:Gym Buddy Journal-Grey:keywords"), b = idemKey("rocco:w1:list:Gym+Buddy Journal-Grey:keywords");
    expect(a).toMatch(/^[A-Za-z0-9:_.-]+$/);
    expect(a).not.toBe(b);
    expect(idemKey("rocco:w1:list:Gym Buddy Journal-Grey:keywords")).toBe(a);
    expect(idemKey("x ".repeat(200)).length).toBeLessThanOrEqual(120);
  });
});
