"use client";
import Link from "next/link";
import { useState } from "react";

const STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000];
const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Instant aha with no file: what a given waste % costs per year, and how fast Rocco pays for itself. */
export function LeakEstimator() {
  const [i, setI] = useState(4);
  const [pct, setPct] = useState(20);
  const spend = STEPS[i];
  const monthly = (spend * pct) / 100;
  const yearly = monthly * 12;
  const payback = monthly > 0 ? Math.max(1, Math.ceil(299 / (monthly / 30))) : null;
  return (
    <div className="estimator">
      <div className="est-inputs">
        <label>
          <span>Your monthly Amazon ad spend</span>
          <b className="est-val">{fmt(spend)}{i === STEPS.length - 1 ? "+" : ""}</b>
          <input type="range" min={0} max={STEPS.length - 1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-label="Monthly ad spend" />
        </label>
        <label>
          <span>Guess how much of it is wasted</span>
          <b className="est-val">{pct}%</b>
          <input type="range" min={5} max={50} step={1} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label="Wasted percent" />
        </label>
        <p className="fine">Just a guess. Your real number comes from the free roast, in 2 minutes.</p>
      </div>
      <div className="est-out">
        <span className="eyebrow">That&apos;s a raccoon-sized snack of</span>
        <div className="est-big">{fmt(yearly)}<small>/year</small></div>
        <ul>
          <li><b>{fmt(monthly)}</b> every month, on clicks that never buy</li>
          <li><b>{fmt(monthly / 30)}</b> gone every single day</li>
          {payback && <li>Rocco Pro would pay for itself in <b>{payback} day{payback === 1 ? "" : "s"}</b></li>}
        </ul>
        <Link href="/tools/ad-roast?utm_source=home&utm_medium=estimator" className="btn">Find my real number →</Link>
      </div>
    </div>
  );
}
