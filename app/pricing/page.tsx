import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { WaitlistForm } from "@/components/WaitlistForm";
import { checkoutUrl } from "@/lib/payments";
import { PLANS, PRICE_STEPS } from "@/lib/site";

export const metadata: Metadata = { title: "Pricing: Founding Lifetime Deals", description: "Pay once for Rocco. Founding lifetime plans for Amazon sellers, freelancers and agencies, plus a Holiday Pass.", alternates: { canonical: "/pricing" } };

export default function Page() {
  const anyLive = PLANS.some((p) => checkoutUrl(p.id));
  return (
    <>
      <h1>Pay once. Keep Rocco forever.</h1>
      <p className="muted" style={{ fontSize: 18 }}>Founding prices. They go up on {PRICE_STEPS.join(", ")}.</p>
      <div className="plans">
        {PLANS.map((p) => (
          <div className={`plan${"featured" in p && p.featured ? " featured" : ""}`} key={p.id}>
            {"featured" in p && p.featured && <span className="tag">Most popular</span>}
            <h3>{p.name}</h3>
            <div className="price">${p.price}<span className="fine"> {p.id === "holiday" ? "one time" : "once, lifetime"}</span></div>
            <p className="muted">{p.blurb}</p>
            <ul>
              <li>Every Ad Roast fix: negatives, harvest, bids</li>
              <li>Upload-ready bulk files</li>
              <li>{p.brands === 1 ? "1 brand" : `Up to ${p.brands} brands`}</li>
              <li>Every new tool (Coupon Planner, BFCM Post-Mortem, Listing Roast…)</li>
              {p.id === "agency" && <li>White-label roast reports for your prospects</li>}
            </ul>
            {checkoutUrl(p.id) ? (
              <a className="btn" href={checkoutUrl(p.id)!}>Get {p.name}</a>
            ) : (
              <span className="btn ghost" aria-disabled>Checkout opens soon</span>
            )}
          </div>
        ))}
      </div>
      {!anyLive && (
        <section style={{ marginTop: 24 }}>
          <h3>Get the founding link the moment checkout opens</h3>
          <WaitlistForm source="pricing" cta="Save my founding price" />
        </section>
      )}
      <p style={{ marginTop: 18 }}>Not sure yet? <Link href="/tools/ad-roast">Run the free roast first</Link>. You&apos;ll see your Leak Score before you pay anything.</p>
      <Faq items={[
        { q: "Is this a subscription?", a: "No. Lifetime plans are a single payment. The Holiday Pass is a single payment that covers every tool until Jan 31, 2027." },
        { q: "What does 'brand' mean?", a: "One Amazon brand or seller account whose reports you roast. Freelancers and agencies pick a plan by how many client brands they manage." },
        { q: "Do you log into my Amazon account?", a: "No. Rocco works from reports you download. You review every fix and upload it yourself." },
        { q: "Can I get a refund?", a: "Yes, see the refund policy. If Rocco finds nothing useful in your account, we refund you." },
      ]} />
    </>
  );
}
