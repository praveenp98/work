"use client";
import { useState } from "react";
import { HireButton } from "@/components/home/HireButton";
import { PriceRise } from "@/components/start/ValueCalc";
import { fmtLocal } from "@/lib/ppp";
import type { Where } from "@/components/start/PlanPicker";

/**
 * Pricing card with a Yearly / Monthly switch (yearly first, "2 months free"), the one CTA, and the guarantee right
 * under the button. The plan itself is picked again after sign-up, right before checkout.
 */
export function PricingPlans({ google, annual, monthly, perMonthAnnual, guaranteeDays, where }: { google: boolean; annual: string; monthly: string; perMonthAnnual: string; guaranteeDays: number; where?: Where | null }) {
  const [yearly, setYearly] = useState(true);
  const L = where?.local ?? null;
  if (L) { annual = fmtLocal(L.annual, L); monthly = fmtLocal(L.monthly, L); perMonthAnnual = fmtLocal(L.annual / 12, L); }
  return (
    <div className="pc">
      <div className="pc-toggle" role="radiogroup" aria-label="Billing">
        <button role="radio" aria-checked={yearly} className={yearly ? "on" : ""} onClick={() => setYearly(true)}>Yearly <em>2 months free</em></button>
        <button role="radio" aria-checked={!yearly} className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Monthly</button>
      </div>
      <div className="pc-card">
        <p className="pc-name">Hire Rocco</p>
        <p className="pc-price"><b>{yearly ? perMonthAnnual : monthly}</b><span>/month</span></p>
        <p className="pc-bill">{yearly ? `${annual} billed yearly · 2 months free` : "billed monthly · cancel anytime"}</p>
        <HireButton google={google} price={yearly ? `${annual}/yr` : `${monthly}/mo`} label="Hire Rocco →" className="btn pc-cta" />
        <p className="pc-guarantee">🛡️ <b>{guaranteeDays}-day money-back guarantee.</b> Don&apos;t like the fixes? Full refund, no call, no forms.</p>
        <ul className="pc-quick">
          <li>✓ Whole team</li><li>✓ 3 Amazon accounts</li><li>✓ Every marketplace</li><li>✓ Cancel anytime</li>
        </ul>
      </div>
      <PriceRise />
      <p className="fine pc-local">{L ? `Local price for ${where!.name}, charged in ${L.currency} (list price $1,190/yr or $119/mo).` : where ? `Prices in USD. In ${where.name}? Checkout shows your price in your own currency, often lower.` : "Prices in USD; checkout shows your local price."} Extra Amazon accounts +$49/mo each. Secure checkout by Dodo Payments.</p>
    </div>
  );
}
