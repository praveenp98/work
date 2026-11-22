"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RoccoHead } from "@/components/Rocco";
import { LoadingText } from "@/components/LoadingText";
import { Urgency } from "@/components/start/ValueCalc";

/**
 * Boardy-style bottom sheet: "Hire Rocco", step 1 = create the account (Google, or work email when Google is off).
 * No prices here: the plan is picked on the next screen (HireCard), right before checkout. This sheet only answers
 * "what happens next?" and "is it safe?".
 */
const GOOGLE_G = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
);

export function TrialSheet({ url, price, open, found, onClose, onStart, google }: { url?: string; price: string; open: boolean; found?: string; onClose?: () => void; onStart?: (email: string) => Promise<void>; next?: string; google?: boolean }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => { setShow(open); }, [open]);
  if (!show) return null;
  const close = () => { setShow(false); onClose?.(); };
  // Rendered on <body>: inside the sticky bar (which animates with transform) a fixed sheet would be clipped.
  return createPortal((
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-label="Hire Rocco" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="sheet">
        <span className="sheet-grab" aria-hidden />
        <button className="sheet-x" aria-label="Close" onClick={close}>×</button>
        <div className="sheet-who">
          <span className="stage-av"><svg width="30" height="25" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="sheet" /></svg></span>
          <div><b>ROCCO</b><small>Real work without the fluff</small></div>
        </div>
        <h2>{found ? `I found ${found}. Let me fix it.` : "Hire Rocco."}</h2>
        <p className="sheet-sub">Your AI Amazon manager. Every morning I find what to fix, you approve, I make the change in Amazon.</p>
        <Urgency />
        <ol className="sheet-steps">
          <li className="now"><b>Sign up</b><span>10 seconds</span></li>
          <li><b>Pick a plan</b><span>7-day guarantee</span></li>
          <li><b>Connect Amazon</b><span>first jobs in hours</span></li>
        </ol>
        {google ? (
          <>
            <a className="btn sheet-btn google-btn" href="/api/auth/google?intent=hire" rel="nofollow" onClick={() => setBusy(true)}>
              {GOOGLE_G}{busy ? "Opening Google…" : "Continue with Google"}
            </a>
            {busy && <LoadingText steps={["Opening Google sign-in…", "Next: pick your plan", "Then: connect your Amazon"]} every={1600} />}
          </>
        ) : onStart ? (
          <form className="sheet-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onStart(email.trim()); setBusy(false); }}>
            <label htmlFor="hire-email">Your work email</label>
            <input id="hire-email" type="email" required autoComplete="email" placeholder="you@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn sheet-btn" disabled={busy}>{busy ? "One moment…" : "Continue →"}</button>
            {busy && <LoadingText steps={["Setting up your Rocco…", "Next: pick your plan"]} every={1500} />}
          </form>
        ) : <a className="btn sheet-btn" href={url}>Hire Rocco · {price}</a>}
        <ul className="sheet-trust">
          <li><span aria-hidden>🔒</span>Amazon&apos;s own sign-in. I never see your password.</li>
          <li><span aria-hidden>✋</span>Nothing changes in Amazon without your approval.</li>
          <li><span aria-hidden>↩︎</span>Every change is checked first, logged and undoable.</li>
          <li><span aria-hidden>🛡️</span>7-day money-back guarantee. Cancel anytime.</li>
        </ul>
        <button className="linkbtn sheet-later" onClick={close}>Maybe later</button>
      </div>
    </div>
  ), document.body);
}
