import type { Metadata } from "next";
import { visitorPricing } from "@/lib/ppp-server";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PricingPlans } from "@/components/PricingPlans";
import { SpendCompare } from "@/components/SpendCompare";
import { Urgency, ValueCalc } from "@/components/start/ValueCalc";
import { googleOn } from "@/lib/google";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Hire Rocco, your AI Amazon manager. ${PRICE.line} Every morning: today's jobs, approved in one tap and made in Amazon.`,
  alternates: { canonical: "/pricing" },
};
export const revalidate = 60;

/** What's included, grouped the way a buyer thinks about it. */
const GROUPS: { t: string; ic: string; items: string[] }[] = [
  { t: "Every morning", ic: "☀️", items: ["Today's jobs, ranked by money, each with the reason", "Restock, listing and Buy Box alerts with the exact steps", "A one-line brief: the most important thing today"] },
  { t: "Made in Amazon for you", ic: "✅", items: ["Block wasted searches, fix bids, move budgets", "New exact campaigns from searches that already sell", "Tidy campaigns: one naming system, one portfolio per product", "Every change checked first, logged and undoable"] },
  { t: "Gets sharper every week", ic: "🧠", items: ["Every change measured a week later", "Learns your style from what you skip and why", "Reads your account's history on day one", "Powered by Claude Opus 5.5, included (no AI plan of your own)"] },
  { t: "Your team, your way", ic: "💬", items: ["Teammates by email, every approval named", "Text me on iMessage, WhatsApp or Slack: questions answered from your account, approve with YES", "3 Amazon accounts, every marketplace, your currency"] },
];

const STEPS = [
  { n: "1", t: "Hire Rocco", d: "Sign up with Google, pick yearly or monthly. 1 minute." },
  { n: "2", t: "Connect Amazon, set your strategy", d: "Seller Central and Amazon Ads on Amazon's own sign-in, then profit or growth, your target, a budget limit, what never to cut. 3 minutes." },
  { n: "3", t: "Approve each morning", d: "First jobs usually within hours. Tap approve; I make the change." },
];

const FAQ = [
  { q: "What happens after I pay?", a: "You connect Amazon in about 2 minutes (Seller Central, then Amazon Ads) with Amazon's own sign-in. I start reading right away; your first jobs usually show up within hours." },
  { q: "What do I need?", a: "Your Seller Central login as the primary user (or a user with all permissions) and your Amazon Ads login. Any marketplace. No Claude or other AI needed." },
  { q: "Can you change things in my account?", a: "Only what you approve. Tap approve and I make that change in Amazon: checked with Amazon first, logged, and undoable. Nothing changes on its own." },
  { q: "How many Amazon accounts?", a: "3 are included (each marketplace counts as one). Each extra account is +$49 a month, added from your dashboard. Agencies: same plan, add accounts as you go." },
  { q: "Can my team use it?", a: "Yes. Add teammates by email from your dashboard: they sign in with Google and land on the same Rocco. Every approval shows who made it. Remove someone anytime, or hand the whole Rocco over." },
  { q: "How does billing work?", a: `${PRICE.line} Cancel the renewal anytime from your receipt email or by writing to us.` },
  { q: "What is the money-back guarantee?", a: `If you don't like the fixes I give you in your first ${PLAN.guaranteeDays} days, email human@rocco.works and you get a full refund, yearly or monthly. No call, no forms.` },
  { q: "Is there a free plan?", a: `No. Connecting and reading an Amazon account costs real money to run, so Rocco is paid from day one, with the ${PLAN.guaranteeDays}-day guarantee instead.` },
];

export default async function Page() {
  return (
    <section className="pr">
      <header className="pr-head">
        <span className="h5-kicker">Real work without the fluff</span>
        <h1>One plan. A senior Amazon manager, every morning.</h1>
        <p className="pr-sub">I find what to fix, you approve, I make the change in Amazon and check it worked.</p>
        <Urgency />
      </header>

      <PricingPlans google={googleOn()} annual={PRICE.annual} monthly={PRICE.monthly} perMonthAnnual={PRICE.perMonthAnnual} guaranteeDays={PLAN.guaranteeDays} where={await visitorPricing()} />

      <section className="pr-sec">
        <h2>Everything that&apos;s included</h2>
        <div className="pr-groups">
          {GROUPS.map((g) => (
            <div key={g.t} className="pr-group">
              <h3><span aria-hidden>{g.ic}</span> {g.t}</h3>
              <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-sec">
        <h2>What happens after you pay</h2>
        <ol className="pr-steps">{STEPS.map((s) => <li key={s.n}><span>{s.n}</span><b>{s.t}</b><p>{s.d}</p></li>)}</ol>
      </section>

      <section className="pr-sec">
        <h2>Flat. Not a cut of your ad spend.</h2>
        <SpendCompare title="AI PPC tools that charge a % of ad spend get pricier as you grow. Rocco doesn't." />
        <p className="fine"><a href="/compare/dr-ppc">Rocco vs Dr. PPC, side by side →</a> · <a href="/compare">vs every other tool →</a></p>
      </section>

      <section className="pr-sec">
        <h2>What it&apos;s worth</h2>
        <ValueCalc />
      </section>

      <section className="pr-sec pr-faq">
        <h2>Questions</h2>
        <Faq items={FAQ} title={null} />
        <p className="fine">More answers in <a href="/help">Help</a>, or email <a href="mailto:human@rocco.works">human@rocco.works</a>.</p>
      </section>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: "Rocco", description: SITE.description, brand: { "@type": "Brand", name: "Rocco" }, offers: [{ "@type": "Offer", name: "Yearly", price: (PLAN.annualCents / 100).toFixed(2), priceCurrency: "USD", url: `${SITE.url}/pricing` }, { "@type": "Offer", name: "Monthly", price: (PLAN.monthlyCents / 100).toFixed(2), priceCurrency: "USD", url: `${SITE.url}/pricing` }] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </section>
  );
}
