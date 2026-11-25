import type { Workspace } from "./store/types";

/**
 * Closing a Rocco ("Delete my Rocco" on the Account page). Pure and tested (lib/account.test.ts).
 * Closing takes effect at once: the owner and teammates are unlinked (sign-in won't find it), Amazon accounts are
 * released (listed in removedAccounts so the admin deletes them in DataDoe), reminders stop, and the private link is
 * rotated by the caller. Stored data is erased by the admin within 30 days (docs/ROUTINE.md).
 */
export const ACTIVE_SUB = ["active", "pending", "on_hold"];

/** Why this Rocco can't be closed yet, or null. A running subscription must be cancelled first. */
export function closeBlocker(ws: Workspace): string | null {
  if (ws.subscriptionId && ACTIVE_SUB.includes(String(ws.subStatus ?? "").toLowerCase()))
    return "Your plan is still active. Cancel it first (the link in your Dodo receipt email, or email human@rocco.works from the email you paid with), then delete.";
  return null;
}

export function closeWorkspace(ws: Workspace, by: string, now = new Date()): Workspace {
  const at = now.toISOString();
  const released = (ws.amazon?.accounts ?? []).map((a) => ({ id: a.id, name: a.name, country: a.country, connectedAt: a.connectedAt, removedAt: at, by }));
  ws.removedAccounts = [...(ws.removedAccounts ?? []), ...released].slice(-50);
  if (ws.amazon) ws.amazon = { ...ws.amazon, accounts: [], invite: undefined };
  ws.ownerEmail = `deleted-${now.getTime()}+${ws.ownerEmail ?? "owner"}`;
  ws.ownerVerified = false;
  ws.members = [];
  if (ws.reminders) ws.reminders = { ...ws.reminders, cadence: "off" };
  ws.licensed = false;
  ws.paidUntil = at;
  ws.trialEndsAt = undefined;
  ws.deletedAt = at;
  ws.deletedBy = by;
  return ws;
}
