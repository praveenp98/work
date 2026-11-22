"use client";
import { useEffect, useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import { Urgency, ValueCalc } from "@/components/start/ValueCalc";
import { RoccoHead } from "@/components/Rocco";

/**
 * The one setup step: connect Amazon (through DataDoe, an Amazon-approved data partner). Seller Central, then Ads.
 * Also the "data loading" state once connected, with a Check now button.
 */
export function ConnectAmazon({ token, accounts, note, lastSync }: { token: string; accounts: { name: string; country: string; status: string }[]; note?: string; lastSync?: { at: string; kinds: string[]; errors: string[] } }) {
  const [busy, setBusy] = useState<"" | "connect" | "check">("");
  const [msg, setMsg] = useState("");
  // While the first pull runs (it starts the moment Amazon is connected), watch for it and open the dashboard.
  useEffect(() => {
    if (!accounts.length) return;
    let n = 0;
    const t = setInterval(async () => {
      if (++n > 60) return clearInterval(t);
      const d = (await fetch(`/api/w/amazon/status?t=${encodeURIComponent(token)}`).then((r) => r.json()).catch(() => null)) as { ready?: boolean } | null;
      if (d?.ready) { clearInterval(t); window.location.reload(); }
    }, 6000);
    return () => clearInterval(t);
  }, [accounts.length, token]);
  async function connect() {
    setBusy("connect"); setMsg("");
    const d = (await fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { url?: string; error?: string } | null;
    if (d?.url) { window.location.href = d.url; return; }
    setBusy(""); setMsg(d?.error ?? "Couldn't open Amazon. Try again.");
  }
  async function check() {
    setBusy("check"); setMsg("");
    const d = (await fetch("/api/w/amazon/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { lastSync?: { kinds: string[] }; skipped?: string } | null;
    setBusy("");
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
        <button className="btn rc-btn" disabled={!!busy} onClick={connect}>{busy ? "Opening Amazon…" : "Connect Amazon →"}</button>
        {busy === "connect" && <LoadingText steps={["Creating your private Amazon link…", "Opening Amazon's sign-in…", "Next: pick Seller Central, then Amazon Ads"]} every={1400} />}
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
      </ul>
      {lastSync?.errors?.length && !lastSync.kinds.length
        ? <p className="fine">Amazon is still sending me your history (a first load can take a few hours). This page opens your fixes by itself when it&apos;s in, and I&apos;ll text you.</p>
        : <LoadingText steps={["Reading 30 days of search terms…", "Reading campaigns, budgets and bids…", "Reading sales, traffic and Buy Box…", "Checking stock cover for every SKU…", "Finding what to fix, ranked by money…", "Grouping it into today's jobs…"]} every={9000} />}
      <button className="btn rc-btn" disabled={!!busy} onClick={check}>{busy ? "Checking…" : "Check now"}</button>
      {busy === "check" && <LoadingText steps={["Asking Amazon for the latest reports…", "Reading ads, sales and stock…", "Finding what to fix…"]} every={8000} />}
      {msg && <p className="fine" role="status">{msg}</p>}
      <button className="linkbtn" disabled={!!busy} onClick={connect}>+ Connect another Amazon account</button>
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
