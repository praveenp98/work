import { HireButton } from "@/components/home/HireButton";
import { HeroDashboard } from "@/components/home/HeroDashboard";
import { HeroFlow } from "@/components/home/HeroFlow";
import { HowItHappens } from "@/components/home/HowItHappens";
import { LogDemo } from "@/components/home/LogDemo";
import { StickyHire } from "@/components/home/StickyHire";
import { Urgency, ValueCalc } from "@/components/start/ValueCalc";
import { JsonLd } from "@/components/JsonLd";
import { googleOn } from "@/lib/google";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const JOBS: { ic: string; t: string; d: string; tag: string }[] = [
  { ic: "✂️", t: "Block searches that waste money", d: "Clicks with no orders, found every morning and blocked in one tap.", tag: "Ads" },
  { ic: "📉", t: "Fix bids that overspend", d: "Down where ACoS runs hot, up where winners are starved. Capped, explained, undoable.", tag: "Ads" },
  { ic: "🌱", t: "Turn winners into exact campaigns", d: "Searches that already sell get their own exact campaign, created in one click.", tag: "Ads" },
  { ic: "💰", t: "Move budget to what's profitable", d: "Raise budgets that run out while profitable, cut the ones losing money.", tag: "Ads" },
  { ic: "🚚", t: "Stay in stock", d: "Restock warnings before you run out, and ads eased on products that can't ship.", tag: "Seller Central" },
  { ic: "🗂️", t: "Tidy hundreds of campaigns", d: "One naming system and one portfolio per product, so your account reads at a glance.", tag: "Structure" },
];

const VS: [string, string, string][] = [
  ["Who notices the problem", "You, if you think to ask", "Me, every morning"],
  ["Who decides what to do", "You, from a pile of numbers", "Me, with the reason shown"],
  ["Who makes the change", "You, in Seller Central", "Me, after you tap approve"],
  ["Who checks it worked", "Nobody", "Me, a week later, measured"],
  ["Remembers your account", "Starts fresh every chat", "Every change before and after me, every result, your style"],
];

const FAQ: [string, string][] = [
  ["Is it safe to connect my account?", "You sign in on Amazon's own page through DataDoe, an Amazon-approved data partner. I never see your password, nothing changes without your approval, every change is checked with Amazon first, logged, and undoable. Remove access anytime in Seller Central."],
  ["How fast do I see fixes?", "Usually within hours of connecting. Amazon's full history keeps loading in the background for a day or two; I only need the last 30 days to start."],
  ["What exactly can you change?", "Negative keywords, bids, budgets, new exact campaigns from proven searches, campaign names and portfolios. Restock, listing and Buy Box problems come with the exact steps."],
  ["Do I need Claude or any other AI?", "No. Everything happens on your Rocco page, with reminders on iMessage, WhatsApp or Slack if you want them."],
  ["Which marketplaces?", "Every Amazon marketplace: US, UK, EU, Canada, India, Japan, Australia and more. Seller Central and Amazon Ads."],
  ["What if it's not worth it?", `${PLAN.guaranteeDays}-day money-back guarantee: if you don't like the fixes I give you, ask for your money back. Cancel anytime.`],
];

/**
 * One angle: I run your Amazon, you approve. One action: Hire Rocco (sign up → pay → connect Amazon → today's work).
 */
