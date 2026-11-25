"use client";
import { money, toUsd, USD, type Currency } from "@/lib/currency";
import { useEffect, useRef, useState } from "react";

/**
 * What Rocco is worth (Nov 25 fix list #1, #2): leads with value MEASURED in the last 30 days, compared with the price
 * of the plan this account is actually on. Estimates waiting for approval are shown smaller, never as the headline.
 * Below 1× it says why (healthy ACoS, small spend) instead of hiding it.
 */
export function RoiCard({ realized, realizedMeasured, found, costMonthly, plan, acos, target, adSpend, cur = USD }: {
  realized: number; realizedMeasured: number; found: number; costMonthly: number; plan: "annual" | "monthly";
  acos: number | null; target: number; adSpend: number | null; cur?: Currency;
}) {
  const n = useCountUp(realized);
  const $ = (v: number) => money(v, cur);
  const usd = (v: number) => money(v);
  const multiple = toUsd(realized, cur) / costMonthly;
  const fill = Math.min(100, (multiple / Math.max(multiple, 3)) * 100);
  if (realized <= 0 && found <= 0) return null;

  const why: string[] = [];
  if (acos !== null && acos <= target) why.push(`your ACoS (${acos}%) is already under your ${target}% target, so there's less waste to cut`);
  if (adSpend !== null && toUsd(adSpend, cur) < 3000) why.push(`ad spend is ${$(adSpend)} a month, so each fix moves fewer dollars`);
  const planLabel = plan === "annual" ? "yearly plan" : "monthly plan";

  return (
    <section className={`roi${multiple >= 1 ? " paid-off" : ""}`} aria-label="What Rocco is worth to you">
      <div className="roi-main">
        <span className="roi-k">Earned for you · last 30 days</span>
        {realized > 0 ? (
          <>
            <b className="roi-v">{$(n)}</b>
            <span className="roi-sub">{realizedMeasured >= realized ? "measured: before vs after each change" : `${$(realizedMeasured)} measured, the rest estimated spend avoided`}</span>
          </>
        ) : (
          <>
            <b className="roi-v roi-none">Nothing measured yet</b>
            <span className="roi-sub">I measure every change 7 days after it&apos;s made. Approve a fix and the first result shows here.</span>
          </>
        )}
        {found > 0 && <span className="roi-est">+ ~{$(found)}/mo more in fixes waiting for you (estimate)</span>}
      </div>
      <div className="roi-side">
        {realized > 0 ? (
          <>
            <span className="roi-x">{multiple >= 1 ? `${multiple >= 10 ? Math.round(multiple) : multiple.toFixed(1)}×` : `${Math.round(multiple * 100)}%`}</span>
            <span className="roi-xl">{multiple >= 1 ? "my price this month" : "of my price this month"}</span>
            <div className="roi-meter" aria-hidden><i style={{ width: `${fill}%` }} /><span style={{ left: `${(1 / Math.max(multiple, 3)) * 100}%` }} /></div>
          </>
        ) : <span className="roi-xl">Goal: earn at least 2× my price within 30 days.</span>}
        <span className="roi-cost">I cost {usd(costMonthly)}/mo ({planLabel})</span>
        {realized > 0 && multiple < 1 && <span className="roi-why">Below my price so far{why.length ? `: ${why.join("; ")}.` : "."} Approving the waiting fixes is what moves this.</span>}
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
