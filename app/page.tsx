import { googleOn } from "@/lib/google";
import { HireButton } from "@/components/home/HireButton";
import { WorkScreen } from "@/components/home/WorkScreen";
import { HandsAndBrain } from "@/components/home/HandsAndBrain";
import { DayWithRocco } from "@/components/home/DayWithRocco";
import { JsonLd } from "@/components/JsonLd";
import { RoccoStage } from "@/components/home/RoccoStage";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

/**
 * One angle, one action. Angle: a senior Amazon manager who never forgets your account, for $99/year.
 * Action: Hire Rocco. Sections: hero → watch me work → Claude is the hands, I'm the manager → a day with me → hire me.
 */
export default async function Home() {
  const price = await getPriceState();
  const p = dollars(price.priceCents);
  const next = price.nextPriceCents ? dollars(price.nextPriceCents) : undefined;
  const google = googleOn();
  return (
    <section className="home">
      <div className="home-hero">
        <h1>I can run your Amazon<br />business, try me.</h1>
        <RoccoStage google={google} price={p} next={next} />
      </div>

      <div className="hs">
        <span className="hs-k">Watch me work</span>
        <h2>Your morning, handled before coffee.</h2>
        <p className="hs-lede">I find what needs doing across ads, stock and listings. Your team taps approve. That&apos;s the whole job.</p>
        <WorkScreen />
      </div>

      <div className="hs">
        <span className="hs-k">How I work</span>
        <h2>Claude is the hands.<br />I&apos;m the manager.</h2>
        <p className="hs-lede">I plug into Claude, the AI with Amazon&apos;s official connectors. Claude reaches into your account. I decide what to do, and I never forget what happened.</p>
        <HandsAndBrain />
      </div>

      <div className="hs">
        <span className="hs-k">A day with me</span>
        <h2>Feels like texting your best Amazon manager.</h2>
        <p className="hs-lede">Morning numbers, fixes you approve with a reply, alerts before things break, and proof of what worked.</p>
        <DayWithRocco />
      </div>

      <div className="hs hire">
        <span className="hs-k">Hire me</span>
        <h2>A senior Amazon manager for {p}/year.</h2>
        <div className="hire-vs">
          <div><small>A senior Amazon manager</small><b>$5,000+</b><span>per month</span></div>
          <div className="me"><small>Rocco, for your whole team</small><b>{p}</b><span>per year</span></div>
        </div>
        <ul className="hire-list">
          <li>Every morning: numbers + fixes worth approving, by text, Slack and Claude</li>
          <li>Ads, Seller Central, stock and listings, with a senior manager&apos;s judgment</li>
          <li>Memory of every change, and a check a week later on whether it worked</li>
          <li>Your whole team, every brand. Nothing changes without a YES</li>
        </ul>
        <HireButton google={google} price={p} next={next} label={`Hire Rocco · ${p}/year`} className="btn hire-cta" />
        <p className="fine">The price goes up $10 with every hire{next ? `: the next team pays ${next}` : ""}. Needs a Claude account. Not affiliated with Amazon.</p>
      </div>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "Claude, iMessage, Slack, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: (price.priceCents / 100).toFixed(2), priceCurrency: "USD" } }} />
    </section>
  );
}
