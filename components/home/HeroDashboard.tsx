"use client";
import { useEffect, useState } from "react";

/**
 * Homepage hero visual: Rocco's dashboard on a sample account. Fixes get approved one by one: Approve → "Making it
 * in Amazon…" → "✓ Done in Amazon". Labeled as a sample.
 */
const FIXES = [
  { ic: "✂️", t: "Cut a money-burner", d: "“plastic chopping mat” · 64 clicks, 0 orders", sure: 99, v: "~$91/mo" },
  { ic: "📈", t: "Raise a bid on a winner", d: "“bamboo cutting board” · ACoS 18% vs 30% target", sure: 92, v: "+$210/mo" },
  { ic: "🌱", t: "Promote a winner to exact", d: "“cutting board set” · 6 orders at 14% ACoS", sure: 88, v: "+$120/mo" },
];

export function HeroDashboard() {
  const [t, setT] = useState(0); // 0..9: 3 phases per fix, then a pause
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setT(9); return; }
    const id = setInterval(() => setT((x) => (x >= 11 ? 0 : x + 1)), 900);
    return () => clearInterval(id);
  }, []);
  const state = (i: number) => {
    const s = t - i * 3;
    return s < 1 ? "open" : s < 2 ? "press" : s < 3 ? "making" : "done";
  };
  const done = FIXES.filter((_, i) => state(i) === "done").length;

  return (
    <div className="hd" aria-label="Sample of Rocco's dashboard">
      <div className="hd-chrome" aria-hidden><span /><span /><span /><em>rocco.works</em></div>
      <div className="hd-body">
        <div className="hd-acct"><i /> <b>Bamboo &amp; Co · US</b><small>checked 6:02 AM</small></div>
        <p className="hd-kicker">Good morning</p>
        <h3 className="hd-h">3 fixes worth <em>~$421/mo</em>.</h3>
        <div className="hd-kpis">
          <div><span>Ad spend</span><b>$1,570</b><small className="good">▼ 6%</small></div>
          <div><span>Ad sales</span><b>$5,307</b><small className="good">▲ 9%</small></div>
          <div><span>Wasted / mo</span><b>$392</b><small className="good">▼ 18%</small></div>
        </div>
        <ul className="hd-list">
          {FIXES.map((f, i) => {
            const s = state(i);
            return (
              <li key={f.t} className={`hd-fix s-${s}`}>
                <span className="hd-ic" aria-hidden>{f.ic}</span>
                <div className="hd-main">
                  <b>{f.t}</b>
                  <small>{f.d}</small>
                  <span className="hd-sure"><i style={{ width: `${f.sure}%` }} /></span>
                </div>
                <span className="hd-v">{f.v}</span>
                <span className="hd-btn">{s === "done" ? "✓ Done in Amazon" : s === "making" ? "Making it…" : "Approve"}</span>
              </li>
            );
          })}
        </ul>
        <p className="hd-foot">{done ? `${done} of 3 made in Amazon · I'll check the results next week` : "Sample account · nothing changes until you approve"}</p>
      </div>
    </div>
  );
}
