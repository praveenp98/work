import type { Workspace } from "./store/types";

/**
 * Who can use Rocco (Nov 18, 2026 decision): no free plan. $99/year after a 3-day free trial (card required,
 * Dodo subscription). Access = an active paid period, a running trial, or a legacy lifetime license.
 * Without access Rocco still shows the demo and a teaser total ("I found ~$X/mo across N fixes"), nothing more.
 */
export type Access = "paid" | "trial" | "none";

export function accessOf(ws: Workspace, now = new Date()): Access {
  const t = now.getTime();
  if (ws.licensed && (!ws.paidUntil || new Date(ws.paidUntil).getTime() > t)) return "paid";
  if (ws.trialEndsAt && new Date(ws.trialEndsAt).getTime() > t) return "trial";
  return "none";
}

export const hasAccess = (ws: Workspace, now = new Date()) => accessOf(ws, now) !== "none";

/** Hours left in the trial (null when not trialing). */
export function trialHoursLeft(ws: Workspace, now = new Date()): number | null {
  if (accessOf(ws, now) !== "trial" || !ws.trialEndsAt) return null;
  return Math.max(0, Math.round((new Date(ws.trialEndsAt).getTime() - now.getTime()) / 3_600_000));
}

export const TRIAL_DAYS = 3;
