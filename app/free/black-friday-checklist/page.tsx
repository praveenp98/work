import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { LeadCapture } from "@/components/LeadCapture";
import { SITE } from "@/lib/site";

const TITLE = "Amazon Black Friday + Cyber Monday ads checklist 2026";
const DESC = "Free 2-page PDF for Amazon sellers: what to do before, during and after Black Friday (Nov 27) and Cyber Monday (Nov 30). Bid and budget guardrails, stock check, coupon margin check, and what to turn back down in December.";
export const metadata: Metadata = { title: `${TITLE} (free PDF)`, description: DESC, alternates: { canonical: "/free/black-friday-checklist" } };

const INSIDE = [
  ["Day by day", "Before (Nov 17 to 25), during (Nov 26 to 30) and after (Dec 1 to 5), as boxes to tick."],
  ["Bid and budget guardrails", "Only proven winners get more, max +20% per step, and when to leave a bid alone."],
  ["Stock check", "No budget increases on a product with under 21 days of cover."],
  ["Coupon margin check", "What shrinks with a discount and what doesn't, so the coupon still makes money."],
  ["What to turn back down", "Bids, the peak-day ACoS tolerance and coupons, from Dec 1."],
];

/** Lead magnet page: the checklist PDF, instant download after the form, plus the two tools it is built from. */
export default function Page() {
  return (
    <section style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 0 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 40, alignItems: "start" }}>
        <div>
          <span className="h5-kicker">Free checklist · 2 pages</span>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", margin: "0 0 14px" }}>{TITLE}</h1>
          <p className="muted" style={{ fontSize: 19, margin: "0 0 20px" }}>Black Friday is Friday, November 27. Cyber Monday is November 30. CPCs rise with the traffic, so the plan is simple: spend on the right search terms, and know what to turn back down after.</p>
          <ul className="plist">
            {INSIDE.map(([t, d]) => <li key={t}><b>{t}.</b> {d}</li>)}
          </ul>
          <p className="fine" style={{ marginTop: 18 }}>Built from the <Link href="/guides/amazon-black-friday-ppc-checklist-2026">Black Friday PPC guide</Link> and the two free tools below. A checklist, not a promise: nobody can honestly guarantee your Black Friday.</p>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <LeadCapture leadMagnet="bfcm-checklist-2026" downloadUrl="/downloads/bfcm-checklist-2026.pdf" downloadLabel="Download the checklist (PDF)" title="Get the checklist" cta="Get the checklist">
            <p>Next, put your own numbers in: <Link href="/tools/bfcm-surge-plan">build your surge plan</Link> and <Link href="/tools/coupon-calculator">check your coupon margin</Link>.</p>
          </LeadCapture>
        </div>
      </div>

      <h2 style={{ fontSize: 28, margin: "56px 0 14px" }}>Do the math with your own numbers</h2>
      <div className="grid">
        <div className="card">
          <h3>BFCM Surge Plan</h3>
          <p className="muted">Day-by-day Black Friday budget and bid plan, with guardrails. Nov 19 to Dec 2.</p>
          <Link className="more" href="/tools/bfcm-surge-plan">Build my plan →</Link>
        </div>
        <div className="card">
          <h3>Coupon Profit Calculator</h3>
          <p className="muted">See what a Black Friday coupon really leaves you after fees.</p>
          <Link className="more" href="/tools/coupon-calculator">Check my coupon →</Link>
        </div>
      </div>

      <div className="answer-cta" style={{ marginTop: 36 }}>
        <p><b>Rather not run this checklist by hand every morning?</b> I do the daily budget, bid, wasted-spend and stock checks on your account and line up the changes. You approve, I make them in Amazon. I don&apos;t promise Black Friday results. <Link href="/pricing">See how hiring me works →</Link></p>
      </div>
      <p className="fine" style={{ marginTop: 18 }}>{SITE.disclaimer}</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "DigitalDocument", name: TITLE, description: DESC, url: `${SITE.url}/free/black-friday-checklist`, isAccessibleForFree: true, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />
    </section>
  );
}
