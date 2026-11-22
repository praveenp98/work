/**
 * DataDoe: Rocco's direct Amazon connection (docs/DATADOE.md). One DataDoe Organization (ours) holds every team's
 * Seller Central + Amazon Ads connection. A team connects with a single-use invite link; DataDoe sends the browser
 * back to /api/datadoe/callback with the new sellerOrVendorId. Key: DATADOE_API_KEY (header datadoe-api-key), server only.
 */
import { SITE } from "./site";

const BASE = (process.env.DATADOE_API_URL || "https://api.datadoe.com/api/v1").replace(/\/$/, "");
export const datadoeOn = () => !!process.env.DATADOE_API_KEY;

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", "content-type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DataDoe ${res.status}: ${body.slice(0, 300)}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export interface Invitation { id: string; invitationUrl: string; expiresAt: string }

/** One-time link (7 days) the team opens to connect Seller Central (+ optional Ads). `ref` = Rocco workspace id. */
export function createInvite(ref: string, opts: { name?: string } = {}): Promise<Invitation> {
  return call<Invitation>("/util/sellers-and-vendors/invite", {
    method: "POST",
    body: JSON.stringify({
      name: (opts.name || `Rocco ${ref.slice(0, 8)}`).slice(0, 80),
      tenantType: "SELLER",
      accessLevel: "READ_AND_WRITE", // Rocco makes approved changes; every write still needs the seller's approval in Rocco
      redirectUrl: `${SITE.url}/api/datadoe/callback?ref=${encodeURIComponent(ref)}`,
    }),
  });
}

export interface DoeConnection { id: string; name: string; initialLoadComplete: boolean; initialLoadStage?: string; needsReauthorization: boolean }
export interface DoeAccount {
  id: string; name: string; accountType: string; marketplaceCountryCode: string; rowCount: number;
  sellerCentralConnection: DoeConnection | null; amazonAdsConnection: DoeConnection | null;
}

export const getAccount = (id: string) => call<DoeAccount>(`/util/sellers-and-vendors/${encodeURIComponent(id)}`);
export const getInvitation = (id: string) => call<{ id: string; status: string; sellerOrVendorId?: string | null }>(`/util/sellers-and-vendors/invitations/${encodeURIComponent(id)}`);

/** Short human status for the dashboard. */
export function loadStatus(a: DoeAccount): string {
  const sc = a.sellerCentralConnection, ads = a.amazonAdsConnection;
  if (sc?.needsReauthorization || ads?.needsReauthorization) return "needs you to reconnect";
  const done = [sc, ads].filter(Boolean).every((c) => c!.initialLoadComplete);
  if (done) return "connected, data flowing";
  return "connected, first data loading (a few hours)";
}

export interface ActionResult { ok: boolean; id?: string; status?: string; error?: string }

/** Wait for a live Action to finish (≤ ~90s) and return its final body (status, result, error). */
export async function waitForAction(id: string, tries = 30): Promise<{ status: string; result?: unknown; error?: unknown } | null> {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 1500 : 3000));
    const res = await fetch(`${BASE}/actions/${encodeURIComponent(id)}`, { headers: { "datadoe-api-key": process.env.DATADOE_API_KEY ?? "" }, cache: "no-store" }).catch(() => null);
    if (!res?.ok) continue;
    const b = (await res.json().catch(() => null)) as { status?: string; result?: unknown; error?: unknown } | null;
    const status = String(b?.status ?? "");
    if (/COMPLET|SUCCE|DONE|FAIL|ERROR|REJECT|CANCEL/i.test(status)) return { status, result: b?.result, error: b?.error };
  }
  return null;
}

/** First value of a key (e.g. "campaignId") anywhere in an Action result. */
export function findId(x: unknown, key: string): string | undefined {
  if (!x || typeof x !== "object") return undefined;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (k === key && (typeof v === "string" || typeof v === "number")) return String(v);
    const d = findId(v, key);
    if (d) return d;
  }
  return undefined;
}

/**
 * Run one DataDoe Action (POST /actions). dryRun validates for free without touching Amazon. idempotencyKey makes a
 * retried live write safe. Write Actions need the account's DataDoe access level to be Read and write.
 */
export async function runAction(sellerOrVendorId: string, type: string, details: Record<string, unknown>, o: { dryRun?: boolean; idempotencyKey?: string } = {}): Promise<ActionResult> {
  // Kill switch (lib/security): ROCCO_WRITES_OFF=1 stops every live Amazon change at once. Dry runs still work.
  if (!o.dryRun && process.env.ROCCO_WRITES_OFF === "1") return { ok: false, error: "Changes are paused for a few minutes for maintenance. Nothing was changed." };
  const res = await fetch(`${BASE}/actions`, {
    method: "POST",
    headers: { "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({ type, sellerOrVendorId, details, ...(o.dryRun ? { dryRun: true } : {}), ...(o.idempotencyKey ? { idempotencyKey: o.idempotencyKey.slice(0, 120) } : {}) }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; actionId?: string; status?: string; message?: unknown };
  if (!res.ok) return { ok: false, error: `${res.status} ${JSON.stringify(body.message ?? body).slice(0, 240)}` };
  const status = String(body.status ?? "");
  if (/FAIL|ERROR|REJECT/i.test(status)) return { ok: false, status, error: status };
  return { ok: true, id: body.id ?? body.actionId, status };
}

/** Reconnect link when Amazon stopped accepting an account's authorization: same account, data and history. */
export function createReconnect(ref: string, accountId: string): Promise<Invitation> {
  return call<Invitation>(`/util/sellers-and-vendors/${encodeURIComponent(accountId)}/reconnect`, {
    method: "POST",
    body: JSON.stringify({ redirectUrl: `${SITE.url}/api/datadoe/callback?ref=${encodeURIComponent(ref)}` }),
  });
}
