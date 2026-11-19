import { googleOn } from "@/lib/google";
import { HireButton } from "@/components/home/HireButton";
import { HowItHappens } from "@/components/home/HowItHappens";
import { YourAI } from "@/components/home/YourAI";
import { DayWithRocco } from "@/components/home/DayWithRocco";
import { StickyHire } from "@/components/home/StickyHire";
import { JsonLd } from "@/components/JsonLd";
import { RoccoStage } from "@/components/home/RoccoStage";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const WHO = [
  { e: "🧑‍💼", t: "Brand owners", d: "No time for the daily grind. Approve the morning's fixes from your phone in a minute." },
  { e: "📊", t: "Amazon managers", d: "I prep every change and the reason for it. You make the calls, and clear the list before standup." },
  { e: "🏢", t: "Agencies", d: "Every client brand, one Rocco. A client report every Monday, with what changed and what it earned." },
];

/**
 * Boardy-clean: one angle (I run your Amazon, you approve), one action (Hire Rocco). Light theme everywhere.
 * Hero → how a fix happens → Claude knows Amazon, I know your account → who it's for → a day with me → hire me.
 */
export default async function Home() {
  const google = googleOn();
  return (
    <section className="home">
      <div className="home-hero">
        <h1>I can run your Amazon<br />business, try me.</h1>
        <p className="hero-sub">Rocco is an AI Amazon manager for brand owners, Amazon managers and agencies.</p>
        <RoccoStage google={google} price={PRICE.first} />
      </div>

      <section className="hband"><HowItHappens /></section>

      <section className="hband soft"><YourAI /></section>

      <section className="hband">
        <div className="center-head">
          <span className="kicker">Who hires me</span>
          <h2 className="big-h">Built for whoever<br />runs the account.</h2>
        </div>
        <div className="who">
          {WHO.map((w) => <div key={w.t}><span className="who-e" aria-hidden>{w.e}</span><b>{w.t}</b><p>{w.d}</p></div>)}
        </div>
      </section>

      <section className="hband soft">
        <div className="two">
          <div className="two-text">
            <span className="kicker">A day with me</span>
            <h2 className="big-h">Like texting your best Amazon hire.</h2>
            <p className="two-lede">Morning numbers, fixes you approve with a reply, a heads-up before stock runs out, and proof of what worked. By iMessage, Slack or Claude.</p>
          </div>
          <div className="two-vis"><DayWithRocco /></div>
        </div>
      </section>

      <section className="hband">
        <div className="hire-box">
          <span className="kicker">Hire me</span>
          <h2 className="big-h">Put me to work<br />tomorrow morning.</h2>
          <div className="price-card">
            <div className="price-main"><b>{PRICE.first}</b><span>for your first 3 months</span></div>
            <p className="price-then">then {PRICE.renew} every 3 months · whole team · cancel anytime</p>
            <ul className="plist">
              <li>Morning numbers + fixes worth approving</li>
              <li>Ads, Seller Central, stock and listings</li>
              <li>Memory of every change, results a week later</li>
              <li>Unlimited teammates and brands</li>
            </ul>
            <HireButton google={google} price={PRICE.first} label="Hire Rocco" className="btn hire-cta" />
            <p className="fine">Needs a Claude account. Set up in 2 minutes. Not affiliated with Amazon.</p>
          </div>
        </div>
      </section>

      <StickyHire price={PRICE.first} google={google} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "Claude, iMessage, Slack, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: (PLAN.firstCents / 100).toFixed(2), priceCurrency: "USD" } }} />
    </section>
  );
}
