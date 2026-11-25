import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { Rocco } from "@/components/Rocco";
import { MAGNETS } from "@/lib/magnets";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "10 free tools for Amazon sellers", description: "Health check, roast, agency audit, AI advice check, Seller Wrapped, overpaying check, money leak detector and more. Drop your Amazon reports; they're read in your browser.", alternates: { canonical: "/free" } };

export default function Page() {
  return (
    <section className="mg-page">
      <div className="mg-hero">
        <div>
          <span className="h5-kicker">Free · no sign-up to try</span>
          <h1>10 free tools for Amazon sellers</h1>
          <p className="muted">Drop the reports you already download from Amazon. Rocco reads them in your browser and tells you what&apos;s working, what&apos;s leaking and what to do next.</p>
        </div>
        <Rocco pose="wave" size={150} />
      </div>
      <div className="grid">
        {MAGNETS.map((m) => <Link key={m.slug} className="card mg-mini" href={`/free/${m.slug}`}><small>{m.n}</small><h3>{m.name}</h3><p className="muted">{m.tagline}</p><span className="more">Try it →</span></Link>)}
        <Link className="card mg-mini" href="/free/black-friday-checklist"><small>PDF</small><h3>Black Friday ads checklist</h3><p className="muted">Day by day, with bid and budget guardrails.</p><span className="more">Get it →</span></Link>
      </div>
      <p className="fine" style={{ marginTop: 18 }}>{SITE.disclaimer}</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: MAGNETS.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE.url}/free/${m.slug}`, name: m.name })) }} />
    </section>
  );
}
