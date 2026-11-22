"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Setup for teams outside the US (or without Claude): Amazon emails Rocco your reports.
 * 1. Your Rocco inbox address  2. Schedule the Ads search term report to it  3. Seller Central files (upload/forward)
 * 4. Live: waiting for the first report → "Got it" → first finding on the dashboard.
 */
type Step = "inbox" | "ads" | "seller" | "wait";
const ORDER: Step[] = ["inbox", "ads", "seller", "wait"];
type Item = { at: string; from: string; subject: string; files: { name: string; kind?: string; headline?: string; error?: string }[]; note?: string };

const ADS_STEPS = [
  "Open the Amazon Ads console → Measurement & Reporting → Sponsored ads reports.",
  "Create report → Sponsored Products → report type Search term.",
  "Time unit: Daily. Report period: Last 30 days.",
  "Schedule: Daily (or weekly). Format: CSV or XLSX.",
  "Add your Rocco inbox as an email recipient, then Run report.",
];
const ADS_EXTRA = "Optional, same way: a Campaign report (daily) so I can check budgets, and a Placement report for top-of-search bids.";
const SELLER_STEPS = [
  "Seller Central → Reports → Business Reports → Detail Page Sales and Traffic by Child Item → last 30 days → Download (CSV).",
  "Reports → Fulfillment → FBA Inventory (or Restock Inventory) → Download.",
  "Forward them to your Rocco inbox, or drop them below. Weekly is plenty.",
];

export function ReportSteps({ token, address, initial }: { token: string; address: string; initial: Item[] }) {
  const [step, setStep] = useState<Step>("inbox");
  const [copied, setCopied] = useState(false);
  const [items, setItems] = useState<Item[]>(initial);
  const [up, setUp] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const got = items.some((i) => i.files.some((f) => f.kind));
  const n = ORDER.indexOf(step);

  useEffect(() => {
    if (step !== "wait" || got) return;
    const id = setInterval(async () => {
      const d = (await fetch(`/api/w/inbox?t=${token}`).then((r) => r.json()).catch(() => null)) as { inbox?: Item[] } | null;
      if (d?.inbox) setItems(d.inbox);
    }, 8000);
    return () => clearInterval(id);
  }, [step, got, token]);

  async function copy() {
    try { await navigator.clipboard.writeText(address); } catch { window.prompt("Copy this:", address); }
    setCopied(true);
  }
  async function upload(f: File) {
    setUp("Reading…");
    const fd = new FormData(); fd.set("t", token); fd.set("file", f);
    const d = (await fetch("/api/w/upload", { method: "POST", body: fd }).then((r) => r.json()).catch(() => null)) as { ok?: boolean; error?: string; headlines?: string[] } | null;
    setUp(d?.ok ? `✓ ${d.headlines?.[0] ?? "Got it."}` : d?.error ?? "Couldn't read it.");
    if (d?.ok) setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <section className="start" aria-live="polite">
      <div className="start-dots" aria-label={`Step ${n + 1} of 4`}>{ORDER.map((s, i) => <span key={s} className={i <= n ? "on" : ""} />)}</div>

      {step === "inbox" && (
        <div className="start-card">
          <h2>Your Rocco inbox</h2>
          <p className="start-sub">Amazon will email your reports to this address and I&apos;ll read them the moment they land. It&apos;s only for your team.</p>
          <div className="inbox-addr"><code>{address}</code></div>
          <button className="btn start-main" onClick={copy}>{copied ? "Copied ✓" : "Copy my inbox address"}</button>
          <p className="fine">No Claude needed. I never log in to your Amazon account: I only read what Amazon sends here.</p>
          <Nav onNext={() => setStep("ads")} label="Next →" />
        </div>
      )}

      {step === "ads" && (
        <div className="start-card">
          <h2>Schedule your ads report</h2>
          <p className="start-sub">Once, about 3 minutes. Amazon then emails it to me every day.</p>
          <ol className="howto">{ADS_STEPS.map((s, i) => <li key={i}>{i === 4 ? <>Add <b>{address}</b> as an email recipient, then <b>Run report</b>.</> : s}</li>)}</ol>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <a className="btn start-main" href="https://advertising.amazon.com/reports" target="_blank" rel="noreferrer">Open the Ads console ↗</a>
            <button className="btn ghost small" onClick={copy}>{copied ? "Address copied ✓" : "Copy inbox address"}</button>
          </div>
          <p className="fine">{ADS_EXTRA} Menu names can differ a little by marketplace: look for Reports → Create report → Schedule.</p>
          <Nav onBack={() => setStep("inbox")} onNext={() => setStep("seller")} label="I scheduled it →" />
        </div>
      )}

      {step === "seller" && (
        <div className="start-card">
          <h2>Seller Central: sales and stock</h2>
          <p className="start-sub">Seller Central doesn&apos;t email most reports, so these come from you, once a week.</p>
          <ol className="howto">{SELLER_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <button className="btn start-main" onClick={() => fileRef.current?.click()}>Drop a report file</button>
          {up && <p className="fine" role="status">{up}</p>}
          <Nav onBack={() => setStep("ads")} onNext={() => setStep("wait")} label="Next →" skip />
        </div>
      )}

      {step === "wait" && (
        <div className="start-card">
          <h2>{got ? "Got your first report 🎉" : "Waiting for your first report…"}</h2>
          <p className="start-sub">{got ? "Your first findings are ready. Open them and approve." : "Amazon usually sends the first scheduled report within a few hours. This page updates by itself; I'll also text your team."}</p>
          <ul className="inbox-list">
            {items.length === 0 && <li className="muted">Nothing yet. Tip: run the report once now so it arrives today.</li>}
            {items.slice(0, 5).map((i) => (
              <li key={i.at}>
                <b>{i.subject || "(no subject)"}</b>
                <small>{new Date(i.at).toLocaleString()} · {i.note === "link_only" ? "only a sign-in link: set delivery to attach the file" : i.files.map((f) => (f.kind ? `✓ ${f.name}` : `✗ ${f.name}: ${f.error}`)).join(" · ") || "no report attached"}</small>
              </li>
            ))}
          </ul>
          {got ? <button className="btn start-main" onClick={() => window.location.reload()}>See my first finding →</button> : <button className="linkbtn" onClick={() => setStep("ads")}>← Check the schedule steps</button>}
        </div>
      )}
    </section>
  );
}

function Nav({ onBack, onNext, label, skip }: { onBack?: () => void; onNext: () => void; label: string; skip?: boolean }) {
  return (
    <div className="start-nav">
      {onBack ? <button className="linkbtn muted" onClick={onBack}>← Back</button> : <span />}
      {skip && <button className="linkbtn muted" onClick={onNext}>Skip</button>}
      <button className="linkbtn" onClick={onNext}>{label}</button>
    </div>
  );
}
