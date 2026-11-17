import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { RoccoHead } from "@/components/Rocco";
import { checkoutUrl, getPriceState } from "@/lib/payments";
import { dollars, LADDER } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Hire Rocco",
  description: "Hire Rocco once: your team's AI Amazon teammate for life. Every fix, memory, change tracking, client reports, unlimited brands and teammates. Starts at $99 and rises $10 every 5 hires.",
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

const INCLUDED = [
  "Every fix I find: search terms, bids, budgets, placements, stock, listings",
  "I remember every change, check if it worked, and report what it saved",
  "Text me or use me in Claude / ChatGPT. Whole team, unlimited brands",
  "Client reports for agencies",
  "Every future update. No subscription, ever",
];

export default async function Page() {
  const s = await getPriceState();
  const url = checkoutUrl();
  return (
    <section className="hire">
      <div className="hello-avatar" style={{ width: 96, height: 96 }}>
        <svg width="80" height="66" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="hire" /></svg>
        <span className="online" aria-hidden />
      </div>
      <h1>Hire Rocco.</h1>
      <p className="hello-lede">Pay once. I work for your team forever.</p>
      <div className="hire-card">
        <div className="hire-price">{dollars(s.priceCents)}<span> once</span></div>
        {s.nextPriceCents !== null && (
          <p className="hot" style={{ fontWeight: 700, margin: "0 0 6px" }}>
            Goes to {dollars(s.nextPriceCents)} after {s.salesUntilNext} more hire{s.salesUntilNext === 1 ? "" : "s"}.
          </p>
        )}
        <p className="fine" style={{ margin: "0 0 14px" }}>You&apos;d be hire #{s.founderNumber}. The price rises {dollars(LADDER.stepCents)} every {LADDER.every} hires until {dollars(LADDER.capCents)}, automatically.</p>
        <ul className="hire-list">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
        {url ? <a className="btn imsg-btn hire-btn" href={url}>Hire Rocco for {dollars(s.priceCents)}</a> : <span className="btn ghost">Checkout opens soon</span>}
        <p className="fine" style={{ margin: "10px 0 0" }}>Secure checkout by Dodo Payments · License key by email · 7-day refund if I find nothing useful</p>
      </div>
      <p className="fine">Not ready? <Link href="/setup">Try me free</Link>: the daily numbers, findings and top 3 fixes per report cost nothing.</p>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Faq items={[
          { q: "Is this a subscription?", a: "No. One payment, lifetime access, every future update." },
          { q: "How many brands and teammates?", a: "Unlimited. Agencies welcome; client reports included." },
          { q: "Why does the price go up?", a: `Early hires pay less. It rises ${dollars(LADDER.stepCents)} after every ${LADDER.every} hires, automatically, until ${dollars(LADDER.capCents)}.` },
          { q: "Can I get a refund?", a: "Yes. If Rocco finds nothing useful in your account, email us within 7 days for a full refund." },
        ]} />
      </div>
    </section>
  );
}
