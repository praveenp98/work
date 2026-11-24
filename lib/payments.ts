/**
 * Payments: Dodo Payments (merchant of record for individuals; revenue verifiable on TrustMRR).
 * Two subscription products, "Hire Rocco": yearly $2,790 (DODO_PRODUCT_ID_ANNUAL) and monthly $279
 * (DODO_PRODUCT_ID_MONTHLY), see lib/pricing.ts. DODO_PRODUCT_ID (the older quarterly product) is the fallback for both.
 * - Checkout: Dodo static payment link for the chosen plan, tagged with the workspace.
 * - Unlock: Dodo license keys, checked with the public /licenses/validate endpoint.
 * - Count: unique paying customers via the Dodo API (DODO_API_KEY, server only). Rocco never changes the Dodo price.
 */
import { stateFor, type PlanId, type PriceState } from "./pricing";
import { SITE } from "./site";

export const DODO_MODE: "live" | "test" = process.env.DODO_MODE === "test" ? "test" : "live";
const API_BASE = DODO_MODE === "test" ? "https://test.dodopayments.com" : "https://live.dodopayments.com";
const CHECKOUT_BASE = DODO_MODE === "test" ? "https://test.checkout.dodopayments.com" : "https://checkout.dodopayments.com";

/** The single live product (created Nov 17, 2026). Env overrides for test mode. */
/** The original one-time "Hire Rocco" product (Nov 17). Its buyers keep lifetime access and count as hires. */
export const LEGACY_PRODUCT_ID = "pdt_0Ns7dcv01gDgTlIQC1O1b";
/** Older subscription product (quarterly): the fallback until the yearly and monthly products are set. */
export const PRODUCT_ID = process.env.DODO_PRODUCT_ID || (DODO_MODE === "live" ? LEGACY_PRODUCT_ID : undefined);
const validId = (v?: string) => (v && /^pdt_[A-Za-z0-9]+$/.test(v) ? v : undefined);
/** The Dodo product for a plan (yearly is the default everywhere). */
// No fallback to the old $99/quarterly products: a missing plan product means checkout is off, never the wrong price.
export const productFor = (plan: PlanId = "annual") => validId(plan === "monthly" ? process.env.DODO_PRODUCT_ID_MONTHLY : process.env.DODO_PRODUCT_ID_ANNUAL);
/** Every product whose payments count as hiring Rocco. */
/** Only the current plans unlock Rocco (a new purchase of an old product must not grant a year). */
export const ourProducts = () => [process.env.DODO_PRODUCT_ID_ANNUAL, process.env.DODO_PRODUCT_ID_MONTHLY].filter(Boolean) as string[];
/** Old products: still counted as past hires on the price ladder, never as new access. */
export const pastProducts = () => [PRODUCT_ID, LEGACY_PRODUCT_ID].filter(Boolean) as string[];

/** "Extra Amazon account" subscription (+$49/mo each). Unset = extra accounts are by email. */
export const extraProduct = () => validId(process.env.DODO_PRODUCT_ID_EXTRA_ACCOUNT);

export function checkoutUrl(opts: { email?: string; ref?: string; redirect?: string; plan?: PlanId | "extra" } = {}): string | null {
  const product = opts.plan === "extra" ? extraProduct() : productFor(opts.plan);
  if (!product) return null;
  const q = new URLSearchParams({ quantity: "1", redirect_url: opts.redirect ?? `${SITE.url}/thanks` });
  if (opts.email) q.set("email", opts.email);
  if (opts.ref) q.set("metadata_ref", opts.ref);
  return `${CHECKOUT_BASE}/buy/${product}?${q.toString()}`;
}

