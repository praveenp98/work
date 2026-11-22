import { HireButton } from "@/components/home/HireButton";
import { HeroDashboard } from "@/components/home/HeroDashboard";
import { HowItHappens } from "@/components/home/HowItHappens";
import { StickyHire } from "@/components/home/StickyHire";
import { AppIcon } from "@/components/home/RoccoStage";
import { JsonLd } from "@/components/JsonLd";
import { googleOn } from "@/lib/google";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const VS: [string, string, string][] = [
  ["Who notices the problem", "You, if you think to ask", "Me, every morning"],
  ["Who decides what to do", "You, from a pile of numbers", "Me, with the math shown"],
  ["Who makes the change", "You, in Seller Central", "Me, after you tap approve"],
  ["Who checks it worked", "Nobody", "Me, a week later, measured"],
  ["Remembers your account", "Starts fresh every chat", "Every change, every result"],
];

/**
 * One angle: I run your Amazon, you approve. One action: Connect Amazon (sign up → pay → connect → fixes).
 * Hero + live dashboard sample → how a fix happens → decisions, not data → also in Claude/ChatGPT → price.
 */
export default async function Home() {
  const google = googleOn();
  return (
    <section className="home">
      <div className="h5-hero">
        <div className="h5-copy">
          <span className="h5-kicker">Real work without the fluff</span>
          <h1>I can run your Amazon business, try me.</h1>
          <p className="h5-sub">Connect Seller Central and Amazon Ads once. Every morning I find what to fix. You tap approve, I make the change in Amazon.</p>
          <div className="h5-cta">
            <HireButton google={google} price={PRICE.from} label="Connect Amazon →" className="btn hire-cta" />
            <span className="fine">{PRICE.from} · {PRICE.guarantee} · any Amazon marketplace</span>
          </div>
          <ul className="h5-proof">
            <li>✓ Amazon&apos;s own sign-in</li>
            <li>✓ Nothing changes without you</li>
            <li>✓ Every change logged &amp; undoable</li>
          </ul>
        </div>
        <div className="h5-vis"><HeroDashboard /></div>
      </div>

      <section className="hband"><HowItHappens /></section>

      <section className="hband soft">
        <div className="center-head">
          <span className="kicker">Not another data connector</span>
          <h2 className="big-h">Other tools give your AI data.<br /><span className="blue">I give you decisions.</span></h2>
          <p className="hs-lede">Plenty of tools pipe Amazon numbers into a chat window. You still have to ask the right question, decide, and go make the change. I do the job.</p>
        </div>
        <div className="vs" role="table" aria-label="Data tools vs Rocco">
          <div className="vs-row vs-head" role="row"><span role="columnheader" /><span role="columnheader">Amazon data in a chatbot</span><span role="columnheader">Rocco</span></div>
          {VS.map(([k, a, b]) => <div key={k} className="vs-row" role="row"><span role="rowheader">{k}</span><span role="cell">{a}</span><span role="cell"><b>{b}</b></span></div>)}
        </div>
      </section>

      <section className="hband">
        <div className="two">
          <div className="two-text">
            <span className="kicker">Where you work</span>
            <h2 className="big-h">Approve here, or ask me in Claude.</h2>
            <p className="two-lede">Your dashboard has today&apos;s fixes. Prefer chatting? Add me to Claude or ChatGPT and ask &ldquo;Rocco, how are my ads?&rdquo;. Same memory, same approvals.</p>
          </div>
          <div className="two-vis">
            <div className="h5-apps">
              {(["claude", "openai", "imessage"] as const).map((a) => <span key={a} className="h5-app"><AppIcon app={a} size={34} /></span>)}
              <span className="h5-app rocco">🦝</span>
            </div>
          </div>
        </div>
      </section>

      <section className="hband">
        <div className="hire-box">
          <span className="kicker">Hire me</span>
          <h2 className="big-h">Put me to work<br />tomorrow morning.</h2>
          <div className="price-card">
            <div className="price-main"><b>{PRICE.annual}</b><span>a year · 2 months free</span></div>
            <p className="price-then">or {PRICE.monthly} a month · cancel anytime</p>
            <ul className="plist">
              <li>Every morning: your numbers and the fixes worth making</li>
              <li>Approve and I make the change in Amazon</li>
              <li>Every change measured a week later</li>
              <li>Seller Central + Amazon Ads, every marketplace</li>
            </ul>
            <HireButton google={google} price={PRICE.from} label="Connect Amazon" className="btn hire-cta" />
            <p className="fine">{PRICE.guarantee}: if you don't like the fixes I give you, ask for your money back. Not affiliated with Amazon.</p>
          </div>
        </div>
      </section>

      <StickyHire price={PRICE.from} google={google} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "Web, Claude, ChatGPT", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: (PLAN.annualCents / 100).toFixed(2), priceCurrency: "USD" } }} />
    </section>
  );
}
