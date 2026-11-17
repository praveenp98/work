import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PhoneThread } from "@/components/home/PhoneThread";
import { TextRoccoButton } from "@/components/home/TextRoccoButton";
import { getPriceState } from "@/lib/payments";
import { dollars } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const revalidate = 60;

/** One screen, one action: text Rocco. (Everything else lives on /connect, /setup, /pricing.) */
export default async function Home() {
  const price = await getPriceState();
  const number = process.env.NEXT_PUBLIC_ROCCO_IMESSAGE || undefined;
  return (
    <>
      <section className="one">
        <div className="one-copy">
          <span className="pill">🦝 Your team&apos;s AI Amazon teammate</span>
          <h1>Text Rocco about your Amazon business.</h1>
          <p className="lede">Numbers every morning. Answers in seconds. Fixes approved with a reply. One Rocco for the whole team: founders, ads managers, ops and your agency.</p>
          <div className="one-cta">
            <TextRoccoButton number={number} />
            <Link href="/setup" className="one-alt">or add Rocco to Claude / ChatGPT →</Link>
          </div>
          <p className="fine one-fine">Free to try · Founding Lifetime {dollars(price.priceCents)} once{price.salesUntilNext ? ` (goes up in ${price.salesUntilNext})` : ""} · Not affiliated with Amazon</p>
        </div>
        <div className="one-phone"><PhoneThread /></div>
      </section>
      <nav className="one-links" aria-label="More">
        <Link href="/connect">How it works</Link>
        <Link href="/tools/account-check">Free account check</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/guides">Guides</Link>
      </nav>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/icon.svg`, sameAs: [SITE.x] }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Rocco", applicationCategory: "BusinessApplication", operatingSystem: "iMessage, Claude, ChatGPT, Web", url: SITE.url, description: SITE.description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
    </>
  );
}
