import { TRIAL_DAYS } from "./access";
import { fetchPayment, fetchSubscription } from "./payments";
import type { Store, Workspace } from "./store/types";

/**
 * Turn a Dodo webhook into the workspace's billing state. The webhook body is never trusted: it only names a
 * subscription or payment, which is fetched from Dodo's API. The workspace comes from the checkout link's
 * metadata_ref (hireUrl). Returns what changed so the caller can tell the team.
 *
 *  - subscription active, nothing charged yet  → trial (trialEndsAt = next billing date, else +3 days)
 *  - succeeded payment                          → paid (paidUntil = next billing date, else +1 year)
 *  - failed / expired / on_hold                 → access ends now
 *  - cancelled                                  → no more charges; access runs to the end of the trial/period
 */
export type BillingChange = "trial" | "paid" | "ended" | "cancelled" | null;

export async function syncBilling(store: Store, body: { type?: string; data?: { subscription_id?: string; payment_id?: string } }, now = new Date()): Promise<{ ws: Workspace | null; change: BillingChange }> {
  const data = body.data ?? {};
  const pay = data.payment_id ? await fetchPayment(String(data.payment_id)) : null;
  const subId = data.subscription_id ?? pay?.subscription_id ?? undefined;
  const sub = subId ? await fetchSubscription(String(subId)) : null;
  const ref = sub?.metadata?.ref ?? pay?.metadata?.ref;
  if (!ref || !/^[A-Za-z0-9-]{6,64}$/.test(ref)) return { ws: null, change: null };
  const ws = await store.getWorkspaceById(ref);
  if (!ws) return { ws: null, change: null };

  let change: BillingChange = null;
  if (sub) { ws.subscriptionId = sub.subscription_id; ws.subStatus = sub.status; }
  const nextBill = sub?.next_billing_date ? new Date(sub.next_billing_date) : null;

  if (pay?.status === "succeeded") {
    const until = nextBill && nextBill > now ? nextBill : new Date(now.getTime() + 365 * 86_400_000);
    if (!ws.licensed || !ws.paidUntil || new Date(ws.paidUntil) < until) change = "paid";
    ws.licensed = true;
    ws.paidUntil = until.toISOString();
    ws.hiredAt ??= now.toISOString(); // for "Rocco has earned N× his price" on the dashboard
    const product = sub?.product_id ?? pay?.product_cart?.[0]?.product_id;
    if (product) ws.plan = product === process.env.DODO_PRODUCT_ID_MONTHLY ? "monthly" : "annual";
    ws.trialEndsAt = undefined;
  } else if (sub && ["failed", "expired", "on_hold"].includes(sub.status ?? "")) {
    if (ws.trialEndsAt && new Date(ws.trialEndsAt) > now) ws.trialEndsAt = now.toISOString();
    if (ws.paidUntil && new Date(ws.paidUntil) > now) ws.paidUntil = now.toISOString();
    change = "ended";
  } else if (sub?.status === "cancelled") {
    change = "cancelled";
  } else if (sub && ["active", "trialing", "pending"].includes(sub.status ?? "") && !ws.licensed) {
    const fallback = new Date((sub.created_at ? new Date(sub.created_at) : now).getTime() + (sub.trial_period_days ?? TRIAL_DAYS) * 86_400_000);
    const ends = nextBill && nextBill > now ? nextBill : fallback;
    if (!ws.trialEndsAt) change = "trial";
    ws.trialEndsAt = ends.toISOString();
  }
  await store.saveWorkspace(ws);
  return { ws, change };
}
