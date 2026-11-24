"use client";
import { useEffect, useState } from "react";

/**
 * Homepage hero visual: Rocco's dashboard on a sample account, the way it really works now. Today's work as jobs
 * (not single tweaks), approved one by one: Approve → "Making it in Amazon…" → "✓ Done". The savings strip on top.
 * Labeled as a sample.
 */
const JOBS = [
  { ic: "✂️", t: "Block 6 searches that waste money", d: "Clicks, no orders. “free cutting board”, “plastic mat” +4", v: "~$310/mo", btn: "Approve all 6", making: "Making 6 changes…", done: "✓ Done · 6 changes", pick: true },
  { ic: "🌱", t: "New exact campaign: 3 proven searches", d: "Already selling at 14% ACoS. Own campaign, own budget.", v: "+$420/mo", btn: "Create campaign", making: "Creating in Amazon…", done: "✓ Campaign live" },
  { ic: "💰", t: "Raise 2 budgets on profitable campaigns", d: "Out of budget by 2 PM at 19% ACoS.", v: "+$510/mo", btn: "Approve all 2", making: "Making 2 changes…", done: "✓ Done · 2 changes" },
];
const STEP = 3; // open → press → making → done

export function HeroDashboard() {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setT(JOBS.length * STEP); return; }
    const id = setInterval(() => setT((x) => (x >= JOBS.length * STEP + 3 ? 0 : x + 1)), 950);
    return () => clearInterval(id);
  }, []);
  const state = (i: number) => { const s = t - i * STEP; return s < 1 ? "open" : s < 2 ? "press" : s < 3 ? "making" : "done"; };
  const done = JOBS.filter((_, i) => state(i) === "done").length;

  return (
    <div className="hd" aria-label="Sample of Rocco's dashboard">
      <div className="hd-chrome" aria-hidden><span /><span /><span /><em>rocco.works</em></div>
      <div className="hd-body">
        <div className="hd-acct"><i /> <b>Bamboo &amp; Co · US</b><small>checked 6:02 AM</small></div>
        <p className="hd-kicker">Good morning</p>
        <h3 className="hd-h">4 jobs today, worth <em>~$1,240/mo</em>.</h3>
        <p className="hd-brief">Two searches are burning money with no orders. Cut them before Black Friday.</p>
        <div className="hd-roi"><span>Rocco has saved you</span><b>$1,284</b><em>13× what I cost</em></div>
        <ul className="hd-list">
          {JOBS.map((j, i) => {
            const s = state(i);
            return (
              <li key={j.t} className={`hd-fix s-${s}`}>
                <span className="hd-ic" aria-hidden>{j.ic}</span>
                <div className="hd-main">
                  <b>{j.t}{j.pick && <span className="hd-pick">Rocco&apos;s pick</span>}</b>
                  <small>{j.d}</small>
                </div>
                <span className="hd-v">{j.v}</span>
                <span className="hd-btn">{s === "done" ? j.done : s === "making" ? j.making : j.btn}</span>
              </li>
            );
          })}
          <li className="hd-fix s-open hd-manual">
            <span className="hd-ic" aria-hidden>🚚</span>
            <div className="hd-main"><b>Restock 1 product before it runs out</b><small>Cutting Board Large: 11 days of stock left</small></div>
            <span className="hd-btn ghost">Show me how</span>
          </li>
        </ul>
        <p className="hd-foot">{done ? `${done} of ${JOBS.length + 1} jobs done in Amazon · I'll check the results next week` : "Sample account · nothing changes until you approve"}</p>
      </div>
    </div>
  );
}
