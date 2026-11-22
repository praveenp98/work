"use client";
import { useEffect, useState } from "react";

/**
 * Home: the change log, animated. Entries slide in one by one (who approved, where, the result a week later), the
 * first one's result flips from "checking" to "worked", then the "Before Rocco" read lands. Loops; static with
 * reduced motion. Example data, labelled as such.
 */
const ROWS = [
  { ic: "✂️", t: "Blocked “free yoga mat”", d: "Approved by Sam on iMessage · Nov 18", wait: "⏳ checking Nov 25", done: "✅ worked · $212/mo less wasted" },
  { ic: "📉", t: "Bid $1.20 → $0.95 on “bamboo sheets queen”", d: "Approved on the dashboard · Nov 20", wait: "⏳ checking Nov 27" },
  { ic: "🌱", t: "New exact campaign from 4 proven searches", d: "Approved in Slack · Nov 21", wait: "⏳ checking Nov 28" },
  { ic: "💰", t: "Budget $40 → $55 on “Sheets · Exact”", d: "Undone by you · Nov 21", wait: "↩️ reverted" },
];

export function LogDemo() {
  const [cycle, setCycle] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setStill(true); return; }
    const t = setInterval(() => setCycle((c) => c + 1), 11000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`ld${still ? " still" : ""}`} key={cycle} aria-label="Example change log">
      <div className="ld-head"><b>Change log</b><span>Bamboo &amp; Co · example</span></div>
      <ul>
        {ROWS.map((r, i) => (
          <li key={r.t} style={{ animationDelay: `${0.3 + i * 0.9}s` }}>
            <span className="ld-ic" aria-hidden>{r.ic}</span>
            <div><b>{r.t}</b><small>{r.d}</small></div>
            <em className={`ld-st${r.done ? " flip" : ""}`} style={r.done ? { animationDelay: `${0.3 + ROWS.length * 0.9 + 0.6}s` } : undefined}>
              {r.done ? <><span className="a">{r.wait}</span><span className="b">{r.done}</span></> : r.wait}
            </em>
          </li>
        ))}
      </ul>
      <p className="ld-past" style={{ animationDelay: `${0.3 + ROWS.length * 0.9 + 1.6}s` }}>🧠 <b>Before Rocco:</b> 214 changes in 90 days, 61% made by budget rules, no bid changed by hand since August. Starting with bids.</p>
    </div>
  );
}
