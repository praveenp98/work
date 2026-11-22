"use client";
import { useEffect, useState } from "react";
import { PLAN } from "@/lib/pricing";
import { urgencyLine } from "@/lib/urgency";

/**
 * The paywall's case, all honest: a calculator on the seller's own ad spend (an illustration at 5% waste cut, stated
 * as such), real proof from a real account, a real calendar deadline, and the hire count once it's worth showing.
 */
const STEPS = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000, 100000];
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function Urgency() {
  const [u, setU] = useState<ReturnType<typeof urgencyLine>>(null);
  useEffect(() => setU(urgencyLine()), []);
  return u ? <p className="vc-urgent"><span aria-hidden>⏳</span> {u.text}</p> : null;
}

export function ValueCalc({ plan = "annual", compact }: { plan?: "annual" | "monthly"; compact?: boolean }) {
  const [i, setI] = useState(3);
  const [sold, setSold] = useState(0);
  useEffect(() => { fetch("/api/price").then((r) => r.json()).then((s) => setSold(Number(s?.sold) || 0)).catch(() => {}); }, []);
  const spend = STEPS[i];
  const back = spend * 0.05;
  const cost = plan === "annual" ? PLAN.annualCents / 1200 : PLAN.monthlyCents / 100;
  const x = back / cost;
  return (
    <div className={`vc${compact ? " compact" : ""}`}>
      <label className="vc-q" htmlFor="vc-spend">Your monthly ad spend <b>{$(spend)}{i === STEPS.length - 1 ? "+" : ""}</b></label>
      <input id="vc-spend" type="range" min={0} max={STEPS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-valuetext={$(spend)} />
      <p className="vc-a">Cut just 5% of waste and that&apos;s <b>{$(back)}/mo</b> back. I cost {$(cost)}/mo{x >= 1 ? <> → <b className="vc-x">{x >= 10 ? Math.round(x) : x.toFixed(1)}× my price</b></> : null}.</p>
      {sold >= 5 && <p className="vc-proof">✅ {sold} brands have hired me.</p>}
    </div>
  );
}
