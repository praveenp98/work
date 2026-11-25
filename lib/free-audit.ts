import { accessOf, AUDIT_DAYS, hasAccess } from "./access";
import type { Workspace } from "./store/types";

/**
 * Free read-only audit (approved by Praveen, Nov 25, 2026). A seller who hasn't paid can:
 *  1. start an audit (once per team; IP rate-limited at the route),
 *  2. connect ONE Amazon account through the normal DataDoe flow,
 *  3. get ONE data pull (the first after connecting). "Check connection now" can retry only when that pull failed,
 *     at most AUDIT_MAX_PULLS pulls in total, and only during the AUDIT_DAYS window,
 *  4. see the real jobs, items, values, KPIs read-only. Every write (approve, create, restock, listings, Actions,
 *     Images, autopilot, undo, tidy) opens the hire sheet in the page and is refused with 402 on the server
 *     (those routes check hasAccess, which is paid/trial only).
 * No daily scheduled pulls (the cron only takes hasAccess teams), no history import, no Claude calls.
 * Paying (Dodo metadata.ref = this workspace) turns the same team into a paid one: connection and data stay.
 */
export const AUDIT_MAX_PULLS = 3; // the first pull + up to 2 retries, each only after a failed pull
export const AUDIT_ACCOUNTS = 1; // one Amazon account per audit (each account is one DataDoe export set)
export const AUDIT_IP_LIMIT = { max: 3, windowMs: 24 * 3_600_000 }; // audit starts per IP per day
const DAY = 86_400_000;
/** What write routes answer an audit team (with status 402). */
export const AUDIT_READ_ONLY = "This is a free audit, so it's read-only: I haven't changed anything. Hire me to make these changes (14-day money-back guarantee).";

export interface AuditState {
  active: boolean; // inside the 14-day window
  endsAt: string;
  daysLeft: number;
  pulls: number;
  connected: boolean;
}

/** The team's audit, or null when it isn't on one (paid, trial, never started, lapsed payer). */
export function auditOf(ws: Workspace, now = new Date()): AuditState | null {
  if (accessOf(ws, now) !== "audit" || !ws.audit) return null;
  const end = new Date(ws.audit.startedAt).getTime() + AUDIT_DAYS * DAY;
  const left = end - now.getTime();
  return { active: left > 0, endsAt: new Date(end).toISOString(), daysLeft: Math.max(0, Math.ceil(left / DAY)), pulls: ws.audit.pulls ?? 0, connected: !!ws.amazon?.accounts?.length };
}

/** Can this team start a free audit? Never for paying/trial teams, lapsed payers, closed teams, or a second time. */
export function canStartAudit(ws: Workspace, now = new Date()): boolean {
  return !hasAccess(ws, now) && !ws.hiredAt && !ws.licensed && !ws.deletedAt && !ws.audit;
}

/** Start the audit (mutates ws; the caller saves). Returns false if it can't (already started counts as true). */
export function startAudit(ws: Workspace, now = new Date()): boolean {
  if (ws.audit && accessOf(ws, now) === "audit") return true;
  if (!canStartAudit(ws, now)) return false;
  ws.audit = { startedAt: now.toISOString(), pulls: 0 };
  return true;
}

/** Can an audit team connect (another) Amazon account? Reconnecting the one it has is always fine while active. */
export function auditConnectOk(ws: Workspace, now = new Date(), reconnect = false): { ok: true } | { ok: false; error: string } {
  const a = auditOf(ws, now);
  if (!a) return { ok: false, error: "Hire Rocco first, then connect your Amazon." };
  if (!a.active) return { ok: false, error: `Your ${AUDIT_DAYS}-day free audit has ended. Hire Rocco to keep reading your account.` };
  if (!reconnect && (ws.amazon?.accounts?.length ?? 0) >= AUDIT_ACCOUNTS) return { ok: false, error: "The free audit covers one Amazon account. Hire Rocco to add more." };
  return { ok: true };
}

/** A pull failed when it brought nothing in or reported errors (a table off, Amazon still loading history). */
const failed = (ws: Workspace) => { const s = ws.amazon?.lastSync; return !s || !s.kinds.length || s.errors.length > 0; };

/**
 * May an audit team pull its Amazon data now? The first pull after connecting: yes. After that only when the last
 * pull failed, inside the window, under AUDIT_MAX_PULLS. Paid/trial teams are not limited here.
 */
export function auditPullOk(ws: Workspace, now = new Date()): { ok: true } | { ok: false; error: string; running?: boolean } {
  if (hasAccess(ws, now)) return { ok: true };
  const a = auditOf(ws, now);
  if (!a) return { ok: false, error: "Hire Rocco first, then connect your Amazon." };
  if (!a.active) return { ok: false, error: `Your ${AUDIT_DAYS}-day free audit has ended. Hire Rocco for a fresh look every morning.` };
  if (a.pulls === 0) return { ok: true };
  // The counted pull hasn't finished yet (no result saved since it started): never start a second one alongside it.
  const last = ws.amazon?.lastSync?.at, started = ws.audit?.lastPullAt;
  if (started && (!last || new Date(last).getTime() < new Date(started).getTime()) && now.getTime() - new Date(started).getTime() < 15 * 60_000) return { ok: false, running: true, error: "I'm still reading your account. This page opens your jobs by itself when they're in." };
  if (a.pulls >= AUDIT_MAX_PULLS) return { ok: false, error: "The free audit's pulls are used up. Hire Rocco for a fresh look every morning." };
  if (!failed(ws)) return { ok: false, error: "The free audit includes one pull, and yours worked. Hire Rocco for a fresh look every morning." };
  return { ok: true };
}

/** Count one audit pull (mutates ws; the caller saves). No-op for paid teams. */
export function noteAuditPull(ws: Workspace, now = new Date()): void {
  if (!ws.audit || hasAccess(ws, now)) return;
  ws.audit = { ...ws.audit, pulls: (ws.audit.pulls ?? 0) + 1, lastPullAt: now.toISOString() };
}

/** Teams the daily scheduled pull may include: paid/trial only. Audit teams never get scheduled pulls. */
export const scheduledPullOk = (ws: Workspace, now = new Date()) => hasAccess(ws, now);
