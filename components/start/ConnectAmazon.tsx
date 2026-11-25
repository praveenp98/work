"use client";
import { track } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import { WAIT } from "@/lib/messages";
import { Urgency } from "@/components/start/ValueCalc";
import { PlanPicker } from "@/components/start/PlanPicker";
import { RoccoHead } from "@/components/Rocco";
import type { AccountHealth } from "@/lib/health";

/**
 * The one setup step: connect Amazon (through DataDoe, an Amazon-approved data partner). Seller Central, then Ads.
 * Also the "data loading" state once connected, with a Check now button.
 */
export function ConnectAmazon({ token, accounts, note, lastSync, pinged = false }: { token: string; accounts: { id?: string; name: string; country: string; status: string; ads?: boolean }[]; note?: string; lastSync?: { at: string; kinds: string[]; errors: string[] }; pinged?: boolean }) {
  const [busy, setBusy] = useState<"" | "connect" | "check">("");
  const [msg, setMsg] = useState("");
  const [slow, setSlow] = useState(false);
  // While the first pull runs (it starts the moment Amazon is connected), watch for it and open the dashboard.
  useEffect(() => {
    if (!accounts.length) return;
    let n = 0;
    const t = setInterval(async () => {
      if (++n > 60) { clearInterval(t); setSlow(true); return; }
      const d = (await fetch(`/api/w/amazon/status?t=${encodeURIComponent(token)}`).then((r) => r.json()).catch(() => null)) as { ready?: boolean } | null;
      if (d?.ready) { clearInterval(t); window.location.reload(); }
    }, 6000);
    return () => clearInterval(t);
  }, [accounts.length, token]);
  // Real per-report status from DataDoe (lib/health.ts), not an animation: what's in, what's still loading, what's off.
  const [health, setHealth] = useState<AccountHealth[] | null>(null);
  useEffect(() => {
    if (!accounts.length) return;
    const load = () => fetch("/api/w/amazon/health", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).then((d) => d?.ok && setHealth(d.accounts)).catch(() => null);
    load();
    const t = setInterval(load, 120_000); // the health check allows 30 an hour
    return () => clearInterval(t);
  }, [accounts.length, token]);

  async function connect() {
    setBusy("connect"); setMsg(""); track("amazon_connect_clicked", { more: accounts.length > 0 });
    const d = (await fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { url?: string; error?: string } | null;
    if (d?.url) { window.location.href = d.url; return; }
    setBusy(""); setMsg(d?.error ?? "Couldn't open Amazon. Try again.");
  }
  async function check() {
    setBusy("check"); setMsg("");
    const d = (await fetch("/api/w/amazon/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null)) as { lastSync?: { kinds: string[] }; skipped?: boolean; error?: string } | null;
    setBusy("");
    if (d?.lastSync?.kinds?.length) { window.location.reload(); return; }
    setMsg(!d ? WAIT.network : d.error ? d.error : d.skipped ? `I checked a moment ago. Amazon's first load can take a few hours: this page opens your fixes by itself when they're in${pinged ? ", and I'll message you" : ""}.` : `Not ready yet: Amazon is still sending me your history. This page opens your fixes by itself when they're in${pinged ? ", and I'll message you" : ""}.`);
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
            <span className="ok">✓</span><div><b>{a.name.trim().toUpperCase() === a.country.trim().toUpperCase() ? `Amazon ${a.country}` : `${a.name} · ${a.country}`}</b><small>{a.status}</small>
              {a.ads === false && a.id && <span className="rc-noads">Amazon Ads isn&apos;t connected, so no ad jobs yet (wasted searches, bids, budgets). <ConnectButton token={token} reconnect={a.id} label="Connect Amazon Ads →" className="linkbtn" /></span>}
            </div>
          </li>
        ))}
      </ul>
      {/* One status line at a time: the Check now answer replaces the waiting line instead of adding a second one. */}
      {busy === "check" ? <LoadingText steps={["Asking Amazon for the latest reports…", "Reading what's in so far…", "Finding what to fix…"]} every={8000} />
        : msg ? <p className="fine" role="status">{msg}</p>
        : lastSync?.errors?.length && !lastSync.kinds.length ? <p className="fine">Amazon is still sending me your history (a first load can take a few hours). This page opens your fixes by itself when it&apos;s in{pinged ? ", and I'll message you" : ""}.</p>
        : slow ? <p className="fine">{WAIT.firstLoadSlow}</p>
        : health?.length ? <ReportStatus health={health} />
        : <p className="fine">Checking with Amazon what&apos;s in so far…</p>}
      <button className="btn rc-btn" disabled={!!busy} onClick={check}>{busy === "check" ? "Checking…" : "Check now"}</button>
      <button className="linkbtn" disabled={!!busy} onClick={connect}>+ Connect another Amazon account</button>
    </div>
  );
}

const MARK: Record<string, string> = { ok: "✓", loading: "…", missing: "○", off: "○", error: "!" };
/** One line per report Rocco reads, with its real state (reports that need Amazon Ads say so when Ads isn't connected). */
function ReportStatus({ health }: { health: AccountHealth[] }) {
  return (
    <div className="rc-reports">
      {health.map((a) => (
        <ul key={a.id} aria-label={`What's in for ${a.name}`}>
          {a.reports.map((r) => (
            <li key={r.kind} className={`s-${r.state}`}>
              <span aria-hidden>{MARK[r.state] ?? "…"}</span>
              <div><b>{r.name}</b> <small>{r.state === "ok" ? "in" : r.why ?? (r.state === "loading" ? "Amazon is still sending this" : "not in yet")}</small></div>
            </li>
          ))}
        </ul>
      ))}
      <p className="fine">Amazon sends history in batches, so this fills in over a few hours. I check again every couple of minutes.</p>
    </div>
  );
}

/** Signed up but not paid yet: pick a plan, then secure checkout. Connecting Amazon comes right after payment. */
export function HireCard({ url, monthlyUrl, where }: { url: string; monthlyUrl?: string; where?: import("./PlanPicker").Where | null }) {
  return (
    <div className="rc-card">
      <div className="rc-av"><svg width="56" height="46" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="rch" /></svg></div>
      <h1>Pick your plan.</h1>
      <p className="rc-sub">Then connect Amazon in 2 minutes. Your first jobs usually show up within hours.</p>
      <Urgency />
      <PlanPicker annualUrl={url} monthlyUrl={monthlyUrl ?? url} where={where} />
      <ul className="rc-trust">
        <li>🔒 Secure checkout by Dodo Payments, in your local currency.</li>
        <li>✋ Nothing changes in Amazon without your approval. Every change is logged and undoable.</li>
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
