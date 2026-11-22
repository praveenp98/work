"use client";
import { money, toUsd, USD, type Currency } from "@/lib/currency";
import { useEffect, useRef, useState } from "react";

/**
 * The card that keeps people: what Rocco earned the business vs what he costs. Counts up once when it comes into
 * view (skipped with reduced motion). Two states:
 *  - earned: "$X saved so far · N× what I cost" + a meter that fills past "paid for myself"
 *  - early:  "~$X/mo found · I cost $99/mo" (found, not yet saved; says so)
 */
export function RoiCard({ saved, measured, found, costMonthly, costSoFar, plan, cur = USD }: { saved: number; measured: number; found: number; costMonthly: number; costSoFar: number; plan: "annual" | "monthly"; cur?: Currency }) {
  const earned = saved > 0;
  const target = earned ? saved : found;
  const n = useCountUp(target);
  // Savings are in the account's currency, Rocco's price in USD: compare in USD (approximate for non-US accounts).
  const multiple = earned ? toUsd(saved, cur) / Math.max(costSoFar, costMonthly) : toUsd(found, cur) / costMonthly;
  const fill = Math.min(100, (multiple / Math.max(multiple, 3)) * 100);
  const $ = (v: number) => money(v, cur);
  const usd = (v: number) => money(v);
  if (!earned && found <= 0) return null;
  return (
    <section className={`roi${multiple >= 1 ? " paid-off" : ""}`} aria-label="What Rocco is worth to you">
      <div className="roi-main">
        <span className="roi-k">{earned ? "Rocco has saved you" : "Rocco found you"}</span>
        <b className="roi-v">{earned ? $(n) : `~${$(n)}`}<small>{earned ? " so far" : " a month"}</small></b>
        <span className="roi-sub">{earned ? (measured >= saved ? "measured before vs after" : `${$(measured)} measured, the rest estimated spend avoided`) : "in fixes waiting for your approval"}</span>
      </div>
      <div className="roi-side">
        <span className="roi-x">{multiple >= 1 ? `${multiple >= 10 ? Math.round(multiple) : multiple.toFixed(1)}×` : `${Math.round(multiple * 100)}%`}</span>
        <span className="roi-xl">{multiple >= 1 ? "what I cost you" : "of my price, so far"}</span>
        <div className="roi-meter" aria-hidden><i style={{ width: `${fill}%` }} /><span style={{ left: `${(1 / Math.max(multiple, 3)) * 100}%` }} /></div>
        <span className="roi-cost">I cost {usd(costMonthly)}/mo{plan === "annual" ? " (yearly plan)" : ""}</span>
      </div>
    </section>
  );
}

function useCountUp(to: number, ms = 1100): number {
  const [v, setV] = useState(to);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || to <= 0) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(to * (1 - Math.pow(1 - k, 3))); // ease-out
      if (k < 1) raf = requestAnimationFrame(step); else done.current = true;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setV(to); }; // never left stuck mid-count
  }, [to, ms]);
  return v;
}
