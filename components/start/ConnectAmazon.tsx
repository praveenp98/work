"use client";
import { useState } from "react";

/**
 * Direct Amazon connection (DataDoe): one button → Amazon's own sign-in → back to Rocco. Works in every marketplace,
 * no Claude needed. Shows connected accounts and their data status once linked.
 */
export function ConnectAmazon({ token, accounts, note }: { token: string; accounts: { name: string; country: string; status: string }[]; note?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    const d = (await fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { url?: string; error?: string } | null;
    if (d?.url) { window.location.href = d.url; return; }
    setBusy(false); setErr(d?.error ?? "Couldn't open Amazon. Try again.");
  }
  return (
    <div className="start-card amz-card">
      <h2>{accounts.length ? "Amazon connected" : "Connect Amazon"}</h2>
      {note && <p className="trial-note">{note}</p>}
      {accounts.length > 0 ? (
        <ul className="inbox-list">{accounts.map((a) => <li key={a.name + a.country}><b>{a.name} · {a.country}</b><small>{a.status}</small></li>)}</ul>
      ) : (
        <p className="start-sub">Sign in with Amazon once: Seller Central, then Amazon Ads. I read your numbers every morning, in any marketplace. No Claude, no reports to set up.</p>
      )}
      <button className={accounts.length ? "btn ghost small" : "btn start-main"} disabled={busy} onClick={go}>{busy ? "Opening Amazon…" : accounts.length ? "+ Connect another account" : "Connect Amazon →"}</button>
      {err && <p className="err">{err}</p>}
      <p className="fine">Read-only. Amazon shows exactly what&apos;s shared; you can remove access anytime in Seller Central → Manage your apps. Connection runs through DataDoe, an Amazon-approved data partner.</p>
    </div>
  );
}
