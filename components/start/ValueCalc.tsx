"use client";
import { useEffect, useState } from "react";
import { PLAN } from "@/lib/pricing";
import { urgencyLine } from "@/lib/urgency";

/**
 * The price case a manager gets in one glance: what it costs to have someone run your ads (an agency at ~15% of ad
 * spend, most with a $500/mo minimum: a typical range, stated as such) next to Rocco's price, on their own ad spend.
 * Plus a real calendar deadline and the hire count once it's worth showing. No made-up savings.
 */
const STEPS = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000, 100000];
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const agencyFee = (spend: number) => Math.max(500, spend * 0.15);

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
  const agency = agencyFee(spend);
  const cost = plan === "annual" ? PLAN.annualCents / 1200 : PLAN.monthlyCents / 100;
  const pct = Math.max(5, Math.round((cost / agency) * 100));
  return (
    <div className={`vc${compact ? " compact" : ""}`}>
      <label className="vc-q" htmlFor="vc-spend">Your monthly ad spend <b>{$(spend)}{i === STEPS.length - 1 ? "+" : ""}</b></label>
      <input id="vc-spend" type="range" min={0} max={STEPS.length - 1} step={1} value={i} onChange={(e) => setI(Number(e.target.value))} aria-valuetext={$(spend)} />
      <p className="vc-t">To have your ads managed every day</p>
      <div className="vc-bars" aria-live="polite">
        <div className="vc-bar"><span>Ads agency</span><i><s style={{ width: "100%" }} /></i><b>{$(agency)}/mo</b></div>
        <div className="vc-bar me"><span>Rocco</span><i><s style={{ width: `${pct}%` }} /></i><b>{$(cost)}/mo</b></div>
      </div>
      <p className="vc-note">Agencies usually charge 10–20% of ad spend, most with a $500/mo minimum, and look at your account once a week. I look every morning.</p>
      {sold >= 5 && <p className="vc-proof">✅ {sold} brands have hired me.</p>}
    </div>
  );
}
