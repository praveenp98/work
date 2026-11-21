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
      accessLevel: "READ_ONLY", // read-and-write comes with "Rocco applies approved changes" (value to confirm in DataDoe's API docs)
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
