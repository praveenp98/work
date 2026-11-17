import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Rocco } from "@/components/Rocco";
import { checkoutUrl, getPriceState } from "@/lib/payments";
import { dollars, LADDER, priceCentsForSold } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing: Rocco Founding Lifetime",
  description: "One plan. Pay once, keep Rocco forever: every fix, memory, change tracking, Amazon change lists, client reports, unlimited brands. Founding price starts at $99 and rises $10 every 5 sales.",
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

const INCLUDED = [
  "Every fix Rocco finds, across search terms, bids, budgets, placements, stock, listings and structure",
  "Memory: change log, measured results, savings, “what's new since last time”",
  "Change lists for Amazon's Ads connector, so your AI applies exactly what you approve",
  "Daily brief, calendar reminders, Black Friday plan",
  "Unlimited brands and white-label client reports (agencies welcome)",
  "Every future tool and update. No subscription, ever.",
];

export default async function Page() {
  const s = await getPriceState();
  const url = checkoutUrl();
  const steps = [0, 5, 10, 25, 50, 100, 150, 200].map((n) => ({ n, p: priceCentsForSold(n) }));
  return (
    <>
      <section className="split" style={{ alignItems: "center", marginTop: 16 }}>
        <div>
          <span className="eyebrow">One plan · pay once</span>
          <h1 style={{ fontSize: "clamp(36px,5.5vw,58px)" }}>Hire Rocco once. Keep him forever.</h1>
          <p className="muted" style={{ fontSize: 18 }}>Founding price goes up {dollars(LADDER.stepCents)} every {LADDER.every} sales until it hits {dollars(LADDER.capCents)}. The earlier you join, the less you pay. That&apos;s the whole trick.</p>
        </div>
        <div className="plan featured" style={{ transform: "none" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="tag live">Founder #{s.founderNumber}</span>
            <Rocco pose="party" size={70} />
          </div>
          <h3 style={{ margin: 0 }}>Rocco Founding Lifetime</h3>
          <div className="price">{dollars(s.priceCents)}<span className="fine"> once</span></div>
          {s.nextPriceCents !== null && (
            <p className="hot" style={{ fontWeight: 700, margin: 0 }}>
              Goes to {dollars(s.nextPriceCents)} in {s.salesUntilNext} sale{s.salesUntilNext === 1 ? "" : "s"}.
            </p>
          )}
          <ul>{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
          {url ? <a className="btn" href={url} style={{ justifyContent: "center" }}>Hire Rocco for {dollars(s.priceCents)} →</a> : <span className="btn ghost">Checkout opens soon</span>}
          <p className="fine" style={{ margin: 0 }}>Secure checkout by Dodo Payments. License key by email; activate in chat or on the site. 7-day refund if Rocco finds nothing useful.</p>
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">The ladder</span>
          <h2>Public, automatic, no fake timers.</h2>
          <p>The price updates itself after every {LADDER.every}th sale, straight from our payment provider. {s.live ? `${s.sold} founders so far.` : ""}</p>
        </div>
        <div className="ladder">
          {steps.map(({ n, p }) => (
            <div key={n} className={`rung${s.sold >= n ? " past" : ""}${priceCentsForSold(s.sold) === p ? " now" : ""}`}>
              <b>{dollars(p)}</b><span>{n === 0 ? "first 5" : `after ${n} sales`}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="eyebrow">What you&apos;re actually buying</span>
          <h2>Not another dashboard. A teammate.</h2>
        </div>
        <div className="grid">
          <div className="card"><h3>Judgment</h3><p className="muted">A senior Amazon manager&apos;s rules, applied the same way every time: thresholds, ±20% caps, protected brand terms.</p></div>
          <div className="card"><h3>Memory &amp; proof</h3><p className="muted">&ldquo;14 changes, 11 worked, $1,240 saved.&rdquo; Every change logged with before-numbers and re-checked.</p></div>
          <div className="card"><h3>Safety</h3><p className="muted">Approval by code, undo for everything, nothing touches your account without your OK.</p></div>
          <div className="card"><h3>Your mornings back</h3><p className="muted">&ldquo;Rocco, morning check&rdquo; replaces an hour of reports and spreadsheets.</p></div>
        </div>
        <p style={{ marginTop: 18 }}>Not sure yet? <Link href="/setup">Add Rocco free</Link>. The brief, findings and top 3 fixes per report cost nothing.</p>
      </section>

      <Faq items={[
        { q: "Is this a subscription?", a: "No. One payment, lifetime access, every future update." },
        { q: "How many brands can I use it for?", a: "Unlimited. Freelancers and agencies are welcome, and white-label client reports are included." },
        { q: "Why does the price go up?", a: `Founding pricing rewards early users. It rises ${dollars(LADDER.stepCents)} after every ${LADDER.every} sales, automatically, until ${dollars(LADDER.capCents)}.` },
        { q: "What's free?", a: "Adding Rocco, the daily brief, all findings, the top 3 fixes per report, the web tools and calculators." },
        { q: "Can I get a refund?", a: "Yes. If Rocco finds nothing useful in your account, email us within 7 days for a full refund." },
      ]} />
    </>
  );
}
