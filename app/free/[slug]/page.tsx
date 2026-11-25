import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { MagnetTool } from "@/components/magnets/MagnetTool";
import { Rocco } from "@/components/Rocco";
import { magnet, MAGNETS } from "@/lib/magnets";
import { SITE } from "@/lib/site";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ card?: string }> };

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const m = magnet((await params).slug);
  if (!m) return {};
  const card = (await searchParams).card;
  const title = `${m.name}: free tool for Amazon sellers`;
  // A shared Wrapped link shows that seller's card as the preview image.
  const images = card && m.slug === "amazon-seller-wrapped" ? [`/api/magnets/card?d=${encodeURIComponent(card.slice(0, 1500))}`] : undefined;
  return { title, description: `${m.tagline} ${m.promise}`, alternates: { canonical: `/free/${m.slug}` }, openGraph: { title: m.name, description: m.promise, ...(images ? { images } : {}) }, twitter: images ? { card: "summary_large_image", images } : undefined };
}

export default async function Page({ params }: P) {
  const m = magnet((await params).slug);
  if (!m) notFound();
  const others = MAGNETS.filter((x) => x.slug !== m.slug).slice(0, 9);
  return (
    <section className="mg-page">
      <div className="mg-hero">
        <div>
          <span className="h5-kicker">Free tool {m.n} of 10 · no sign-up to try</span>
          <h1>{m.name}</h1>
          <p className="mg-tag">{m.tagline}</p>
          <p className="muted">{m.promise}</p>
        </div>
        <Rocco pose={m.pose} size={150} />
      </div>
      <MagnetTool slug={m.slug} />
      <Faq items={[...m.faq, { q: "Is my data safe?", a: "Your reports are read inside your browser and never uploaded. If you ask for the roast or an advice check, only summary numbers or the text you pasted go to Rocco's AI (Claude), and nothing is stored." }]} />
      <h2 style={{ fontSize: 26, margin: "44px 0 14px" }}>More free tools</h2>
      <div className="grid">
        {others.map((x) => <Link key={x.slug} className="card mg-mini" href={`/free/${x.slug}`}><small>{x.n}</small><h3>{x.name}</h3><p className="muted">{x.tagline}</p></Link>)}
      </div>
      <p className="fine" style={{ marginTop: 18 }}>Typical ranges are published guidance from seller tools and agencies and vary by category. Comparing two periods shows what moved, not why. {SITE.disclaimer}</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: m.name, description: m.promise, url: `${SITE.url}/free/${m.slug}`, applicationCategory: "BusinessApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />
    </section>
  );
}
