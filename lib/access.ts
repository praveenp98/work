import type { Workspace } from "./store/types";

/**
 * Who can use Rocco (Nov 18, 2026 decision): no free plan. $2,790/year or $279/month (Nov 22) (legacy: 3-day trial,
 * Dodo subscription). Access = an active paid period, a running trial, or a legacy lifetime license.
 *
 * Free read-only audit (Nov 25, 2026): a team that never paid can start ONE audit (lib/free-audit.ts). It connects
 * Amazon, gets one data pull and sees its real jobs, but nothing writes and nothing costly runs. "audit" is NOT access:
 * `hasAccess` stays paid/trial only, so every write route and every Claude call keeps refusing audit teams.
 * After AUDIT_DAYS the audit team keeps its read-only view, but no new pulls.
 * Without access or an audit, Rocco still shows the demo and a teaser total ("I found ~$X/mo across N fixes").
 */
export type Access = "paid" | "trial" | "audit" | "none";

/** How long a free audit can pull data. After that the read-only view stays, pulls stop. */
export const AUDIT_DAYS = 14;

export function accessOf(ws: Workspace, now = new Date()): Access {
  const t = now.getTime();
  if (ws.licensed && (!ws.paidUntil || new Date(ws.paidUntil).getTime() > t)) return "paid";
  if (ws.trialEndsAt && new Date(ws.trialEndsAt).getTime() > t) return "trial";
  // Only a team that never paid is an audit: a lapsed or refunded payer is "none" (plan ended), never a free audit.
  if (ws.audit?.startedAt && !ws.hiredAt && !ws.licensed && !ws.deletedAt) return "audit";
  return "none";
}

/** Paid or trial: may make changes, run Claude, get daily pulls. Free audit teams are NOT included. */
export const hasAccess = (ws: Workspace, now = new Date()) => { const a = accessOf(ws, now); return a === "paid" || a === "trial"; };

/** A free audit team (active or expired): sees its real jobs read-only. */
export const isAudit = (ws: Workspace, now = new Date()) => accessOf(ws, now) === "audit";

/** Paid, trial or audit: the real jobs are visible (all of them, not the teaser). */
export const canSeeJobs = (ws: Workspace, now = new Date()) => accessOf(ws, now) !== "none";

/** Hours left in the trial (null when not trialing). */
export function trialHoursLeft(ws: Workspace, now = new Date()): number | null {
  if (accessOf(ws, now) !== "trial" || !ws.trialEndsAt) return null;
  return Math.max(0, Math.round((new Date(ws.trialEndsAt).getTime() - now.getTime()) / 3_600_000));
}

export const TRIAL_DAYS = 3;
