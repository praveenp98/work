import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Rocco } from "@/components/Rocco";
import { GUIDES, guideBySlug, type Block } from "@/lib/guides";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}` }, openGraph: { type: "article", title: g.title, description: g.description } };
}

/** Render `**bold**` inside plain text. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/).map((part, i) => (part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>))}</>;
}

function BlockView({ b }: { b: Block }) {
  if ("h2" in b) return <h2>{b.h2}</h2>;
  if ("p" in b) return <p><Rich text={b.p} /></p>;
  if ("ul" in b) return <ul>{b.ul.map((x) => <li key={x}><Rich text={x} /></li>)}</ul>;
  return <ol>{b.ol.map((x) => <li key={x}><Rich text={x} /></li>)}</ol>;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const mid = Math.ceil(g.body.length / 2);
  const cta = (
    <div className="cta-inline">
      <Rocco pose="hero" size={80} />
      <div style={{ flex: "1 1 220px" }}>
        <b>Skip the spreadsheet.</b>
        <p className="muted" style={{ margin: 0 }}>Rocco does this for your account in 2 minutes. Free, no login.</p>
      </div>
      <Link className="btn small" href={`/tools/${g.tool.slug}?utm_source=guide&utm_medium=inline&utm_campaign=${g.slug}`}>{g.tool.cta} →</Link>
    </div>
  );
  return (
    <article className="article">
      <p className="fine"><Link href="/guides">Guides</Link> · Updated {new Date(g.updated + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)" }}>{g.title}</h1>
      <p className="muted" style={{ fontSize: 19 }}>{g.description}</p>
      {g.body.slice(0, mid).map((b, i) => <BlockView key={i} b={b} />)}
      {cta}
      {g.body.slice(mid).map((b, i) => <BlockView key={mid + i} b={b} />)}
      <Faq items={g.faq} />
      {cta}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.description,
          dateModified: g.updated,
          datePublished: g.updated,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: `${SITE.url}/guides/${g.slug}`,
        }}
      />
    </article>
  );
}
