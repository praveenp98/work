"use client";
import { useEffect, useState } from "react";

/**
 * Above-the-fold promise, animated: connect once → I find what to fix → you approve (on your dashboard, iMessage,
 * WhatsApp or Slack, rotating) → I make it in Amazon. Steps light up in turn; the approve step shows a "YES" reply.
 * Plain text for screen readers; static (all steps shown) with reduced motion.
 */
const CHANNELS = [
  { ic: "🖥️", name: "your dashboard", reply: "Approve" },
  { ic: "💬", name: "iMessage", reply: "YES" },
  { ic: "🟢", name: "WhatsApp", reply: "YES" },
  { ic: "#️⃣", name: "Slack", reply: "yes 👍" },
];
const STEP_MS = 1500;

export function HeroFlow() {
  const [step, setStep] = useState(0); // 0..3 active step, 4 = all done (pause)
  const [ch, setCh] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setStill(true); setStep(4); return; }
    const t = setInterval(() => setStep((s) => {
      if (s >= 4) { setCh((c) => (c + 1) % CHANNELS.length); return 0; }
      return s + 1;
    }), STEP_MS);
    return () => clearInterval(t);
  }, []);
  const c = CHANNELS[ch];
  const cls = (i: number) => (step === i ? "on" : step > i ? "done" : "");

  return (
    <div className="hf" aria-label="How Rocco works">
      <p className="sr-only">Connect Seller Central and Amazon Ads once. Every morning I find what to fix. You approve on your dashboard, iMessage, WhatsApp or Slack. I make the change in Amazon and check it worked.</p>
      <ol aria-hidden>
        <li className={cls(0)}><span className="hf-ic">🔌</span><span>Connect Seller Central + Ads <b>once</b></span><span className="hf-slot" /></li>
        <li className={cls(1)}><span className="hf-ic">☀️</span><span>Every morning I find <b>what to fix</b></span><span className="hf-slot" /></li>
        <li className={`hf-approve ${cls(2)}`}>
          <span className="hf-ic">👍</span>
          <span>You approve in <b className="hf-ch" key={still ? "all" : ch}>{still ? "your dashboard, iMessage, WhatsApp or Slack" : <>{c.ic} {c.name}</>}</b></span>
          <span className="hf-slot">{!still && step >= 2 && <em className="hf-bub" key={`b${ch}`}>{c.reply}</em>}</span>
        </li>
        <li className={cls(3)}><span className="hf-ic">✅</span><span>I make it in Amazon <b>and check it worked</b></span><span className="hf-slot">{!still && step >= 3 && <em className="hf-done" key={`d${ch}`}>Done ✓</em>}</span></li>
      </ol>
    </div>
  );
}
