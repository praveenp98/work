import { createHmac, timingSafeEqual } from "node:crypto";
import type { Store, Workspace } from "./store/types";

/**
 * Security helpers (docs/SECURITY.md).
 *  - secretOk: constant-time check of an admin/cron secret.
 *  - spend: per-team limits stored on the workspace (survive cold starts, shared by every server instance), so a
 *    leaked or abused team link can't burn DataDoe tokens or Claude credits, or flood an Amazon account with changes.
 *  - writesOff: ROCCO_WRITES_OFF=1 stops every live Amazon change at once (dry runs still work).
 *  - verifyStandardWebhook: Dodo webhook signature (Standard Webhooks spec).
 */
export function secretOk(given: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Admin routes: secret from the Authorization header (preferred) or ?key=. */
export function adminOk(req: Request): boolean {
  const h = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const q = new URL(req.url).searchParams.get("key");
  return secretOk(h || q, process.env.CRON_SECRET);
}

export const writesOff = () => process.env.ROCCO_WRITES_OFF === "1";

/** Limits per team. Window in hours. */
export const LIMITS = {
  ask: { max: 40, hours: 24 }, // Claude answers
  tidyScan: { max: 6, hours: 24 }, // ~10 DataDoe tokens each
  tidyApply: { max: 6, hours: 24 },
  sync: { max: 6, hours: 24 }, // manual "refresh my data"
  history: { max: 3, hours: 24 },
  invite: { max: 10, hours: 24 }, // Connect Amazon links
  writes: { max: 300, hours: 24 }, // Amazon changes (items) made by Rocco
  campaigns: { max: 10, hours: 24 }, // new exact campaigns
} as const;
export type LimitKey = keyof typeof LIMITS;

/** Pure check: timestamps kept inside the window, and whether `n` more fit. */
export function within(list: string[] = [], n: number, max: number, hours: number, now = new Date()): { ok: boolean; kept: string[] } {
  const from = now.getTime() - hours * 3_600_000;
  const kept = list.filter((t) => new Date(t).getTime() > from);
  return { ok: kept.length + n <= max, kept };
}

/**
 * Use `n` units of a team's limit. Saves the workspace when allowed. Returns false (and changes nothing) when the
 * limit is reached.
 */
export async function spend(store: Store, ws: Workspace, key: LimitKey, n = 1, now = new Date()): Promise<boolean> {
  const { max, hours } = LIMITS[key];
  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  const { ok, kept } = within(fresh.limits?.[key], n, max, hours, now);
  if (!ok) return false;
  const stamp = now.toISOString();
  fresh.limits = { ...(fresh.limits ?? {}), [key]: [...kept, ...Array.from({ length: n }, () => stamp)].slice(-500) };
  await store.saveWorkspace(fresh);
  ws.limits = fresh.limits;
  return true;
}

export const LIMIT_MSG: Record<LimitKey, string> = {
  ask: "That's a lot of questions for one day. Ask me again tomorrow.",
  tidyScan: "I've scanned your campaigns a few times today. Try again tomorrow.",
  tidyApply: "I've already tidied a few times today. Try again tomorrow.",
  sync: "I've refreshed your data a few times today. The morning pull will bring the rest.",
  history: "I've tried reading the history a few times today. Try again tomorrow.",
  invite: "Too many connect links today. Write to hello@rocco.works and I'll help.",
  writes: "Safety limit: I've already made a lot of changes in this account today. The rest can go tomorrow.",
  campaigns: "Safety limit: I've already created several campaigns today. The rest can go tomorrow.",
};

/**
 * Standard Webhooks (used by Dodo): signature = base64(HMAC-SHA256(secret, `${id}.${timestamp}.${body}`)), header
 * `webhook-signature: v1,<sig> [v1,<sig2>]`, secret `whsec_<base64>`. Timestamp within 5 minutes.
 */
export function verifyStandardWebhook(secret: string, h: Headers, body: string, now = Date.now()): boolean {
  const id = h.get("webhook-id"), ts = h.get("webhook-timestamp"), sig = h.get("webhook-signature");
  if (!id || !ts || !sig) return false;
  if (Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const want = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return sig.split(" ").some((s) => { const v = s.split(",")[1]; return !!v && secretOk(v, want); });
}
