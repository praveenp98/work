"use client";
import { useEffect, useState } from "react";
import { BrandLogo, type LogoApp } from "@/components/BrandLogo";

/**
 * Above-the-fold promise, animated: connect once → I find what to fix → you approve (on your dashboard, iMessage,
 * WhatsApp or Slack, rotating) → I make it in Amazon. Steps light up in turn; the approve step shows a "YES" reply.
 * Plain text for screen readers; static (all steps shown) with reduced motion.
 */
// Short names so every step stays on one line on a phone (the reply chip sits on the right of step 3 only).
const CHANNELS: { app: LogoApp; pre: string; name: string; reply: string }[] = [
  { app: "imessage", pre: "in", name: "iMessage", reply: "YES" },
  { app: "whatsapp", pre: "in", name: "WhatsApp", reply: "YES" },
  { app: "slack", pre: "in", name: "Slack", reply: "yes 👍" },
  { app: "web", pre: "on", name: "the web", reply: "Approve" },
];
const STEP_MS = 1100; // steps light up in turn
const CH_MS = 1300; // the approve channel rotates on its own clock, so every app shows within ~5 s

export function HeroFlow() {
  const [step, setStep] = useState(0); // 0..3 active step, 4 = all done (pause)
  const [ch, setCh] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setStill(true); setStep(4); return; }
    const t = setInterval(() => setStep((s) => (s >= 4 ? 0 : s + 1)), STEP_MS);
    const u = setInterval(() => setCh((c) => (c + 1) % CHANNELS.length), CH_MS);
    return () => { clearInterval(t); clearInterval(u); };
  }, []);
  const c = CHANNELS[ch];
  const cls = (i: number) => (step === i ? "on" : step > i ? "done" : "");

  return (
    <div className="hf" aria-label="How Rocco works">
      <p className="sr-only">Connect Seller Central and Amazon Ads once. Every morning I find what to fix. You approve on the web, iMessage, WhatsApp or Slack. I make the change in Amazon, then check it worked.</p>
      <ol aria-hidden>
        <li className={cls(0)}><span className="hf-ic">🔌</span><span className="hf-t">Connect Seller Central + Ads <b>once</b></span></li>
        <li className={cls(1)}><span className="hf-ic">☀️</span><span className="hf-t">Every morning I find <b>what to fix</b></span></li>
        <li className={`hf-approve ${cls(2)}`}>
          <span className="hf-ic hf-logo" key={`i${ch}`}>{still ? "👍" : <BrandLogo app={c.app} size={22} />}</span>
          <span className="hf-t">{still ? <>You approve on <b>the web, iMessage, WhatsApp or Slack</b></> : <>You approve {c.pre} <b className="hf-ch" key={ch}>{c.name}</b></>}</span>
          {!still && <em className="hf-bub" key={`b${ch}`}>{c.reply}</em>}
        </li>
        <li className={cls(3)}><span className="hf-ic">{!still && step >= 3 ? "✅" : "🛠️"}</span><span className="hf-t">I make it live, <b>then check it worked</b></span></li>
      </ol>
    </div>
  );
}
