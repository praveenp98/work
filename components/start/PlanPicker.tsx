"use client";
import { useState } from "react";
import { PriceRise, ValueCalc } from "@/components/start/ValueCalc";

/**
 * Step 2 of hiring (after Google sign-up): pick yearly or monthly, then secure checkout. Both cards share the same
 * rows (tag, price, line) so they line up.
 */
export function PlanPicker({ annualUrl, monthlyUrl }: { annualUrl: string; monthlyUrl: string }) {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const [busy, setBusy] = useState(false);
  const url = plan === "annual" ? annualUrl : monthlyUrl;
  const ready = /dodopayments\.com/.test(url); // no product set yet: never send people to a wrong or looping page
  return (
    <div className="pp">
      <div className="pp-plans" role="radiogroup" aria-label="Plan">
        <button type="button" role="radio" aria-checked={plan === "annual"} className={plan === "annual" ? "on" : ""} onClick={() => setPlan("annual")}>
          <span className="pp-tag best">2 months free</span>
          <b>$1,190<small>/year</small></b>
          <span className="pp-line">$99/mo billed yearly</span>
        </button>
        <button type="button" role="radio" aria-checked={plan === "monthly"} className={plan === "monthly" ? "on" : ""} onClick={() => setPlan("monthly")}>
          <span className="pp-tag">Flexible</span>
          <b>$119<small>/month</small></b>
          <span className="pp-line">billed monthly</span>
        </button>
      </div>
      <PriceRise />
      <ValueCalc plan={plan} compact />
      {ready ? (
        <a className="btn rc-btn" href={url} onClick={() => setBusy(true)}>
          {busy ? "Opening secure checkout…" : plan === "annual" ? "Continue · $1,190 a year →" : "Continue · $119 a month →"}
        </a>
      ) : <p className="tm-err" role="status">Checkout is being switched on right now. Please try again in a few minutes, or email hello@rocco.works.</p>}
      <p className="pp-guarantee">🛡️ <b>30-day money-back guarantee.</b> If you don&apos;t like the fixes I give you, ask for your money back. {plan === "annual" ? "Renews yearly, cancel the renewal anytime." : "Cancel anytime."}</p>
    </div>
  );
}
