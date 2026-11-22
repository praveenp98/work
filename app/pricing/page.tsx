import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { HireButton } from "@/components/home/HireButton";
import { RoccoHead } from "@/components/Rocco";
import { googleOn } from "@/lib/google";
import { checkoutUrl } from "@/lib/payments";
import { PLAN, PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Hire Rocco",
  description: `Hire Rocco, your team's AI Amazon manager in Claude. ${PRICE.line} Every fix, memory of every change, results tracking, unlimited brands and teammates.`,
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

const INCLUDED = [
  "Every morning: your numbers and the fixes worth making, by text, Slack and Claude",
  "Ads, Seller Central, stock and listings, with a senior manager's judgment",
  "Memory of every change, and a check a week later on whether it worked",
  "Analytics for every brand: spend, sales, ACoS, waste, stock, listing health",
  "Whole team, unlimited brands, client reports for agencies",
  "Nothing changes in Amazon without a YES",
];

export default async function Page() {
  const url = checkoutUrl();
  return (
    <section className="hire">
      <div className="hello-avatar" style={{ width: 96, height: 96 }}>
        <svg width="80" height="66" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="hire" /></svg>
        <span className="online" aria-hidden />
      </div>
      <h1>Hire Rocco.</h1>
      <p className="hello-lede">One plan for your whole team.</p>
      <div className="hire-card">
        <div className="hire-price">{PRICE.annual}<span> a year · 2 months free</span></div>
        <p className="fine" style={{ margin: "0 0 14px" }}>Or {PRICE.monthly} a month. Cancel anytime. {PRICE.guarantee}.</p>
        <ul className="hire-list">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
        {url ? <HireButton google={googleOn()} price={PRICE.from} label={`Hire Rocco · ${PRICE.annual}/yr`} className="btn imsg-btn hire-btn" /> : <span className="btn ghost">Checkout opens soon</span>}
        <p className="fine" style={{ margin: "10px 0 0" }}>Secure checkout by Dodo Payments · Connect Amazon in one minute</p>
      </div>
      <div style={{ width: "100%", textAlign: "left" }}>
        <Faq items={[
          { q: "What do I need?", a: "Your Seller Central login (the account owner or an admin) and, for ads, your Amazon Ads login. You connect once with Amazon's own sign-in, in any marketplace. No Claude needed; you can also ask me in Claude or ChatGPT if you like." },
          { q: "Can you change things in my account?", a: "Only what you approve. Tap approve and I make that one change in Amazon: checked first, logged, and undoable. Nothing changes on its own." },
          { q: "How many Amazon accounts?", a: "Connect as many seller accounts and marketplaces as you run. Client reports included for agencies." },
          { q: "How does billing work?", a: `${PRICE.line} Cancel the renewal anytime by texting CANCEL.` },
          { q: "What is the money-back guarantee?", a: `If Rocco isn't worth it in your first ${PLAN.guaranteeDays} days, email or text us and you get a full refund, yearly or monthly. No questions, no call.` },
          { q: "Is there a free plan or trial?", a: "No free plan. But you set me up on your real account first and see my top finding in full, free. You pay only after that." },
        ]} />
      </div>
    </section>
  );
}
