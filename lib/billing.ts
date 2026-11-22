import { extraProduct, fetchPayment, fetchSubscription, latestPaymentOf, ourProducts, type DodoSubscription } from "./payments";
import type { Store, Workspace } from "./store/types";
import { trackServer } from "./track-server";

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
  let pay = data.payment_id ? await fetchPayment(String(data.payment_id)) : null;
  const subId = data.subscription_id ?? pay?.subscription_id ?? undefined;
  const sub = subId ? await fetchSubscription(String(subId)) : null;
  // Only a subscription id (some return links): look up its latest succeeded payment so access turns on right away.
  if (!pay && sub && ["active", "pending"].includes(sub.status ?? "")) pay = await latestPaymentOf(sub.subscription_id).catch(() => null);
  const ref = sub?.metadata?.ref ?? pay?.metadata?.ref;
  if (!ref || !/^[A-Za-z0-9-]{6,64}$/.test(ref)) return { ws: null, change: null };
  const ws = await store.getWorkspaceById(ref);
  if (!ws) return { ws: null, change: null };

  // Only our own products unlock Rocco (another product on the same Dodo account must never grant access).
  const product = sub?.product_id ?? pay?.product_cart?.[0]?.product_id;
  if (product && product === extraProduct()) return { ws: await syncExtra(store, ws, sub, pay, now), change: null };
  if (!product || !ourProducts().includes(product)) return { ws: null, change: null };

  let change: BillingChange = null;
  // Refund or chargeback: access ends now (the 7-day guarantee refund, or a dispute).
  // Checked on the payment itself (not the event type), so replaying an old "payment succeeded" webhook for a
  // refunded payment can never switch access back on.
  const refunded = (pay?.refunds ?? []).some((r) => /succeed/i.test(r.status ?? ""));
  const disputed = (pay?.disputes ?? []).some((d) => !/won|cancel|expired/i.test(d.dispute_status ?? d.status ?? ""));
  if (refunded || disputed) {
    if (ws.paidUntil && new Date(ws.paidUntil) > now) ws.paidUntil = now.toISOString();
    if (ws.trialEndsAt && new Date(ws.trialEndsAt) > now) ws.trialEndsAt = now.toISOString();
    if (sub) { ws.subscriptionId = sub.subscription_id; ws.subStatus = sub.status; }
    await store.saveWorkspace(ws);
    return { ws, change: "ended" };
  }
  if (sub) { ws.subscriptionId = sub.subscription_id; ws.subStatus = sub.status; }
  const nextBill = sub?.next_billing_date ? new Date(sub.next_billing_date) : null;

  if (pay?.status === "succeeded" && (!sub || ["active", "pending", "cancelled"].includes(sub.status ?? ""))) {
    // The paid period is counted from when Dodo says the payment happened, so replaying an old webhook can't stretch
    // it: monthly covers ~a month from that payment, yearly ~a year.
    const monthly = !!product && product === process.env.DODO_PRODUCT_ID_MONTHLY;
    const paidAt = pay.created_at ? new Date(pay.created_at) : now;
    const cover = new Date(paidAt.getTime() + (monthly ? 32 : 367) * 86_400_000);
    const until = nextBill && nextBill > now && nextBill <= cover ? nextBill : cover;
    if (until > now) {
      if (!ws.licensed || !ws.paidUntil || new Date(ws.paidUntil) < until) { change = "paid"; trackServer(ws.id, ws.licensed ? "renewed" : "paid", { plan: monthly ? "monthly" : "annual" }); }
      ws.licensed = true;
      if (!ws.paidUntil || new Date(ws.paidUntil) < until) ws.paidUntil = until.toISOString();
      ws.hiredAt ??= now.toISOString(); // for "Rocco has earned N× his price" on the dashboard
      if (product) ws.plan = monthly ? "monthly" : "annual";
      ws.trialEndsAt = undefined;
    }
  } else if (sub && ["failed", "expired", "on_hold"].includes(sub.status ?? "")) {
    if (ws.trialEndsAt && new Date(ws.trialEndsAt) > now) ws.trialEndsAt = now.toISOString();
    if (ws.paidUntil && new Date(ws.paidUntil) > now) ws.paidUntil = now.toISOString();
    change = "ended";
  } else if (sub?.status === "cancelled") {
    change = "cancelled";
  }
  // No more trials (pay at signup): a "pending" or "trialing" subscription unlocks nothing. Access only ever comes
  // from a succeeded payment that Dodo itself reports.
  await store.saveWorkspace(ws);
  return { ws, change };
}

/**
 * "Extra Amazon account" subscription: one slot per subscription, valid while paid (≈ a month from each payment,
 * capped by the next billing date). Refund, dispute, failure or end → the slot goes away.
 */
async function syncExtra(store: Store, ws: Workspace, sub: DodoSubscription | null, pay: Awaited<ReturnType<typeof fetchPayment>>, now: Date): Promise<Workspace> {
  const id = sub?.subscription_id ?? pay?.subscription_id ?? pay?.payment_id;
  if (!id) return ws;
  const slots = (ws.extraAccounts ?? []).filter((x) => x.subscriptionId !== id);
  const bad = (pay?.refunds ?? []).some((r) => /succeed/i.test(r.status ?? "")) || (pay?.disputes ?? []).some((d) => !/won|cancel|expired/i.test(d.dispute_status ?? d.status ?? "")) || ["failed", "expired", "on_hold"].includes(sub?.status ?? "");
  const prev = (ws.extraAccounts ?? []).find((x) => x.subscriptionId === id);
  let until = prev?.until;
  if (!bad && pay?.status === "succeeded") {
    const paidAt = pay.created_at ? new Date(pay.created_at) : now;
    const cover = new Date(paidAt.getTime() + 32 * 86_400_000);
    const next = sub?.next_billing_date ? new Date(sub.next_billing_date) : null;
    const u = next && next > now && next <= cover ? next : cover;
    if (!until || new Date(until) < u) until = u.toISOString();
  }
  if (bad) until = now.toISOString();
  if (until) slots.push({ subscriptionId: id, until, status: sub?.status });
  ws.extraAccounts = slots;
  await store.saveWorkspace(ws);
  return ws;
}
