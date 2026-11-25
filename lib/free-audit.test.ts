import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as approve } from "../app/api/w/approve/route";
import { POST as applied } from "../app/api/w/applied/route";
import { POST as createCampaign } from "../app/api/w/create-campaign/route";
import { POST as restock } from "../app/api/w/restock/route";
import { POST as undo } from "../app/api/w/undo/route";
import { POST as strategy } from "../app/api/w/strategy/route";
import { POST as ask } from "../app/api/w/ask/route";
import { POST as sync } from "../app/api/w/amazon/sync/route";
import { POST as connect } from "../app/api/w/amazon/route";
import { GET as callback } from "../app/api/datadoe/callback/route";
import { GET as cronAmazon } from "../app/api/cron/amazon/route";
import { POST as startRoute } from "../app/api/w/audit/route";
import { accessOf, AUDIT_DAYS, canSeeJobs, hasAccess, isAudit } from "./access";
import { auditConnectOk, auditOf, auditPullOk, AUDIT_MAX_PULLS, canStartAudit, noteAuditPull, scheduledPullOk, startAudit } from "./free-audit";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import type { Workspace } from "./store/types";
import { loadFixture } from "./test-utils";
import { applyChanges, buildBrief, createWorkspace, FREE_PROPOSALS, runAnalysis } from "./workspace";

// DataDoe is never reached from tests: the pull, the account lookup and the history read are mocked.
const pulls: string[] = [];
vi.mock("./datadoe-sync", async (orig) => ({
  ...(await orig<typeof import("./datadoe-sync")>()),
  syncGroup: vi.fn(async (store: import("./store/types").Store, jobs: { wsId: string; id: string; name: string }[]) => {
    const m = new Map();
    for (const j of jobs) {
      pulls.push(j.id);
      const ws = (await store.getWorkspaceById(j.wsId))!;
      const r = { account: j.name, kinds: OK.value ? ["sp_search_term"] : [], errors: OK.value ? [] : ["sp_search_term: no rows yet (history 40% loaded)"] };
      ws.amazon = { ...ws.amazon!, lastSync: { at: new Date().toISOString(), kinds: r.kinds, errors: r.errors } };
      await store.saveWorkspace(ws);
      m.set(j.id, r);
    }
    return m;
  }),
  pullAndSave: vi.fn(async (store: import("./store/types").Store, wsId: string, a: { id: string; name: string }) => {
    pulls.push(a.id);
    const ws = (await store.getWorkspaceById(wsId))!;
    ws.amazon = { ...ws.amazon!, lastSync: { at: new Date().toISOString(), kinds: OK.value ? ["sp_search_term"] : [], errors: OK.value ? [] : ["sp_search_term: failed"] } };
    await store.saveWorkspace(ws);
    return { account: a.name, kinds: ws.amazon.lastSync!.kinds, errors: ws.amazon.lastSync!.errors };
  }),
}));
const OK = { value: true };
const history = vi.fn(async () => null);
vi.mock("./history", async (orig) => ({ ...(await orig<typeof import("./history")>()), importHistory: (...a: unknown[]) => history(...(a as [])) }));
vi.mock("./datadoe", async (orig) => ({
  ...(await orig<typeof import("./datadoe")>()),
  getAccount: vi.fn(async (id: string) => ({ id, name: "Habit Nest", marketplaceCountryCode: "US", amazonAdsConnection: { id: "x" } })),
  getInvitation: vi.fn(async () => ({ status: "ACCEPTED", sellerOrVendorId: ACC })),
  createInvite: vi.fn(async () => ({ id: "inv-1", invitationUrl: "https://datadoe.example/i/1", expiresAt: new Date(Date.now() + 86_400_000).toISOString() })),
}));
const pending: Promise<unknown>[] = [];
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => Promise<void>) => { pending.push(fn()); } }));