export default async function Home() {
  const google = googleOn();
  return (
    <section className="home">
      <div className="h5-hero">
        <div className="h5-copy">
          <span className="h5-kicker">Real work without the fluff</span>
          <h1>I can run your Amazon business, try me.</h1>
          <HeroFlow />
          <div className="h5-cta">
            <HireButton google={google} price={PRICE.from} label="Hire Rocco →" className="btn hire-cta" />
            <span className="fine">{PRICE.from} · {PRICE.guarantee} · cancel anytime</span>
          </div>
          <ul className="h5-proof">
            <li>✓ Amazon&apos;s own sign-in</li>
            <li>✓ Nothing changes without you</li>
            <li>✓ Every change logged &amp; undoable</li>
          </ul>
        </div>
        <div className="h5-vis"><HeroDashboard /></div>
      </div>

      <section className="hband soft">
        <div className="center-head">
          <span className="kicker">What I handle</span>
          <h2 className="big-h">The whole job, every morning.</h2>
          <p className="hs-lede">Not 20 tiny tweaks. A few clear jobs, ranked by money, each approved with one tap.</p>
        </div>
        <ul className="hjobs">
          {JOBS.map((j) => <li key={j.t}><span className="hjobs-ic" aria-hidden>{j.ic}</span><div><b>{j.t}</b><p>{j.d}</p></div><em>{j.tag}</em></li>)}
        </ul>
      </section>

      <section className="hband" id="how"><HowItHappens /></section>

      <section className="hband soft">
        <div className="two">
          <div className="two-text">
            <span className="kicker">Gets sharper every week</span>
            <h2 className="big-h">I learn how you work.</h2>
            <p className="two-lede">Skip a fix and tell me why in one tap: &ldquo;not my strategy&rdquo;, &ldquo;too risky&rdquo;, &ldquo;already done&rdquo;. I stop suggesting what you don&apos;t want, and every change I make is measured a week later, so my next call is better than my last. On day one I also read Amazon&apos;s change history for your ads, so I know what was tried before me.</p>
          </div>
          <div className="two-vis">
            <div className="hlearn">
              <p className="hlearn-q">Why skip this?</p>
              <div className="hlearn-chips"><span>✅ Already done</span><span className="on">🧭 Not my strategy</span><span>⚠️ Too risky</span><span>⏰ Not now</span></div>
              <p className="hlearn-a">🧠 Noted. Say it twice for this kind of fix and I&apos;ll stop suggesting it.</p>
              <div className="hlearn-roi"><span>Rocco has saved you</span><b>$1,284</b><em>13× what I cost</em></div>
            </div>
          </div>
        </div>
      </section>

      <section className="hband">
        <div className="two">
          <div className="two-text">
            <span className="kicker">Every change, on the record</span>
            <h2 className="big-h">Nothing happens in the dark.</h2>
            <p className="two-lede">Every change I make is logged: what changed, why, who approved it and where, and whether it worked when I checked a week later. Changed your mind? Undo it. On day one I also read your account&apos;s own change history, so I know what was tried before me.</p>
          </div>
          <div className="two-vis"><LogDemo /></div>
        </div>
      </section>

      <section className="hband soft">
        <div className="center-head">
          <span className="kicker">Not another data connector</span>
          <h2 className="big-h">Other tools give you data.<br /><span className="blue">I give you decisions.</span></h2>
          <p className="hs-lede">Plenty of tools pipe Amazon numbers into a dashboard or a chat window. You still have to spot the problem, decide, and go make the change. I do the job.</p>
        </div>
        <div className="vs" role="table" aria-label="Data tools vs Rocco">
          <div className="vs-row vs-head" role="row"><span role="columnheader" /><span role="columnheader">Amazon data tools</span><span role="columnheader">Rocco</span></div>
          {VS.map(([k, a, b]) => <div key={k} className="vs-row" role="row"><span role="rowheader">{k}</span><span role="cell">{a}</span><span role="cell"><b>{b}</b></span></div>)}
        </div>
      </section>

      <section className="hband">
        <div className="two">
          <div className="two-text">
            <span className="kicker">Where you work</span>
            <h2 className="big-h">Approve on your dashboard, or right from your messages.</h2>
            <p className="two-lede">Pick a nudge: every morning or Mondays, on iMessage, WhatsApp or Slack. Once you&apos;ve seen how I work, reply YES to approve straight from the message.</p>
          </div>
          <div className="two-vis">
            <div className="hmsg">
              <p className="hmsg-b">☀️ Bamboo &amp; Co: 4 jobs waiting, worth ~$1,240/mo. Approve them here: rocco.works/me</p>
              <p className="hmsg-b me">YES N1 G2</p>
              <p className="hmsg-b">Done in Amazon ✅ N1, G2. I&apos;ll check the results in a week.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hband soft" id="price">
        <div className="hire-box">
          <span className="kicker">Hire me</span>
          <h2 className="big-h">Put me to work<br />tomorrow morning.</h2>
          <Urgency />
          <div className="price-card">
            <div className="price-main"><b>{PRICE.annual}</b><span>a year · 2 months free</span></div>
            <p className="price-then">or {PRICE.monthly} a month · whole team · cancel anytime</p>
            <ul className="plist">
              <li>Every morning: today&apos;s jobs, ranked by money</li>
              <li>Approve and I make the change in Amazon</li>
              <li>Every change measured a week later</li>
              <li>Tidy your campaigns, restock and listing alerts</li>
              <li>Reminders on iMessage, WhatsApp or Slack</li>
              <li>Seller Central + Amazon Ads, every marketplace</li>
            </ul>
            <HireButton google={google} price={PRICE.from} label="Hire Rocco →" className="btn hire-cta" />
            <p className="fine">🛡️ {PRICE.guarantee}: if you don&apos;t like the fixes I give you, ask for your money back.</p>
          </div>
          <ValueCalc />
        </div>
      </section>

      <section className="hband">
        <div className="center-head"><h2 className="big-h">Questions</h2></div>
        <div className="hfaq">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
        <div className="center-cta"><HireButton google={google} price={PRICE.from} label="Hire Rocco →" className="btn hire-cta" /><p className="fine">Not affiliated with Amazon.</p></div>
      </section>

      <StickyHire price={PRICE.from} google={google} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE.url, description: SITE.description, offers: [{ "@type": "Offer", name: "Yearly", price: (PLAN.annualCents / 100).toFixed(2), priceCurrency: "USD" }, { "@type": "Offer", name: "Monthly", price: (PLAN.monthlyCents / 100).toFixed(2), priceCurrency: "USD" }] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    </section>
  );
}
