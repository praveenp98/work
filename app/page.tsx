import Link from "next/link";
import { TextRoccoButton } from "@/components/home/TextRoccoButton";
import { JsonLd } from "@/components/JsonLd";
import { RoccoHead } from "@/components/Rocco";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { optInLinks } from "@/lib/text/provider";

export const revalidate = 60;

/** Boardy-style: Rocco introduces himself, one action, nothing else. */
export default async function Home() {
  const price = await getPriceState();
  // Our own first message (LoopMessage needs its short code in it); falls back to the dashboard's opt-in link.
  const gen = await optInLinks({ body: "Hey Rocco 👋 Show me what you can do [opt-in-code]" }).catch(() => null);
  const optIn = gen?.url || gen?.imessage || process.env.ROCCO_OPTIN_URL || process.env.NEXT_PUBLIC_ROCCO_OPTIN_URL || undefined;
  return (
    <section className="hello">
      <div className="hello-avatar">
        <svg width="112" height="92" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="hello" /></svg>
        <span className="online" aria-hidden />
      </div>
      <h1>Hi, I&apos;m Rocco.</h1>
      <p className="hello-lede">
        I run Amazon with your team. Text me anything about your ads, sales or stock. I send your numbers every morning and fix things when you reply <b>yes</b>.
      </p>
      <div className="hello-cta">
        <TextRoccoButton href={optIn} />
        <nav className="hello-ways" aria-label="Other ways to work with Rocco">
          <span>or find me in</span>
          <Link href="/setup">Claude</Link>
          <Link href="/setup">ChatGPT</Link>
          <Link href="/setup">Claude Code</Link>
        </nav>
      </div>
      <div className="hello-thread" aria-label="Example texts with Rocco">
        <div className="imsg in"><span className="imsg-bubble">☀️ Morning. ACoS 21% (target 30%). 2 new search terms burning money. Reply YES N1 N2 to cut them.</span></div>
        <div className="imsg out"><span className="imsg-bubble">yes N1 N2</span></div>
        <div className="imsg in"><span className="imsg-bubble">Done ✅ I&apos;ll check Monday if it worked.</span></div>
      </div>
      <div className="hello-tools" aria-label="Tools Rocco works with">
        <span>I work the tools you already pay for</span>
        <ul>{["Seller Central", "Amazon Ads", "Helium 10", "SellerSprite", "+ any connector"].map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <p className="fine">Free to try · {dollars(price.priceCents)} once for life · Not affiliated with Amazon</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "iMessage, Claude, ChatGPT, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
    </section>
  );
}
