import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Rocco } from "@/components/Rocco";
import { decodeShare, everyFromShare, PERSONAS } from "@/lib/wrapped";
import { periodLabel } from "@/lib/wrapped-image";

/** A shared Seller Wrapped: the card (numbers only) and one action, get your own. */
type P = { params: Promise<{ slug: string; code: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, code } = await params;
  const s = slug === "amazon-seller-wrapped" ? decodeShare(code) : null;
  if (!s) return {};
  const p = PERSONAS[s.persona];
  const img = `/api/magnets/card?c=${encodeURIComponent(code)}&f=post`;
  const title = `${p.name}: my Amazon Seller Wrapped`;
  const description = `${s.units.toLocaleString("en-US")} units sold, ${everyFromShare(s)}. ${p.line} Get your own Amazon Seller Wrapped free.`;
  return { title, description, robots: { index: false }, alternates: { canonical: "/free/amazon-seller-wrapped" }, openGraph: { title, description, images: [img] }, twitter: { card: "summary_large_image", title, description, images: [img] } };
}

export default async function Page({ params }: P) {
  const { slug, code } = await params;
  const s = slug === "amazon-seller-wrapped" ? decodeShare(code) : null;
  if (!s) notFound();
  const p = PERSONAS[s.persona];
  return (
    <section className="wr-shared">
      <Rocco pose="party" size={120} />
      <span className="h5-kicker">An Amazon seller shared their Wrapped</span>
      <div className="wr-mini g-night">
        <small>AMAZON SELLER WRAPPED · {periodLabel(s.days).toUpperCase()}</small>
        <h4>{p.emoji} {p.name}</h4>
        <p>{p.line}</p>
        <dl>
          <div><dt>Units sold</dt><dd>{s.units.toLocaleString("en-US")}</dd></div>
          <div><dt>Pace</dt><dd>{everyFromShare(s)}</dd></div>
          <div><dt>From the top product</dt><dd>{s.topShare}%</dd></div>
          <div><dt>Conversion</dt><dd>{s.conv}%</dd></div>
          {s.sales !== undefined && <div><dt>Sales</dt><dd>${s.sales.toLocaleString("en-US")}</dd></div>}
          {s.waste !== undefined && <div><dt>Ad spend wasted</dt><dd>{s.waste}%</dd></div>}
        </dl>
      </div>
      <h1 style={{ fontSize: "clamp(30px, 6vw, 44px)", margin: "8px 0 0" }}>What&apos;s your seller personality?</h1>
      <p className="muted" style={{ margin: 0 }}>Your hidden gem, your leaky bucket, your donation to Amazon and your resolution, from your own Business Report. Two minutes. Your reports never leave your device.</p>
      <Link className="btn" href="/free/amazon-seller-wrapped?utm_source=wrapped_share&utm_medium=social">Get my Amazon Seller Wrapped →</Link>
    </section>
  );
}
