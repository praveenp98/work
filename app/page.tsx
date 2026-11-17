import { TextRoccoButton } from "@/components/home/TextRoccoButton";
import { JsonLd } from "@/components/JsonLd";
import { RoccoStage } from "@/components/home/RoccoStage";
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
  const apps = [
    { label: "iMessage", href: optIn ?? "#text", glyph: "imsg" },
    { label: "Claude", href: "/setup", glyph: "✻" },
    { label: "ChatGPT", href: "/setup", glyph: "GPT" },
    { label: "Claude Code", href: "/setup", glyph: ">_" },
  ];
  return (
    <section className="home">
      <div className="home-hero">
        <h1>I can run your Amazon.<br />Try me.</h1>
        <RoccoStage optIn={optIn} />
        <p className="fine">Free to try · {dollars(price.priceCents)} once for life · Not affiliated with Amazon</p>
      </div>

      <div className="home-how">
        <h2>How I work.</h2>
        <ol>
          <li><b>You ask</b><span>Text me the way you&apos;d text your best Amazon manager. Or just wait for my morning numbers.</span></li>
          <li><b>I dig in</b><span>Seller Central, Amazon Ads, Helium 10: I find the wasted spend, the stockouts and the missed keywords.</span></li>
          <li><b>You say yes</b><span>I make the change, log it, and check a week later that it worked. Undo anytime.</span></li>
        </ol>
      </div>

      <div className="home-msg" id="text">
        <h2>Message me.</h2>
        <p className="hello-lede">Tell me what you sell and what&apos;s bugging you. Your whole team can text me.</p>
        <TextRoccoButton href={optIn} />
        <p className="home-apps-label">Or find me in your favorite app.</p>
        <div className="home-apps">
          {apps.map((a) => <a key={a.label} href={a.href}><span className={`app-tile${a.glyph === "✻" ? " claude" : ""}`}>{a.glyph === "imsg" ? <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden><path fill="#0a84ff" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.5L5 21.5l4-2.1c.9.2 1.9.3 3 .3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z" /></svg> : a.glyph}</span>{a.label}</a>)}
        </div>
        <div className="hello-tools" aria-label="Tools Rocco works with">
          <span>I work the tools you already pay for</span>
          <ul>{["Seller Central", "Amazon Ads", "Helium 10", "SellerSprite", "+ any connector"].map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "iMessage, Claude, ChatGPT, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
    </section>
  );
}