/** Server-only: validate a Rocco license key with Dodo. */
export async function validateLicenseKey(key: string): Promise<{ ok: boolean; error?: string; status: number }> {
  const k = key.trim();
  if (!k || k.length > 200) return { ok: false, error: "Paste the license key from your receipt email.", status: 400 };
  const res = await fetch(`${API_BASE}/licenses/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_key: k }),
    cache: "no-store",
  }).catch(() => null);
  if (!res) return { ok: false, error: "Couldn't reach the license server. Try again.", status: 502 };
  const data = (await res.json().catch(() => ({}))) as { valid?: boolean };
  if (res.ok && data.valid === true) return { ok: true, status: 200 };
  return { ok: false, error: "That key isn't valid (or has expired). Check your receipt email or contact us.", status: 200 };
}

interface DodoPayment { payment_id?: string; status?: string; created_at?: string; total_amount?: number; currency?: string; subscription_id?: string | null; customer?: { customer_id?: string } | null; metadata?: Record<string, string> | null; product_cart?: { product_id: string; quantity?: number }[] | null; refunds?: { status?: string }[] | null; disputes?: { dispute_status?: string; status?: string }[] | null }
export interface DodoSubscription { subscription_id: string; status?: string; product_id?: string; next_billing_date?: string | null; created_at?: string; trial_period_days?: number; metadata?: Record<string, string> | null; customer?: { customer_id?: string } | null }

async function dodoGet<T>(path: string): Promise<T | null> {
  const key = process.env.DODO_API_KEY;
  if (!key) return null;
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json().catch(() => null)) as T | null) : null;
}
export const fetchSubscription = (id: string) => (/^[A-Za-z0-9_-]{6,80}$/.test(id) ? dodoGet<DodoSubscription>(`/subscriptions/${id}`) : Promise.resolve(null));
/** Latest succeeded payment of a subscription (when Dodo's return link only carries the subscription id). */
export async function latestPaymentOf(subscriptionId: string): Promise<DodoPayment | null> {
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(subscriptionId)) return null;
  const list = await dodoGet<{ items?: DodoPayment[] }>(`/payments?subscription_id=${subscriptionId}&status=succeeded&page_size=5`);
  return list?.items?.find((p) => p.subscription_id === subscriptionId && p.status === "succeeded") ?? null;
}
export const fetchPayment = (id: string) => (/^[A-Za-z0-9_-]{6,80}$/.test(id) ? dodoGet<DodoPayment>(`/payments/${id}`) : Promise.resolve(null));

/** Cancel a subscription (no further charges). Used by the "CANCEL" text and the trial reminder. */
export async function cancelSubscription(id: string): Promise<boolean> {
  const key = process.env.DODO_API_KEY;
  if (!key || !/^[A-Za-z0-9_-]{6,80}$/.test(id)) return false;
  const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  }).catch(() => null);
  return !!res?.ok;
}

/**
 * Server-only: look a payment up in Dodo (never trust a webhook body) and return the workspace it was bought for.
 * The ref comes from checkoutUrl({ ref }) → metadata_ref on the payment.
 */
export async function verifiedPurchase(paymentId: string): Promise<{ ref: string } | null> {
  const key = process.env.DODO_API_KEY;
  if (!key || !/^[A-Za-z0-9_-]{6,80}$/.test(paymentId)) return null;
  const res = await fetch(`${API_BASE}/payments/${paymentId}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  const p = (await res.json().catch(() => null)) as (DodoPayment & { metadata?: Record<string, string> }) | null;
  if (!p || p.status !== "succeeded") return null;
  if (p.product_cart && !p.product_cart.some((c) => ourProducts().includes(c.product_id))) return null;
  const ref = p.metadata?.ref;
  return ref && /^[A-Za-z0-9-]{6,64}$/.test(ref) ? { ref } : null;
}

/**
 * Hires so far = unique customers with a succeeded payment for Rocco (a trial that converts, or a legacy one-time
 * purchase). Trials don't count until they're charged; yearly renewals don't count twice. Null without the API key.
 */
export async function countSales(): Promise<number | null> {
  const key = process.env.DODO_API_KEY;
  if (!key || !PRODUCT_ID) return null;
  const buyers = new Set<string>();
  let anon = 0;
  for (let page = 0; page < 50; page++) {
    const res = await fetch(`${API_BASE}/payments?page_size=100&page_number=${page}&status=succeeded`, {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store",
    }).catch(() => null);
    if (!res?.ok) return page === 0 ? null : buyers.size + anon;
    const items = ((await res.json().catch(() => ({}))) as { items?: DodoPayment[] }).items ?? [];
    for (const p of items) {
      if (p.status && p.status !== "succeeded") continue;
      if (p.product_cart?.some((c) => c.product_id === extraProduct())) continue; // extra accounts aren't new hires
      const ours = p.subscription_id || !p.product_cart || p.product_cart.some((c) => [...ourProducts(), ...pastProducts()].includes(c.product_id));
      if (!ours) continue;
      const who = p.customer?.customer_id ?? p.subscription_id;
      if (who) buyers.add(who); else anon++;
    }
    if (items.length < 100) break;
  }
  return buyers.size + anon;
}

const g = globalThis as unknown as { __roccoPrice?: { at: number; state: PriceState } };

/** Current price + how many teams hired Rocco (cached 60s). The price itself is fixed (lib/pricing.ts). */
export async function getPriceState(opts: { fresh?: boolean } = {}): Promise<PriceState> {
  if (!opts.fresh && g.__roccoPrice && Date.now() - g.__roccoPrice.at < 60_000) return g.__roccoPrice.state;
  const sold = await countSales();
  const state = stateFor(sold ?? 0, sold !== null);
  g.__roccoPrice = { at: Date.now(), state };
  return state;
}
