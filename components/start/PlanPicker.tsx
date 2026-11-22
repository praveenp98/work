"use client";
import { useState } from "react";
import { ValueCalc } from "@/components/start/ValueCalc";

/**
 * Step 2 of hiring (after Google sign-up): pick yearly or monthly, then secure checkout. Both cards share the same
 * rows (tag, price, line) so they line up.
 */
export function PlanPicker({ annualUrl, monthlyUrl }: { annualUrl: string; monthlyUrl: string }) {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const [busy, setBusy] = useState(false);
  return (
    <div className="pp">
      <div className="pp-plans" role="radiogroup" aria-label="Plan">
        <button type="button" role="radio" aria-checked={plan === "annual"} className={plan === "annual" ? "on" : ""} onClick={() => setPlan("annual")}>
          <span className="pp-tag best">2 months free</span>
          <b>$99<small>/mo</small></b>
          <span className="pp-line">$1,190 billed yearly</span>
        </button>
        <button type="button" role="radio" aria-checked={plan === "monthly"} className={plan === "monthly" ? "on" : ""} onClick={() => setPlan("monthly")}>
          <span className="pp-tag">Flexible</span>
          <b>$119<small>/mo</small></b>
          <span className="pp-line">billed monthly</span>
        </button>
      </div>
      <ValueCalc plan={plan} compact />
      <a className="btn rc-btn" href={plan === "annual" ? annualUrl : monthlyUrl} onClick={() => setBusy(true)}>
        {busy ? "Opening secure checkout…" : plan === "annual" ? "Continue · $1,190 a year →" : "Continue · $119 a month →"}
      </a>
      <p className="pp-guarantee">🛡️ <b>30-day money-back guarantee.</b> If you don&apos;t like the fixes I give you, ask for your money back. {plan === "annual" ? "Renews yearly, cancel the renewal anytime." : "Cancel anytime."}</p>
    </div>
  );
}
