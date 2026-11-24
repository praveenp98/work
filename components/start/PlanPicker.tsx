"use client";
import { track } from "@/lib/analytics";
import { useState } from "react";
import { PriceRise, ValueCalc } from "@/components/start/ValueCalc";
import { fmtLocal, type LocalPrice } from "@/lib/ppp";

export interface Where { name: string; local: LocalPrice | null }

/**
 * Step 2 of hiring (after Google sign-up): pick yearly or monthly, then secure checkout. Both cards share the same
 * rows (tag, price, line) so they line up.
 */
export function PlanPicker({ annualUrl, monthlyUrl, where }: { annualUrl: string; monthlyUrl: string; where?: Where | null }) {
  const L = where?.local ?? null;
  const yr = L ? fmtLocal(L.annual, L) : "$2,790";
  const mo = L ? fmtLocal(L.monthly, L) : "$279";
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  const [busy, setBusy] = useState(false);
  const url = plan === "annual" ? annualUrl : monthlyUrl;
  const ready = /dodopayments\.com/.test(url); // no product set yet: never send people to a wrong or looping page
  return (
    <div className="pp">
      <div className="pp-plans" role="radiogroup" aria-label="Plan">
        <button type="button" role="radio" aria-checked={plan === "annual"} className={plan === "annual" ? "on" : ""} onClick={() => setPlan("annual")}>
          <span className="pp-tag best">2 months free</span>
          <b>{yr}<small>/year</small></b>
          <span className="pp-line">{L ? `${fmtLocal(L.annual / 12, L)}/mo billed yearly` : "$233/mo billed yearly"}</span>
        </button>
        <button type="button" role="radio" aria-checked={plan === "monthly"} className={plan === "monthly" ? "on" : ""} onClick={() => setPlan("monthly")}>
          <span className="pp-tag">Flexible</span>
          <b>{mo}<small>/month</small></b>
          <span className="pp-line">billed monthly</span>
        </button>
      </div>
      {L ? <p className="fine pp-local">Local price for {where!.name}, charged in {L.currency}. (List price $2,790 / $279.)</p>
        : where ? <p className="fine pp-local">In {where.name}? Checkout shows your price in your own currency, often lower than USD.</p> : null}
      <PriceRise />
      <ValueCalc plan={plan} compact />
      {ready ? (
        <a className="btn rc-btn" href={url} onClick={() => { setBusy(true); track("checkout_clicked", { plan }); }}>
          {busy ? "Opening secure checkout…" : plan === "annual" ? `Continue · ${yr} a year →` : `Continue · ${mo} a month →`}
        </a>
      ) : <p className="tm-err" role="status">Checkout is being switched on right now. Please try again in a few minutes, or email human@rocco.works.</p>}
      <p className="pp-guarantee">🛡️ <b>Try me for 7 days on your own account.</b> Not useful? Every cent back, one email, no call. {plan === "annual" ? "Renews yearly; cancel the renewal anytime." : "Cancel anytime."}</p>
    </div>
  );
}
