import type { Workspace } from "./store/types";

/**
 * Amazon accounts per plan (Nov 22, Praveen): 3 included (each marketplace counts as one account), each extra +$49/mo
 * (Dodo product DODO_PRODUCT_ID_EXTRA_ACCOUNT, one subscription per extra account).
 *
 * Remove / swap: removing an account frees its slot right away only if it was connected less than 24 hours ago
 * (connected the wrong one). Otherwise the slot frees 30 days after removal, so one plan can't rotate through
 * unlimited client accounts. Existing teams already over the limit keep what they have; they just can't add more.
 */
export const INCLUDED_ACCOUNTS = 3;
export const EXTRA_ACCOUNT_CENTS = 4900;
export const SWAP_COOLDOWN_DAYS = 30;
const DAY = 86_400_000;

export interface ExtraSlot { subscriptionId: string; until: string; status?: string }
export interface RemovedAccount { id: string; name: string; country?: string; connectedAt?: string; removedAt: string; by?: string }

/** Extra account subscriptions still paid for. */
export const activeExtras = (ws: Workspace, now = new Date()) => (ws.extraAccounts ?? []).filter((x) => new Date(x.until).getTime() > now.getTime()).length;

/** Removed accounts whose slot is still held (removed < 30 days ago, and not a same-day "wrong account" removal). */
export function heldSlots(ws: Workspace, now = new Date()): RemovedAccount[] {
  const connected = new Set((ws.amazon?.accounts ?? []).map((a) => a.id)); // re-adding the same account reuses its own slot
  return (ws.removedAccounts ?? []).filter((r) => {
    if (connected.has(r.id)) return false;
    const removed = new Date(r.removedAt).getTime();
    const quick = r.connectedAt && removed - new Date(r.connectedAt).getTime() < DAY;
    return !quick && now.getTime() - removed < SWAP_COOLDOWN_DAYS * DAY;
  });
}

export function accountLimit(ws: Workspace, now = new Date()) {
  return INCLUDED_ACCOUNTS + activeExtras(ws, now);
}

/** How many slots are in use and whether one more account fits. `reconnect` of an existing account always fits. */
export function slotState(ws: Workspace, now = new Date()) {
  const connected = ws.amazon?.accounts?.length ?? 0;
  const held = heldSlots(ws, now);
  const used = connected + held.length;
  const limit = accountLimit(ws, now);
  const nextFree = held.map((r) => new Date(new Date(r.removedAt).getTime() + SWAP_COOLDOWN_DAYS * DAY)).sort((a, b) => a.getTime() - b.getTime())[0];
  return { connected, held: held.length, used, limit, canAdd: used < limit, nextFree: nextFree?.toISOString() };
}
