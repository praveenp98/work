"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { DRPPC, ROCCO, yearlyAt } from "@/lib/competitors";

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const STEPS = [2000, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 250000];

/** "What a %-of-ad-spend tool costs you vs Rocco": one slider, two bars, the difference per year. */
export function SpendCompare({ title = "The more you spend, the more they charge." }: { title?: string }) {
  const [i, setI] = useState(2);
  const spend = STEPS[i];
  const y = yearlyAt(spend);
  const max = Math.max(y.drppc, y.rocco);
  return (
    <div className="sc">
      <h3>{title}</h3>
      <label className="sc-l" htmlFor="sc-spend">Your monthly Amazon ad spend: <b>{$(spend)}</b></label>
      <input id="sc-spend" type="range" min={0} max={STEPS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} onPointerUp={() => track("spend_compare", { spend })} aria-valuetext={$(spend)} />
      <div className="sc-bars">
        <div className="sc-row"><span>{DRPPC.name}<small>$299/mo + 2% of ad spend</small></span><i style={{ width: `${(y.drppc / max) * 100}%` }} className="them" /><b>{$(y.drppc)}/yr</b></div>
        <div className="sc-row"><span>Rocco<small>flat, any spend</small></span><i style={{ width: `${(y.rocco / max) * 100}%` }} className="us" /><b>{$(y.rocco)}/yr</b></div>
      </div>
      <p className="sc-out">{y.saved > 0 ? <>You keep <b>{$(y.saved)} a year</b> with Rocco: {y.times.toFixed(1)}× cheaper, and it never grows with your ad spend.</> : <>About the same at this spend. Rocco stays flat as you grow.</>}</p>
      <p className="fine">Rocco yearly plan ({$(ROCCO.annual)}/yr, or {$(ROCCO.monthly)} monthly). {DRPPC.name} price from {DRPPC.url.replace("https://", "")}, {DRPPC.checked}.</p>
    </div>
  );
}
