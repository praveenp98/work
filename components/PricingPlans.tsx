"use client";
import { useState } from "react";
import { HireButton } from "@/components/home/HireButton";
import { PriceRise } from "@/components/start/ValueCalc";

/**
 * Pricing card with a Yearly / Monthly switch (yearly first, "2 months free"), the one CTA, and the guarantee right
 * under the button. The plan itself is picked again after sign-up, right before checkout.
 */
export function PricingPlans({ google, annual, monthly, perMonthAnnual, guaranteeDays }: { google: boolean; annual: string; monthly: string; perMonthAnnual: string; guaranteeDays: number }) {
  const [yearly, setYearly] = useState(true);
  return (
    <div className="pc">
      <div className="pc-toggle" role="radiogroup" aria-label="Billing">
        <button role="radio" aria-checked={yearly} className={yearly ? "on" : ""} onClick={() => setYearly(true)}>Yearly <em>2 months free</em></button>
        <button role="radio" aria-checked={!yearly} className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Monthly</button>
      </div>
      <div className="pc-card">
        <p className="pc-name">Hire Rocco</p>
        <p className="pc-price"><b>{yearly ? perMonthAnnual : monthly}</b><span>/month</span></p>
        <p className="pc-bill">{yearly ? `${annual} billed yearly · save $238` : "billed monthly · cancel anytime"}</p>
        <HireButton google={google} price={yearly ? `${annual}/yr` : `${monthly}/mo`} label="Hire Rocco →" className="btn pc-cta" />
        <p className="pc-guarantee">🛡️ <b>{guaranteeDays}-day money-back guarantee.</b> Don&apos;t like the fixes? Full refund, no call, no forms.</p>
        <ul className="pc-quick">
          <li>✓ Whole team</li><li>✓ 3 Amazon accounts</li><li>✓ Every marketplace</li><li>✓ Cancel anytime</li>
        </ul>
      </div>
      <PriceRise />
      <p className="fine pc-local">Prices in USD; checkout shows your local price. Extra Amazon accounts +$49/mo each. Secure checkout by Dodo Payments.</p>
    </div>
  );
}
