import { googleOn } from "@/lib/google";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { HireButton } from "@/components/home/HireButton";
import { RoccoHead } from "@/components/Rocco";
import { checkoutUrl, getPriceState } from "@/lib/payments";
import { dollars, LADDER } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Hire Rocco",
  description: "Hire Rocco: your team's AI Amazon manager. $99/year for the whole team. Every fix, memory, change tracking, analytics, unlimited brands and teammates. The price goes up $10 with every hire.",
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
      <p className="hello-lede">One plan for your whole team. Early hires pay less.</p>
      <div className="hire-card">
        <div className="hire-price">{dollars(s.priceCents)}<span>/year</span></div>
        {s.nextPriceCents !== null && (
          <p className="hot" style={{ fontWeight: 700, margin: "0 0 6px" }}>
            The price goes up $10 with every hire. The next one pays {dollars(s.nextPriceCents)}/year.
          </p>
        )}
        <p className="fine" style={{ margin: "0 0 14px" }}>You&apos;d be hire #{s.founderNumber}. It keeps rising {dollars(LADDER.stepCents)} per hire until {dollars(LADDER.capCents)}, automatically.</p>
        <ul className="hire-list">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
        {url ? <HireButton google={googleOn()} price={dollars(s.priceCents)} next={s.nextPriceCents ? dollars(s.nextPriceCents) : undefined} label={`Hire Rocco · ${dollars(s.priceCents)}/year`} className="btn imsg-btn hire-btn" /> : <span className="btn ghost">Checkout opens soon</span>}
        <p className="fine" style={{ margin: "10px 0 0" }}>Secure checkout by Dodo Payments · Then set me up in 2 minutes · Cancel renewal anytime</p>
      </div>
      <p className="fine">Want to see me work first? <Link href="/">Text me</Link> and I&apos;ll show you a demo brand&apos;s morning.</p>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Faq items={[
                    { q: "How many brands and teammates?", a: "Unlimited. Agencies welcome; client reports included." },
          { q: "Why does the price go up?", a: `Early hires pay less. It rises ${dollars(LADDER.stepCents)} with every hire, automatically, until ${dollars(LADDER.capCents)}.` },
          { q: "Is there a free plan or trial?", a: "No. Text Rocco to see a sample brand's morning first. Hiring is $99/year for the whole team; cancel the renewal anytime by texting CANCEL." },
        ]} />
      </div>
    </section>
  );
}
