import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { CHECKED, COMPETITORS, competitor, roccoYear, yearlyCost } from "@/lib/compare";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

/** Rocco vs <competitor>, one page per entry in lib/compare.ts (Dr. PPC has its own page). Server-rendered for SEO. */
export const dynamicParams = false;
export const generateStaticParams = () => COMPETITORS.map((c) => ({ slug: c.slug }));

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const short = (name: string) => name.replace(/ \(.*\)$/, "");
const title = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = competitor((await params).slug);
  if (!c) return {};
  const n = short(c.name);
  return {
    title: `${title(n)} alternative: Rocco vs ${n} (pricing, features)`,
    description: `${title(n)}: ${c.price}. Rocco is ${PRICE.annual} a year flat: an AI Amazon manager for ads and Seller Central that you approve from your phone. Side-by-side.`,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const c = competitor((await params).slug);
  if (!c) notFound();
  const n = short(c.name);
  const N = title(n);
  const spends = [5000, 10000, 30000];
  const costs = spends.map((s) => ({ s, them: yearlyCost(c, s) }));
  const rows: [string, string, string][] = [
    ["Price", c.price, `${PRICE.annual}/yr or ${PRICE.monthly}/mo, flat`],
    ["How they charge", c.model, "Flat. Same price at any ad spend"],
    ...costs.filter((x) => x.them !== null).map((x): [string, string, string] => [`Per year at ${$(x.s)}/mo in ads`, x.them === 0 ? "Free (your time)" : `~${$(x.them!)}`, `${$(roccoYear)} yearly · ${$(PLAN.monthlyCents / 100 * 12)} monthly`]),
    ["What it is", c.kind, "An AI Amazon manager running on Claude Opus 5.5: you set the strategy, it finds today's jobs with the reason, you approve (dashboard, or reply YES on iMessage, WhatsApp or Slack), it makes the change in Amazon and checks it a week later"],
    ["Known for", c.focus.join(" · "), "Ads (negatives, bids, budgets, new exact campaigns) + Seller Central (restock plans, Buy Box, suppressed listings)"],
    ["Try it", c.trial ?? "See their site", `${PLAN.guaranteeDays}-day full refund, one email`],
  ];
  const FAQ = [
    { q: `How much does ${n} cost?`, a: `${c.price}. Model: ${c.model.toLowerCase()}. Source: ${c.source}, checked ${CHECKED}. Prices change, so check ${c.url ? c.url.replace("https://", "") : "with them"} before you decide.` },
    { q: `What's the difference between Rocco and ${n}?`, a: `${c.kind} Rocco is an AI Amazon manager: every morning it finds what to fix in your ads and Seller Central, shows the reason, and after you approve it makes the change in Amazon and measures it a week later. It's ${PRICE.annual} a year flat.` },
    { q: `Who is ${n} best for?`, a: `${c.bestFor}. Pick Rocco if you want a flat price, Seller Central jobs next to ads, and approvals from your phone.` },
    { q: `Can I switch from ${n} to Rocco?`, a: "Yes. Connect Amazon in Rocco; it reads your account's change history so it knows how it was run. Turn off the other tool's automatic changes first so two managers don't fight over the same bids." },
    { q: "Does Rocco change things without asking?", a: "Not by default: every change waits for a tap. You can opt into \"inside guardrails\" or \"fully autonomous\". Either way every change is checked with Amazon first, logged, and can be undone." },
  ];
  return (
    <section className="pr cmp">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <header className="pr-head">
        <span className="h5-kicker">Rocco vs {n}</span>
        <h1>{c.angle}</h1>
        <p className="pr-sub">{c.sub}</p>
        <p><Link className="btn" href="/pricing">Hire Rocco · {PRICE.from}</Link> <Link className="btn ghost" href="/demo">Watch the 2-minute demo</Link></p>
      </header>

      <section className="pr-sec">
        <h2>Side by side</h2>
        <div className="cmp-wrap">
          <table className="cmp-t">
            <thead><tr><th></th><th>{N}</th><th>Rocco</th></tr></thead>
            <tbody>{rows.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td><b>{b}</b></td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine">{N}: {c.source}, checked {CHECKED}. Yearly figures are estimates from public prices. Prices change; check theirs before you decide. Spot something wrong? <a href={`mailto:${SITE.contactEmail}`}>Tell us</a> and we&apos;ll fix it.</p>
      </section>

      <section className="pr-sec">
        <h2>The honest version</h2>
        <div className="pr-groups">
          <div className="pr-group"><h3>Pick {n} if</h3><ul>{c.pickThem.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="pr-group"><h3>Pick Rocco if</h3><ul>{c.pickRocco.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      </section>

      <section className="pr-sec pr-faq">
        <h2>Questions</h2>
        <Faq items={FAQ} title={null} />
      </section>

      <section className="pr-sec">
        <h2>Other comparisons</h2>
        <p className="cmp-more"><Link href="/compare/dr-ppc">Dr. PPC</Link>{COMPETITORS.filter((x) => x.slug !== c.slug).map((x) => <span key={x.slug}> · <Link href={`/compare/${x.slug}`}>{title(short(x.name))}</Link></span>)} · <Link href="/compare">All</Link></p>
      </section>
    </section>
  );
}
