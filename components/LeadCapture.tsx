"use client";
import { useState, type ReactNode } from "react";
import { track } from "@/lib/track";
import styles from "./LeadCapture.module.css";

/**
 * Email capture for a lead magnet.
 *
 *   <LeadCapture leadMagnet="bfcm-checklist-2026" downloadUrl="/downloads/bfcm-checklist-2026.pdf" />
 *   <LeadCapture leadMagnet="acos-result" cta="Show my result">{result}</LeadCapture>
 *
 * The download (or the children) shows right after submit, whether or not the consent box is ticked, and even
 * if saving the email failed: the reader asked for the thing, they get the thing. The consent box starts unticked.
 * Saves through POST /api/leads; the first-touch source is read there from the cookie lib/track.ts sets.
 */
export const CONSENT_LABEL = "send me rocco's amazon tips and product emails. unsubscribe anytime.";
const MARKETPLACES = ["US", "UK", "EU", "Canada", "India", "Japan", "Australia", "Other"];

interface Props {
  leadMagnet: string;
  /** File to hand over after submit. */
  downloadUrl?: string;
  downloadLabel?: string;
  title?: string;
  cta?: string;
  /** Ask which marketplace they sell on (optional for the reader). Default on. */
  askMarketplace?: boolean;
  /** Shown after submit, under the download link: a result, next steps, anything. */
  children?: ReactNode;
}

export function LeadCapture({ leadMagnet, downloadUrl, downloadLabel = "Download the PDF", title, cta = "Get it now", askMarketplace = true, children }: Props) {
  const [email, setEmail] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, marketplace: marketplace || undefined, consent, leadMagnet, page: location.pathname, website }) }).catch(() => null);
    if (res?.status === 400) { setNote("That email doesn't look right."); setState("idle"); return; }
    if (res?.ok) track("lead_captured", { magnet: leadMagnet });
    setNote("");
    setState("done");
  }

  if (state === "done") {
    return (
      <div className={`${styles.box} ${styles.done}`} role="status" data-lead-done>
        <p className={styles.title}>Here you go.</p>
        {downloadUrl && <a className="btn" href={downloadUrl} download data-lead-download>{downloadLabel} ↓</a>}
        {children}
        <p className="fine">{consent ? "You'll get my Amazon tips too. Every email has an unsubscribe link." : "No emails from me: you didn't tick the box."}</p>
      </div>
    );
  }
  return (
    <form className={styles.box} onSubmit={submit} data-lead-form={leadMagnet}>
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.row}>
        <label htmlFor={`lead-email-${leadMagnet}`}>Your email</label>
        <input id={`lead-email-${leadMagnet}`} type="email" required autoComplete="email" placeholder="you@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {askMarketplace && (
        <div className={styles.row}>
          <label htmlFor={`lead-mp-${leadMagnet}`}>Where you sell (optional)</label>
          <select id={`lead-mp-${leadMagnet}`} value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
            <option value="">Pick a marketplace</option>
            {MARKETPLACES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}
      <label className={styles.consent}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{CONSENT_LABEL}</span>
      </label>
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className={styles.hp} aria-hidden="true">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <button className={`btn ${styles.cta}`} disabled={state === "sending"}>{state === "sending" ? "One moment…" : `${cta} →`}</button>
      {note && <p className={styles.err} role="alert">{note}</p>}
      <p className="fine" style={{ margin: 0 }}>You get it right away, ticked or not. <a href="/privacy">Privacy</a>.</p>
    </form>
  );
}
