import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteRocco } from "@/components/dash/DeleteRocco";
import { closeBlocker } from "@/lib/account";
import { accessOf } from "@/lib/access";
import { acctLabel } from "@/lib/health";
import { hireUrl } from "@/lib/paywall";
import { getStore } from "@/lib/store";
import { actor, displayName, peopleOf, roleOf } from "@/lib/team";
import { loadWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account · Rocco", robots: { index: false, follow: false } };

const day = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

/** Who's signed in, plan and billing, team and accounts, help, sign out, delete. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = getStore();
  const ws = store ? await loadWorkspace(store, token) : null;
  if (!store || !ws) notFound();
  const me = await actor();
  const role = me ? roleOf(ws, me.email) : null;
  const access = accessOf(ws);
  const people = peopleOf(ws);
  const accounts = ws.amazon?.accounts ?? [];
  const cancelled = /cancel/i.test(ws.subStatus ?? "");
  return (
    <section className="ps-page acc">
      <h1>Account</h1>

      <div className="acc-card">
        <h2>You</h2>
        {me ? <p>Signed in as <b>{me.email}</b>{role ? <> · {role === "owner" ? "Owner" : "Teammate"}</> : " · not on this team"}</p>
          : <p>Not signed in. <a href="/api/auth/google?intent=signin" rel="nofollow">Sign in with Google</a> to approve changes under your name.</p>}
        <form action="/api/auth/signout" method="post"><button className="btn ghost small">Sign out</button></form>
      </div>

      <div className="acc-card">
        <h2>Plan &amp; billing</h2>
        {access === "audit" ? <p>Free audit (read-only): nothing changes in Amazon. <a href={hireUrl(ws)}>Hire Rocco</a> to make the changes.</p> : access === "none" ? <p>No active plan. <a href={hireUrl(ws)}>Hire Rocco</a></p> : (
          <>
            <p><b>{ws.plan === "monthly" ? "Monthly" : ws.plan === "annual" ? "Yearly" : "Active"}</b>{access === "trial" ? " · trial" : ""}{ws.comp ? " · complimentary" : ""}</p>
            {ws.paidUntil && <p className="fine">{cancelled ? "Cancelled: works until" : "Paid through"} {day(ws.paidUntil)}{ws.hiredAt ? ` · hired ${day(ws.hiredAt)}` : ""}</p>}
          </>
        )}
        <p className="fine">Receipts and invoices: in your Dodo Payments email. To cancel, use the link in that email or write to <a href="mailto:human@rocco.works">human@rocco.works</a> from the email you paid with. <Link href="/help/cancel">How cancelling works</Link></p>
      </div>

      <div className="acc-card">
        <h2>Team &amp; Amazon accounts</h2>
        <p>{people.length} {people.length === 1 ? "person" : "people"}: {people.map((p) => displayName(ws, p.email)).join(", ") || "just you"}</p>
        <p>{accounts.length ? accounts.map((a) => acctLabel(a)).join(" · ") : "No Amazon account connected yet."}</p>
        <Link className="btn ghost small" href={`/w/${token}#settings`}>Team, accounts, goals &amp; messages →</Link>
      </div>

      <div className="acc-card">
        <h2>Help</h2>
        <p><Link href="/help">Help centre</Link> · <a href="mailto:human@rocco.works">Email a human</a> (usually answered the same day) · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
      </div>

      {role === "owner" && (
        <div className="acc-card acc-danger">
          <h2>Delete my Rocco</h2>
          <p className="fine">Closes this Rocco for you and your whole team.</p>
          <DeleteRocco token={token} blocked={closeBlocker(ws)} />
        </div>
      )}
    </section>
  );
}
