"use client";
import { useState } from "react";
import { Urgency, ValueCalc } from "@/components/start/ValueCalc";
import { RoccoHead } from "@/components/Rocco";

/**
 * The one setup step: connect Amazon (through DataDoe, an Amazon-approved data partner). Seller Central, then Ads.
 * Also the "data loading" state once connected, with a Check now button.
 */
export function ConnectAmazon({ token, accounts, note, lastSync }: { token: string; accounts: { name: string; country: string; status: string }[]; note?: string; lastSync?: { at: string; kinds: string[]; errors: string[] } }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function connect() {
    setBusy(true); setMsg("");
    const d = (await fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { url?: string; error?: string } | null;
    if (d?.url) { window.location.href = d.url; return; }
    setBusy(false); setMsg(d?.error ?? "Couldn't open Amazon. Try again.");
  }
  async function check() {
    setBusy(true); setMsg("Checking your Amazon data… this can take a minute or two.");
    const d = (await fetch("/api/w/amazon/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { lastSync?: { kinds: string[] }; skipped?: string } | null;
    setBusy(false);
    if (d?.lastSync?.kinds?.length) { window.location.reload(); return; }
    setMsg(d?.skipped ? "I checked less than an hour ago. Amazon's first load can take a few hours." : "Not ready yet. Amazon is still sending me your history. I'll text you when it's in.");
  }

  if (!accounts.length) {
    return (
      <div className="rc-card">
        <div className="rc-av"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="rc" /></svg></div>
        <h1>Connect your Amazon.</h1>
        <p className="rc-sub">Sign in with Amazon once. Every morning I find what to fix, you approve, I make the change.</p>
        {note && <p className="rc-note">{note}</p>}
        <ol className="rc-steps">
          <li><b>Seller Central</b><span>sales, stock, listings</span></li>
          <li><b>Amazon Ads</b><span>campaigns, search terms, bids</span></li>
        </ol>
        <button className="btn rc-btn" disabled={busy} onClick={connect}>{busy ? "Opening Amazon…" : "Connect Amazon →"}</button>
        {msg && <p className="err">{msg}</p>}
        <ul className="rc-trust">
          <li>🔒 Amazon&apos;s own sign-in. I never see your password.</li>
          <li>✋ Nothing changes without your approval. Every change is logged and undoable.</li>
          <li>↩︎ Remove access anytime in Seller Central → Manage your apps.</li>
        </ul>
        <p className="fine">Connection runs through DataDoe, an Amazon-approved data partner. Works in every Amazon marketplace.</p>
      </div>
    );
  }

  return (
    <div className="rc-card">
      <div className="rc-av pulse"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="rc2" /></svg></div>
      <h1>Amazon is sending me your data.</h1>
      {note && <p className="rc-note">{note}</p>}
      <ul className="rc-progress">
        {accounts.map((a) => (
          <li key={a.name + a.country}>
            <span className="ok">✓</span><div><b>{a.name} · {a.country}</b><small>{a.status}</small></div>
          </li>
        ))}
        <li><span className="spin" aria-hidden /><div><b>First check</b><small>{lastSync?.errors?.length && !lastSync.kinds.length ? "Waiting for Amazon's first data load (usually a few hours)" : "Reading 30 days of ads, sales and stock"}</small></div></li>
      </ul>
      <button className="btn rc-btn" disabled={busy} onClick={check}>{busy ? "Checking…" : "Check now"}</button>
      {msg && <p className="fine" role="status">{msg}</p>}
      <button className="linkbtn" disabled={busy} onClick={connect}>+ Connect another Amazon account</button>
    </div>
  );
}

/** Signed up but not paid yet: one step, checkout. Connecting Amazon comes right after payment. */
export function HireCard({ url, monthlyUrl }: { url: string; monthlyUrl?: string }) {
  return (
    <div className="rc-card">
      <div className="rc-av"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="rch" /></svg></div>
      <h1>Hire me, then connect your Amazon.</h1>
      <p className="rc-sub">Every morning I find what to fix, you approve, I make the change and check it a week later.</p>
      <Urgency />
      <ValueCalc />
      <ol className="rc-steps">
        <li><b>Hire Rocco</b><span>$1,190/yr or $119/mo</span></li>
        <li><b>Connect Amazon</b><span>Seller Central + Ads, 2 minutes</span></li>
        <li><b>Approve fixes</b><span>first ones the same day</span></li>
      </ol>
      <a className="btn rc-btn" href={url}>Hire Rocco · $1,190/yr (2 months free) →</a>
      {monthlyUrl && <a className="linkbtn rc-monthly" href={monthlyUrl}>or $119 a month</a>}
      <ul className="rc-trust">
        <li>✋ Nothing changes in Amazon without your approval.</li>
        <li>🛡️ 30-day money-back guarantee. Cancel anytime.</li>
      </ul>
    </div>
  );
}

/** Small "+ Connect another Amazon account" button for the dashboard footer. */
export function ConnectButton({ token, label = "+ Connect another Amazon account", reconnect, className = "linkbtn" }: { token: string; label?: string; reconnect?: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className={className} disabled={busy} onClick={async () => {
      setBusy(true);
      const d = (await fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, reconnect }) }).then((r) => r.json()).catch(() => null)) as { url?: string } | null;
      if (d?.url) window.location.href = d.url; else setBusy(false);
    }}>{busy ? "Opening Amazon…" : label}</button>
  );
}
