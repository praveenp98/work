import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accessOf } from "@/lib/access";
import { syncBilling } from "@/lib/billing";
import { getStore } from "@/lib/store";
import { unseal } from "@/lib/vault";
import { loadWorkspace, revealToken } from "@/lib/workspace";
import { WelcomeWait } from "./WelcomeWait";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome to Rocco", robots: { index: false, follow: false } };

/**
 * Where Dodo sends people after checkout. Dodo adds the payment/subscription id to this URL; we check it with
 * Dodo's API (never trust the URL) so the plan is on before they land, without waiting for the webhook.
 * "You're in" only shows when the team really has access; otherwise they land on their page with the offer.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ payment_id?: string; subscription_id?: string; try?: string }> }) {
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
  const tries = Number(sp.try ?? 0) || 0;
  // Paid, but Dodo hasn't confirmed yet: never bounce a buyer back to "Hire Rocco". Keep checking for ~40s.
  if (ws && token && accessOf(ws) === "none" && (ids.payment_id || ids.subscription_id)) {
    const next = new URLSearchParams({ ...(ids.payment_id ? { payment_id: ids.payment_id } : {}), ...(ids.subscription_id ? { subscription_id: ids.subscription_id } : {}), try: String(tries + 1) });
    return (
      <section className="start-page">
        <h1>{tries < 12 ? "Confirming your payment…" : "Almost there"}</h1>
        {tries < 12 ? (
          <>
            <WelcomeWait next={`/welcome?${next.toString()}`} />
            <p className="hello-lede">This usually takes a few seconds. Don&apos;t close the page.</p>
          </>
        ) : (
          <p className="hello-lede">Your payment went through, but the confirmation hasn&apos;t reached me yet. Refresh in a minute. If it still says this, email hello@rocco.works with your receipt and I&apos;ll switch you on right away.</p>
        )}
      </section>
    );
  }
  if (ws && token) redirect(accessOf(ws) === "none" ? `/w/${token}` : `/w/${token}?welcome=1`);
  // No team in this browser (hired from a text link on another device): verify, Rocco texts the team itself.
  const paid = store && (ids.payment_id || ids.subscription_id) ? (await syncBilling(store, { data: ids }).catch(() => null))?.ws : null;
  // Paid from a text link on another device: the payment proves it's their team. A team with no Google owner yet opens
  // straight away (they claim it by signing in there); a team with an owner asks that owner to sign in.
  const t = paid && accessOf(paid) !== "none" && !paid.ownerVerified ? revealToken(paid) : null;
  if (t) redirect(`/w/${t}?welcome=1`);
  return (
    <section className="start-page">
      <h1>{paid && accessOf(paid) !== "none" ? "You hired Rocco 🎉" : "Almost there"}</h1>
      <p className="hello-lede">{paid && accessOf(paid) !== "none" ? "Sign in with Google to open your team's Rocco and connect Amazon." : "Sign in with the Google account you hired Rocco with, and I'll open your team's Rocco."}</p>
      <Link className="btn" href="/api/auth/google?intent=signin" rel="nofollow">Sign in</Link>
    </section>
  );
}
