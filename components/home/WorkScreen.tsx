"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * "Watch me work": a small screen with this morning's four fixes on a sample brand. One at a time, a card lights
 * up, the Approve button gets tapped, and it flips to "Approved by Sam". Then it starts over.
 */
const FIXES = [
  { icon: "📦", what: "Send 340 units to FBA", why: "Kitchen Set Blue runs out in 9 days, right before Black Friday", value: "Saves ~$2,900 in lost sales", who: "Sam" },
  { icon: "✂️", what: "Cut 2 money-burning search terms", why: "41 clicks, 0 orders in 30 days", value: "+$63/mo", who: "Priya" },
  { icon: "📈", what: "Raise bid 12% on “bamboo cutting board”", why: "ACoS 18% against a 30% target. Room to grow", value: "+$210/mo sales", who: "Sam" },
  { icon: "🚨", what: "Fix suppressed listing", why: "Bamboo Board S: main image has a grey background", value: "Back on sale today", who: "Jen" },
];

export function WorkScreen() {
  const [t, setT] = useState(0); // 0..FIXES.length*2: even = card focused, odd = approved
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setT(FIXES.length * 2); return; }
    const id = setInterval(() => setT((x) => (x >= FIXES.length * 2 + 2 ? 0 : x + 1)), 1300);
    return () => clearInterval(id);
  }, []);
  const done = Math.min(Math.floor((t + 1) / 2), FIXES.length);
  const focus = t < FIXES.length * 2 ? Math.floor(t / 2) : -1;

  return (
    <div className="ws" aria-label="Sample of Rocco's morning on a sample brand">
      <div className="ws-bar" aria-hidden><span /><span /><span /></div>
      <div className="ws-head">
        <span className="ws-av"><svg width="30" height="25" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="ws" /></svg></span>
        <div>
          <b>Good morning, Sam.</b>
          <small>4 fixes today · worth ~$3,200</small>
        </div>
        <span className="ws-count">{done}/4</span>
      </div>
      <ul className="ws-list">
        {FIXES.map((f, i) => {
          const ok = i < done;
          return (
            <li key={f.what} className={`${ok ? "ok" : ""}${i === focus && !ok ? " focus" : ""}`}>
              <span className="ws-ic" aria-hidden>{f.icon}</span>
              <div className="ws-main">
                <b>{f.what}</b>
                <small>{f.why}</small>
                <span className="ws-val">{f.value}</span>
              </div>
              <span className={`ws-btn${ok ? " ok" : ""}${i === focus && !ok ? " press" : ""}`}>{ok ? `✓ ${f.who}` : "Approve"}</span>
            </li>
          );
        })}
      </ul>
      <p className="ws-foot">Sample brand · nothing changes until your team approves</p>
    </div>
  );
}
