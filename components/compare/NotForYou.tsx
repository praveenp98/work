import { costAt } from "@/lib/competitors";
import { PRICE } from "@/lib/pricing";

/**
 * "Who Rocco isn't worth it for yet": the honest flip side on every compare page. The one number (share of a $1,000
 * ad budget) is computed from Rocco's real price, not typed in.
 */
export function NotForYou() {
  const small = costAt(1000);
  const pct = Math.round(small.roccoShareOfSpend * 100);
  return (
    <section className="pr-sec">
      <h2>Who Rocco isn&apos;t worth it for yet</h2>
      <ul className="cmp-not">
        <li><b>Accounts spending well under about $2,000 a month on ads.</b> At $1,000 a month in ads, Rocco&apos;s yearly plan ({PRICE.perMonthAnnual} a month) is about {pct}% of your ad budget, and {PRICE.monthly} on monthly is more. Checking the console yourself once a week is likely the better deal until you grow.</li>
        <li><b>Sellers who want a person to run the account.</b> Rocco is software only: no account manager, no calls, no done-for-you service. If you want a human agency, hire one.</li>
        <li><b>Sellers outside Amazon.</b> Rocco works on Amazon only (ads and Seller Central). It doesn&apos;t run Walmart, Shopify, TikTok Shop or other channels.</li>
        <li><b>Brand-new accounts with no sales or ad data yet.</b> Rocco works from your account&apos;s own numbers, so there is little for it to act on until you have a few weeks of data.</li>
      </ul>
    </section>
  );
}
