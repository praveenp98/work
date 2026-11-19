"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * Boardy-style bottom sheet: "Hire Rocco". Step 1 email (the account), step 2 checkout. Opens when `open` turns true,
 * closable with "Maybe later". No free plan, so this is the gate to using Rocco.
 */
export function TrialSheet({ url, price, open, found, onClose, onStart, next, google }: { url?: string; price: string; open: boolean; found?: string; onClose?: () => void; onStart?: (email: string) => Promise<void>; next?: string; google?: boolean }) {
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
        {google ? (
          <>
            <a className="btn sheet-btn google-btn" href="/api/auth/google?intent=hire" rel="nofollow" onClick={() => setBusy(true)}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              {busy ? "Opening Google…" : "Continue with Google"}
            </a>
            <p className="fine sheet-step">Sign up, connect your Amazon, and see my first real finding free. Pay only after that.</p>
          </>
        ) : onStart ? (
          <form className="sheet-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onStart(email.trim()); setBusy(false); }}>
            <label htmlFor="hire-email">Your work email</label>
            <input id="hire-email" type="email" required autoComplete="email" placeholder="you@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn sheet-btn" disabled={busy}>{busy ? "Opening checkout…" : "Start with your account →"}</button>
          </form>
        ) : <a className="btn sheet-btn" href={url}>Hire Rocco · {price}</a>}
        <p className="fine">Then {price} for your first 3 months, $249 every 3 months after. Whole team, cancel anytime.</p>
        <button className="linkbtn sheet-later" onClick={close}>Maybe later</button>
      </div>
    </div>
  );
}
