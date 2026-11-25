import React from "react";
import { ACCOUNTS, OFFER } from "../config";

/**
 * Port of components/PricingPlans.tsx (.pc), yearly selected. Every number comes from marketing/config/offer.ts.
 * The site's "N hires left" is a live count, so it is left out on purpose. Tap target: cta.
 */
export const PRICING_WIDTH = 480;
export const PricingCard: React.FC<{ pressed?: boolean }> = ({ pressed }) => (
  <div className="pc">
    <div className="pc-toggle" role="radiogroup" aria-label="Billing">
      <button className="on">Yearly <em>{OFFER.price.yearlyPerk}</em></button>
      <button>Monthly</button>
    </div>
    <div className="pc-card">
      <p className="pc-name">{OFFER.planName}</p>
      <p className="pc-price"><b>{OFFER.price.perMonthAnnualText}</b><span>/month</span></p>
      <p className="pc-bill">{OFFER.price.annualText} billed yearly · save {OFFER.price.saveYearlyText}</p>
      <span className="btn pc-cta" data-tap="cta" style={pressed ? { transform: "scale(.96)" } : undefined}>{OFFER.cta} →</span>
      <p className="pc-guarantee">🛡️ <b>{OFFER.guarantee.short}.</b> Don&apos;t like the fixes? Full refund, no call, no forms.</p>
      <ul className="pc-quick">
        <li>✓ Whole team</li><li>✓ {ACCOUNTS.included} Amazon accounts</li><li>✓ Every marketplace</li><li>✓ Cancel anytime</li>
      </ul>
    </div>
    <p className="fine pc-local">{OFFER.price.currencyNote} Extra Amazon accounts +${ACCOUNTS.extraPerMonth}/mo each. {OFFER.price.checkoutNote}</p>
  </div>
);
