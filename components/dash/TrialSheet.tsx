"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * Boardy-style bottom sheet: "Start your 3-day free trial". Opens when `open` turns true (after the setup steps),
 * closable with "Maybe later". No free plan, so this is the gate to using Rocco.
 */
export function TrialSheet({ url, price, open, found, onClose, onStart }: { url?: string; price: string; open: boolean; found?: string; onClose?: () => void; onStart?: () => Promise<void> }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setShow(open); }, [open]);
  if (!show) return null;
  const close = () => { setShow(false); onClose?.(); };
  return (
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-label="Start your free trial" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="sheet">
        <span className="sheet-grab" aria-hidden />
        <button className="sheet-x" aria-label="Close" onClick={close}>×</button>
        <div className="sheet-who">
          <span className="stage-av"><svg width="30" height="25" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="sheet" /></svg></span>
          <div><b>ROCCO</b><small>Your AI Amazon manager</small></div>
        </div>
        <h2>{found ? `I found ${found}. Let me fix it.` : "Turn me on for your team."}</h2>
        <ul className="sheet-list">
          <li>Every fix, approved with a reply: ads, Seller Central, stock, listings</li>
          <li>Morning numbers by text and Slack, for the whole team</li>
          <li>I check every change a week later and keep score</li>
        </ul>
        {onStart
          ? <button className="btn sheet-btn" disabled={busy} onClick={async () => { setBusy(true); await onStart(); }}>{busy ? "Opening checkout…" : "Start my 3-day free trial"}</button>
          : <a className="btn sheet-btn" href={url}>Start my 3-day free trial</a>}
        <p className="fine">Then {price}/year for your whole team. I&apos;ll text you before you&apos;re charged. Reply CANCEL anytime.</p>
        <button className="linkbtn sheet-later" onClick={close}>Maybe later</button>
      </div>
    </div>
  );
}
