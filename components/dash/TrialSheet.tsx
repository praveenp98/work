"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * Boardy-style bottom sheet: "Hire Rocco". Step 1 email (the account), step 2 checkout. Opens when `open` turns true,
 * closable with "Maybe later". No free plan, so this is the gate to using Rocco.
 */
export function TrialSheet({ url, price, open, found, onClose, onStart, next }: { url?: string; price: string; open: boolean; found?: string; onClose?: () => void; onStart?: (email: string) => Promise<void>; next?: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => { setShow(open); }, [open]);
  if (!show) return null;
  const close = () => { setShow(false); onClose?.(); };
  return (
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-label="Hire Rocco" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
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
        {onStart ? (
          <form className="sheet-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onStart(email.trim()); setBusy(false); }}>
            <label htmlFor="hire-email">Your work email</label>
            <input id="hire-email" type="email" required autoComplete="email" placeholder="you@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn sheet-btn" disabled={busy}>{busy ? "Opening checkout…" : `Continue to payment · ${price}/year`}</button>
          </form>
        ) : <a className="btn sheet-btn" href={url}>Hire Rocco · {price}/year</a>}
        <p className="fine">{price}/year for your whole team.{next ? ` The price goes up $10 with every hire: the next one pays ${next}.` : ""} Then set me up in 2 minutes.</p>
        <button className="linkbtn sheet-later" onClick={close}>Maybe later</button>
      </div>
    </div>
  );
}
