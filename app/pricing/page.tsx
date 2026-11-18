import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { HireButton } from "@/components/home/HireButton";
import { RoccoHead } from "@/components/Rocco";
import { checkoutUrl, getPriceState } from "@/lib/payments";
import { dollars, LADDER } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Hire Rocco",
  description: "Hire Rocco: your team's AI Amazon manager. 3-day free trial, then $99/year for the whole team. Every fix, memory, change tracking, analytics, unlimited brands and teammates. The price rises $10 every 5 hires.",
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

const INCLUDED = [
  "Every fix I find: search terms, bids, budgets, placements, stock, listings",
  "I remember every change, check if it worked, and report what it saved",
  "Pro analytics: spend, sales, ACoS, waste, stock and listing health over time, for every brand",
  "Text me or use me in Claude / ChatGPT. Whole team, unlimited brands",
  "Client reports for agencies",
  "Every future update. Cancel anytime",
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
      <p className="hello-lede">Try me free for 3 days. Then one plan for your whole team.</p>
      <div className="hire-card">
        <div className="hire-price">{dollars(s.priceCents)}<span>/year</span></div>
        <p style={{ fontWeight: 600, margin: "0 0 6px" }}>3-day free trial. Card needed, cancel anytime before day 4 and you pay nothing.</p>
        {s.nextPriceCents !== null && (
          <p className="hot" style={{ fontWeight: 700, margin: "0 0 6px" }}>
            Goes to {dollars(s.nextPriceCents)}/year after {s.salesUntilNext} more hire{s.salesUntilNext === 1 ? "" : "s"}.
          </p>
        )}
        <p className="fine" style={{ margin: "0 0 14px" }}>You&apos;d be hire #{s.founderNumber}. The price rises {dollars(LADDER.stepCents)} every {LADDER.every} hires until {dollars(LADDER.capCents)}, automatically.</p>
        <ul className="hire-list">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
        {url ? <HireButton price={dollars(s.priceCents)} label="Start my 3-day free trial" className="btn imsg-btn hire-btn" direct /> : <span className="btn ghost">Checkout opens soon</span>}
        <p className="fine" style={{ margin: "10px 0 0" }}>Secure checkout by Dodo Payments · Reminder before you're charged · Reply CANCEL anytime</p>
      </div>
      <p className="fine">Want to see me work first? <Link href="/">Text me</Link> and I&apos;ll show you a demo brand&apos;s morning.</p>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Faq items={[
          { q: "How does the trial work?", a: "Start with your card, get everything for 3 days. I text you the day before it ends. If you do nothing, it's billed yearly; reply CANCEL anytime and you won't be charged again." },
          { q: "How many brands and teammates?", a: "Unlimited. Agencies welcome; client reports included." },
          { q: "Why does the price go up?", a: `Early hires pay less. It rises ${dollars(LADDER.stepCents)} after every ${LADDER.every} hires, automatically, until ${dollars(LADDER.capCents)}.` },
          { q: "Is there a free plan?", a: "No. The 3-day trial is free and has everything. After that, Rocco is $99/year for the whole team." },
        ]} />
      </div>
    </section>
  );
}