const ACC = "11111111-2222-3333-4444-555555555555";
const DAY = 86_400_000;
const T0 = new Date("2026-11-25T12:00:00Z");
const base = (o: Partial<Workspace> = {}): Workspace => ({ id: "ws-audit-1", createdAt: T0.toISOString(), licensed: false, brands: {}, ...o });
const req = (path: string, body: object, headers: Record<string, string> = {}) => new Request(`https://rocco.works${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

beforeEach(() => { pulls.length = 0; pending.length = 0; OK.value = true; history.mockClear(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("access levels: paid vs trial vs audit vs none", () => {
  it("audit is its own level and is never access", () => {
    const ws = base({ audit: { startedAt: T0.toISOString(), pulls: 0 } });
    expect(accessOf(ws, T0)).toBe("audit");
    expect(hasAccess(ws, T0)).toBe(false);
    expect(isAudit(ws, T0)).toBe(true);
    expect(canSeeJobs(ws, T0)).toBe(true);
    expect(accessOf(base(), T0)).toBe("none");
    expect(canSeeJobs(base(), T0)).toBe(false);
  });
  it("paid beats audit; a lapsed or refunded payer is 'none', never a free audit", () => {
    const paid = base({ licensed: true, paidUntil: new Date(T0.getTime() + 30 * DAY).toISOString(), hiredAt: T0.toISOString(), audit: { startedAt: T0.toISOString(), pulls: 1 } });
    expect(accessOf(paid, T0)).toBe("paid");
    expect(auditOf(paid, T0)).toBeNull();
    const lapsed = { ...paid, paidUntil: new Date(T0.getTime() - DAY).toISOString() };
    expect(accessOf(lapsed, T0)).toBe("none");
    expect(canStartAudit(lapsed, T0)).toBe(false);
  });
  it("starts once, only for teams that never paid", () => {
    const ws = base();
    expect(startAudit(ws, T0)).toBe(true);
    const first = ws.audit!.startedAt;
    expect(startAudit(ws, new Date(T0.getTime() + DAY))).toBe(true); // already on it: unchanged
    expect(ws.audit!.startedAt).toBe(first);
    expect(canStartAudit(ws, T0)).toBe(false);
    expect(startAudit(base({ licensed: true }), T0)).toBe(false);
    expect(startAudit(base({ trialEndsAt: new Date(T0.getTime() + DAY).toISOString() }), T0)).toBe(false);
  });
  it(`expires after ${AUDIT_DAYS} days: the read-only view stays, pulls and new connections stop`, () => {
    const ws = base({ audit: { startedAt: T0.toISOString(), pulls: 0 }, amazon: { accounts: [] } });
    expect(auditOf(ws, new Date(T0.getTime() + 13 * DAY))).toMatchObject({ active: true, daysLeft: 1 });
    const later = new Date(T0.getTime() + AUDIT_DAYS * DAY + 1);
    expect(auditOf(ws, later)).toMatchObject({ active: false, daysLeft: 0 });
    expect(accessOf(ws, later)).toBe("audit");
    expect(canSeeJobs(ws, later)).toBe(true);
    expect(auditPullOk(ws, later)).toMatchObject({ ok: false });
    expect(auditConnectOk(ws, later)).toMatchObject({ ok: false });
  });
});

describe("audit pulls: one, a retry only after a failure, never scheduled", () => {
  const connected = (o: Partial<Workspace> = {}) => base({ audit: { startedAt: T0.toISOString(), pulls: 0 }, amazon: { accounts: [{ id: ACC, name: "Habit Nest", country: "US", connectedAt: T0.toISOString() }] }, ...o });
  it("first pull yes; after a good pull no; after a failed pull yes, up to the cap", () => {
    const ws = connected();
    expect(auditPullOk(ws, T0).ok).toBe(true);
    noteAuditPull(ws, T0);
    expect(auditPullOk(ws, new Date(T0.getTime() + 1000))).toMatchObject({ ok: false, running: true }); // still running
    ws.amazon!.lastSync = { at: new Date(T0.getTime() + 60_000).toISOString(), kinds: ["sp_search_term"], errors: [] };
    expect(auditPullOk(ws, new Date(T0.getTime() + 120_000))).toMatchObject({ ok: false });
    ws.amazon!.lastSync = { at: new Date(T0.getTime() + 60_000).toISOString(), kinds: [], errors: ["sp_search_term: failed"] };
    expect(auditPullOk(ws, new Date(T0.getTime() + 120_000)).ok).toBe(true);
    ws.audit!.pulls = AUDIT_MAX_PULLS;
    expect(auditPullOk(ws, new Date(T0.getTime() + 120_000))).toMatchObject({ ok: false });
  });
  it("one Amazon account per audit; reconnecting it is fine", () => {
    const ws = connected();
    expect(auditConnectOk(ws, T0)).toMatchObject({ ok: false });
    expect(auditConnectOk(ws, T0, true).ok).toBe(true);
  });
  it("scheduled pulls skip audit teams (dispatcher sends paid teams only)", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const store = new MemoryStore(); setStoreForTests(store);
    const a = await createWorkspace(store), p = await createWorkspace(store);
    const acc = (id: string) => ({ accounts: [{ id, name: "A", country: "US", connectedAt: T0.toISOString() }] });
    Object.assign(a.ws, { audit: { startedAt: new Date().toISOString(), pulls: 1 }, amazon: acc("aaaa") }); await store.saveWorkspace(a.ws);
    Object.assign(p.ws, { licensed: true, hiredAt: new Date().toISOString(), amazon: acc("pppp") }); await store.saveWorkspace(p.ws);
    expect(scheduledPullOk(a.ws)).toBe(false);
    expect(scheduledPullOk(p.ws)).toBe(true);
    const bodies: { jobs: { id: string }[] }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init?: RequestInit) => { bodies.push(JSON.parse(String(init?.body))); return new Response("{}", { status: 202 }); }));
    const r = await (await cronAmazon(new Request("https://rocco.works/api/cron/amazon"))).json();
    expect(r.accounts).toBe(1);
    expect(bodies.flatMap((b) => b.jobs.map((j) => j.id))).toEqual(["pppp"]);
  });
});

describe("free audit end to end: start, connect, one pull, read-only", () => {
  it("connect + first pull work for an audit team; Check now can't pull again after a good pull; no history read", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    // Not on an audit yet: connecting is refused like before.
    expect((await connect(req("/api/w/amazon", { t: token }))).status).toBe(402);
    // Start from the dashboard button (real tap from rocco.works).
    const started = await startRoute(req("/api/w/audit", { t: token }, { "x-rocco-tap": "1", origin: "https://rocco.works", "user-agent": "Mozilla/5.0 (Macintosh) Safari/605", "accept-language": "en-US", "x-forwarded-for": "203.0.113.7" }));
    expect(await started.json()).toMatchObject({ ok: true });
    expect(accessOf((await store.getWorkspaceById(ws.id))!)).toBe("audit");
    // Connect: the invite is made.
    expect(await (await connect(req("/api/w/amazon", { t: token }))).json()).toMatchObject({ ok: true, url: "https://datadoe.example/i/1" });
    // DataDoe sends the browser back: linked, and the one pull runs (no history import for an audit).
    const back = await callback(new Request(`https://rocco.works/api/datadoe/callback?ref=${ws.id}&invitationId=inv-1&success=true&sellerOrVendorId=${ACC}`));
    expect(back.headers.get("location")).toMatch(/amazon=connected/);
    await Promise.all(pending);
    expect(pulls).toEqual([ACC]);
    expect(history).not.toHaveBeenCalled();
    const after1 = (await store.getWorkspaceById(ws.id))!;
    expect(after1.audit).toMatchObject({ pulls: 1 });
    expect(after1.audit!.connectedAt).toBeTruthy();
    // "Check now" after a good pull: refused (402), no second export.
    const again = await sync(req("/api/w/amazon/sync", { t: token }));
    expect(again.status).toBe(402);
    expect(pulls).toEqual([ACC]);
    // A second Amazon account: refused for the audit.
    const second = await connect(req("/api/w/amazon", { t: token }));
    expect(second.status).toBe(402);
  });

  it("a failed first pull can be retried with Check now (once the 2-minute wait is over)", async () => {
    vi.stubEnv("DATADOE_API_KEY", "k");
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    ws.audit = { startedAt: new Date().toISOString(), pulls: 1, lastPullAt: new Date(Date.now() - 10 * 60_000).toISOString() };
    ws.amazon = { accounts: [{ id: ACC, name: "Habit Nest", country: "US", connectedAt: new Date().toISOString() }], lastSync: { at: new Date(Date.now() - 5 * 60_000).toISOString(), kinds: [], errors: ["sp_search_term: failed"] } };
    await store.saveWorkspace(ws);
    const r = await sync(req("/api/w/amazon/sync", { t: token }));
    expect(r.status).toBe(200);
    expect(pulls).toEqual([ACC]);
    expect((await store.getWorkspaceById(ws.id))!.audit!.pulls).toBe(2);
  });

  it("every job is visible, but approve / applied / create / restock / undo / strategy / ask refuse with 402", async () => {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws, token } = await createWorkspace(store);
    await runAnalysis(store, ws, "main", loadFixture("sp-search-term-report.csv"));
    const run = (await store.listRuns(ws.id, { limit: 1 }))[0];
    const codes = run.proposals.map((p) => p.code);
    expect(codes.length).toBeGreaterThan(FREE_PROPOSALS);
    // Without an audit: the teaser (top fix only).
    expect((await buildBrief(store, ws)).perBrand[0].hidden).toBeGreaterThan(0);
    ws.audit = { startedAt: new Date().toISOString(), pulls: 1 };
    await store.saveWorkspace(ws);
    const b = await buildBrief(store, ws);
    expect(b.perBrand[0].hidden).toBe(0);
    expect(b.perBrand[0].open.length).toBe(codes.length);

    const body = { t: token, brand: "main", codes: [codes[0]] };
    const a = await approve(req("/api/w/approve", body));
    expect(a.status).toBe(402);
    expect(await a.json()).toMatchObject({ audit: true });
    expect((await applied(req("/api/w/applied", body))).status).toBe(402);
    expect((await createCampaign(req("/api/w/create-campaign", { ...body, codes: ["H1"] }))).status).toBe(402);
    expect((await restock(req("/api/w/restock", { t: token, account: ACC, items: [{ sku: "A", qty: 10 }] }))).status).toBe(402);
    expect((await undo(req("/api/w/undo", { t: token, id: "x" }))).status).toBe(402);
    expect((await strategy(req("/api/w/strategy", { t: token, brand: "main", autonomy: "auto" }))).status).toBe(402);
    expect((await ask(req("/api/w/ask", { t: token, q: "What should I do first?" }))).status).toBe(402);
    // Nothing logged as made, and the shared logger refuses audit teams too (texts, Claude).
    expect(await store.listActions(ws.id)).toEqual([]);
    await expect(applyChanges(store, (await store.getWorkspaceById(ws.id))!, [codes[0]], { brand: "main" })).rejects.toThrow(/read-only/);
  });

  it("paying keeps the same team, its Amazon connection and data (no reconnect)", async () => {
    const store = new MemoryStore(); setStoreForTests(store);
    const { ws } = await createWorkspace(store);
    ws.audit = { startedAt: new Date().toISOString(), pulls: 1 };
    ws.amazon = { accounts: [{ id: ACC, name: "Habit Nest", country: "US", connectedAt: new Date().toISOString() }] };
    await store.saveWorkspace(ws);
    // What lib/billing.ts sets on a payment tagged with metadata.ref = ws.id.
    const fresh = (await store.getWorkspaceById(ws.id))!;
    Object.assign(fresh, { licensed: true, paidUntil: new Date(Date.now() + 365 * DAY).toISOString(), hiredAt: new Date().toISOString(), plan: "annual" });
    await store.saveWorkspace(fresh);
    const paid = (await store.getWorkspaceById(ws.id))!;
    expect(accessOf(paid)).toBe("paid");
    expect(paid.amazon!.accounts[0].id).toBe(ACC);
    expect(scheduledPullOk(paid)).toBe(true);
    expect(auditPullOk(paid).ok).toBe(true);
  });
});
