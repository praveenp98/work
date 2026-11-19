import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accessOf } from "@/lib/access";
import { syncBilling } from "@/lib/billing";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome to Rocco", robots: { index: false, follow: false } };

/**
 * Where Dodo sends people after checkout. Dodo adds the payment/subscription id to this URL; we check it with
 * Dodo's API (never trust the URL) so the plan is on before they land, without waiting for the webhook.
 * "You're in" only shows when the team really has access; otherwise they land on their page with the offer.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ payment_id?: string; subscription_id?: string }> }) {
  const sp = await searchParams;
  const ok = (v?: string) => (v && /^[\w-]{6,80}$/.test(v) ? v : undefined);
  const ids = { payment_id: ok(sp.payment_id), subscription_id: ok(sp.subscription_id) };
  const token = unseal((await cookies()).get("rocco_team")?.value);
  const store = getStore();
  let ws = token && store ? await loadWorkspace(store, token) : null;
  if (ws && store && accessOf(ws) === "none" && (ids.payment_id || ids.subscription_id)) {
    await syncBilling(store, { data: ids }).catch(() => null);
    ws = await loadWorkspace(store, token!);
  }
  if (ws && token) redirect(accessOf(ws) === "none" ? `/w/${token}` : `/w/${token}?welcome=1`);
  // No team in this browser (hired from a text link on another device): verify, Rocco texts the team itself.
  const paid = store && (ids.payment_id || ids.subscription_id) ? (await syncBilling(store, { data: ids }).catch(() => null))?.ws : null;
  return (
    <section className="start-page">
      <h1>{paid && accessOf(paid) !== "none" ? "You hired Rocco 🎉" : "Almost there"}</h1>
      <p className="hello-lede">{paid && accessOf(paid) !== "none" ? "I just texted your team. Open your messages, or sign in here to see your Rocco." : "Sign in with the Google account you hired Rocco with, and I'll open your team's Rocco."}</p>
      <Link className="btn" href="/api/auth/google?intent=signin" rel="nofollow">Sign in</Link>
    </section>
  );
}
