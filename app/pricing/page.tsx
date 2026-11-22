import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { HireButton } from "@/components/home/HireButton";
import { RoccoHead } from "@/components/Rocco";
import { Urgency, ValueCalc } from "@/components/start/ValueCalc";
import { googleOn } from "@/lib/google";
import { PLAN, PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Hire Rocco",
  description: `Hire Rocco, your AI Amazon manager. ${PRICE.line} Every morning: today's jobs, approved in one tap and made in Amazon.`,
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

const INCLUDED = [
  "Every morning: today's jobs, ranked by money, with the reason",
  "Approve and I make the change in Amazon: checked first, logged, undoable",
  "Negatives, bids, budgets, and new exact campaigns from proven searches",
  "Tidy your campaigns: one naming system, one portfolio per product",
  "Restock, listing and Buy Box alerts with the exact steps",
  "Day one: I read your account's change history, so I know what was tried before me",
  "Every change measured a week later, and I learn your style",
  "Reminders on iMessage, WhatsApp or Slack; approve by text",
  "Whole team, every marketplace, Seller Central + Amazon Ads",
];

export default async function Page() {
  const google = googleOn();
  return (
    <section className="hire">
      <div className="hello-avatar" style={{ width: 96, height: 96 }}>
        <svg width="80" height="66" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="hire" /></svg>
        <span className="online" aria-hidden />
      </div>
      <span className="h5-kicker">Real work without the fluff</span>
      <h1>Hire Rocco.</h1>
      <p className="hello-lede">One plan. Your whole team. Every Amazon marketplace.</p>
      <Urgency />
      <div className="pr-plans">
        <div className="pr-plan best">
          <span className="plan-tag">2 months free</span>
          <b>{PRICE.annual}<small>/year</small></b>
          <span>{PRICE.perMonthAnnual}/mo billed yearly · save $238</span>
        </div>
        <div className="pr-plan">
          <b>{PRICE.monthly}<small>/month</small></b>
          <span>billed monthly, cancel anytime</span>
        </div>
      </div>
      <div className="hire-card">
        <ul className="hire-list">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
        <HireButton google={google} price={PRICE.from} label="Hire Rocco →" className="btn imsg-btn hire-btn" />
        <p className="fine" style={{ margin: "10px 0 0" }}>🛡️ {PRICE.guarantee}: if you don&apos;t like the fixes I give you, ask for your money back. Secure checkout by Dodo Payments.</p>
      </div>
      <ValueCalc />
      <div style={{ width: "100%", textAlign: "left" }}>
        <Faq items={[
          { q: "What happens after I pay?", a: "You connect Amazon in about 2 minutes (Seller Central, then Amazon Ads) with Amazon's own sign-in. I start reading right away; your first jobs usually show up within hours." },
          { q: "What do I need?", a: "Your Seller Central login as the primary user (or a user with all permissions) and your Amazon Ads login. Any marketplace. No Claude or other AI needed." },
          { q: "Can you change things in my account?", a: "Only what you approve. Tap approve and I make that change in Amazon: checked with Amazon first, logged, and undoable. Nothing changes on its own." },
          { q: "How many Amazon accounts?", a: "Connect every seller account and marketplace you run, on one plan." },
          { q: "How does billing work?", a: `${PRICE.line} Cancel the renewal anytime from your receipt email or by writing to us.` },
          { q: "What is the money-back guarantee?", a: `If you don't like the fixes I give you in your first ${PLAN.guaranteeDays} days, email hello@rocco.works and you get a full refund, yearly or monthly. No call, no forms.` },
          { q: "Is there a free plan?", a: "No. Connecting and reading an Amazon account costs real money to run, so Rocco is paid from day one, with the 30-day guarantee instead." },
        ]} />
      </div>
    </section>
  );
}
