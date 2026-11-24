import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { SpendCompare } from "@/components/SpendCompare";
import { DRPPC, ROCCO, yearlyAt } from "@/lib/competitors";
import { COMPETITORS } from "@/lib/compare";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dr. PPC alternative: Rocco vs Dr. PPC (pricing, features)",
  description: `Dr. PPC charges $299/mo plus 2% of your ad spend. Rocco is ${PRICE.annual} a year flat: ads and Seller Central, every marketplace, your whole team. Side-by-side, with a calculator.`,
  alternates: { canonical: "/compare/dr-ppc" },
};

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const AT = [10000, 30000, 50000].map((s) => ({ s, ...yearlyAt(s) }));

const ROWS: [string, string, string][] = [
  ["Price", "$299/mo + 2% of ad spend", `${PRICE.annual}/yr or ${PRICE.monthly}/mo, flat`],
  ["Per year at $10k/mo ad spend", `${$(AT[0].drppc)} (month-to-month)`, `${$(AT[0].rocco)} yearly plan · ${$(ROCCO.monthly * 12)} on monthly`],
  ["Per year at $50k/mo ad spend", `${$(AT[2].drppc)} (month-to-month)`, `${$(AT[2].rocco)} yearly plan · ${$(ROCCO.monthly * 12)} on monthly`],
  ["On Full Circle Partner", "$299 base waived: 2% of ad spend only (e.g. $2,400/yr at $10k/mo)", "No partner program; same flat price for everyone"],
  ["Gets paid more when you spend more", "Yes (2% of every ad dollar)", "No. Same price at any spend"],
  ["Amazon Ads: negatives, bids, budgets, harvests", "Yes", "Yes, one tap each, made in Amazon"],
  ["Seller Central: restock, Buy Box, suppressed listings", "Their Ava agent reports on sales and profit; restock actions not listed", "Included: restock plan created in Amazon in one tap"],
  ["Amazon accounts", "Not stated on their pricing", "3 included (+$49/mo each), every marketplace, local currency"],
  ["Your team", "Inside their platform (Orbit)", "Everyone approves, every approval named; nudges on iMessage, WhatsApp, Slack"],
  ["Autonomy", "Approve every move / inside guardrails / fully autonomous", "Same three levels. Starts on approve every move; the other two are opt-in, plus opt-in auto-undo when a change makes things worse"],
  ["Every change logged and measured", "Yes, with rollback triggers", "Yes: checked a week later, worked / flat / undone in one tap"],
  ["Ask your manager by text", "Their dashboard and agents", "Text me on iMessage, WhatsApp or @Rocco in Slack; answers from your account in seconds, reply YES to approve"],
  ["Midday budget alerts", "Yes (budget pacing)", "Yes, every marketplace, by text or Slack"],
  ["Goal per product", "Yes (per ASIN)", "Yes: profit / balance / growth per product"],
  ["Sign-up", "Account at fullcircleorbit.com (their site: \"You'll create your account at fullcircleorbit.com\"), or book a demo", "Self-serve: Google → plan → connect Amazon, 2 minutes"],
  ["Try it", "First 30 days for $1", `${PLAN.guaranteeDays}-day full refund, one email`],
];

const FAQ = [
  { q: "What is Dr. PPC?", a: `An AI Amazon PPC manager from Full Circle, an Amazon agency, sold inside their platform Orbit. Public price: $299/mo plus 2% of ad spend, first 30 days $1 (${DRPPC.url.replace("https://", "")}, ${DRPPC.checked}).` },
  { q: "Why is Rocco cheaper for most sellers?", a: `Rocco charges a flat ${PRICE.annual} a year. A %-of-ad-spend fee grows with your budget: at $30k/mo in ads, Dr. PPC is ${$(AT[1].drppc)} a year, ${AT[1].times.toFixed(1)}× Rocco.` },
  { q: "Is Dr. PPC good?", a: "It's built by an agency with real experience, and it has things Rocco doesn't have yet (dayparting, a full analytics suite). If you want an agency ecosystem and don't mind paying a share of your ad spend, it's a fair pick. If you want a flat price, Seller Central jobs and your whole team in one place, pick Rocco." },
  { q: "Can I switch from Dr. PPC to Rocco?", a: "Yes. Connect Amazon in Rocco and it reads your account's change history once, so it knows how the account was run before. Turn off the other tool's automatic changes first so two managers don't fight over the same bids." },
  { q: "Does Rocco change things without asking?", a: "Not by default. Rocco starts on \"approve every move\": each change waits for a tap from you or a teammate. You can choose \"inside guardrails\" (Rocco makes money-saving moves itself) or \"fully autonomous\" (every one-tap change, ±20% a step, 25 a day). Either way every change is checked with Amazon first, logged, and can be undone." },
];

export default function Page() {
  return (
    <section className="pr cmp">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <header className="pr-head">
        <span className="h5-kicker">Rocco vs Dr. PPC</span>
        <h1>Same daily rounds. No cut of your ad spend.</h1>
        <p className="pr-sub">Dr. PPC bills $299 a month <b>plus 2% of every ad dollar</b>. The more you spend, the more the doctor charges. Rocco is {PRICE.annual} a year, flat, and does Seller Central too.</p>
        <p><Link className="btn" href="/pricing">Hire Rocco · {PRICE.from}</Link></p>
      </header>

      <section className="pr-sec"><SpendCompare /></section>

      <section className="pr-sec">
        <h2>Side by side</h2>
        <div className="cmp-wrap">
          <table className="cmp-t">
            <thead><tr><th></th><th>Dr. PPC</th><th>Rocco</th></tr></thead>
            <tbody>{ROWS.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td><b>{b}</b></td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine">Dr. PPC details from their public site ({DRPPC.url.replace("https://", "")}), {DRPPC.checked}, including the Full Circle Partner price. Rocco: {$(ROCCO.annual)} on the yearly plan, {$(ROCCO.monthly)}/mo ({$(ROCCO.monthly * 12)}/yr) on monthly. Prices change; check theirs before you decide. Spot something wrong? <a href={`mailto:${SITE.contactEmail}`}>Tell us</a> and we&apos;ll fix it.</p>
      </section>

      <section className="pr-sec">
        <h2>The honest version</h2>
        <div className="pr-groups">
          <div className="pr-group"><h3>Pick Dr. PPC if</h3><ul><li>You want an agency&apos;s ecosystem and a demo call</li><li>You want dayparting and an analytics suite (Orbit) today</li><li>Your ad spend is small and stays small</li><li>You&apos;re on Full Circle Partner: the $299 base is waived and you pay only 2% of ad spend, which is cheaper than Rocco below about $11,600/mo in ads</li></ul></div>
          <div className="pr-group"><h3>Pick Rocco if</h3><ul><li>You don&apos;t want to pay a share of your ad budget forever</li><li>You want stock, Buy Box and listings handled next to ads</li><li>Your team approves from their phone, not a dashboard</li><li>You want to start today without a demo or a partner plan</li></ul></div>
        </div>
      </section>

      <section className="pr-sec pr-faq">
        <h2>Questions</h2>
        <Faq items={FAQ} title={null} />
      </section>

      <section className="pr-sec">
        <h2>Other comparisons</h2>
        <p className="cmp-more">{COMPETITORS.map((x, i) => <span key={x.slug}>{i ? " · " : ""}<Link href={`/compare/${x.slug}`}>{x.name.replace(/ \(.*\)$/, "").replace(/^an /, "An ")}</Link></span>)} · <Link href="/compare">All</Link></p>
      </section>
    </section>
  );
}
