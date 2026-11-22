import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { HELP, helpBySlug } from "@/lib/help";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => HELP.map((h) => ({ slug: h.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const h = helpBySlug((await params).slug);
  if (!h) return {};
  return { title: h.q, description: h.short.slice(0, 158), alternates: { canonical: `/help/${h.slug}` } };
}

/** One help answer: the answer first, then exact steps. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const h = helpBySlug((await params).slug);
  if (!h) notFound();
  const url = `${SITE.url}/help/${h.slug}`;
  const related = HELP.filter((x) => x.section === h.section && x.slug !== h.slug).slice(0, 4);
  return (
    <article className="answer">
      <p className="fine"><Link href="/help">Help</Link> · {h.section}</p>
      <h1>{h.q}</h1>
      <div className="answer-card"><p className="answer-short">{h.short}</p></div>
      {h.steps && (<><h2>Steps</h2><ol className="answer-steps">{h.steps.map((s) => <li key={s}>{s}</li>)}</ol></>)}
      {h.more?.map((m) => <p key={m} className="answer-p">{m}</p>)}
      <p className="fine">Still stuck? Email <a href="mailto:human@rocco.works">human@rocco.works</a> with your brand name.</p>
      {related.length > 0 && (<><h2>Related</h2><ul className="answer-related">{related.map((r) => <li key={r.slug}><Link href={`/help/${r.slug}`}>{r.q}</Link></li>)}</ul></>)}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: h.q, acceptedAnswer: { "@type": "Answer", text: [h.short, ...(h.steps ?? [])].join(" ") } }] },
          ...(h.steps ? [{ "@type": "HowTo", name: h.q, step: h.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) }] : []),
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Help", item: `${SITE.url}/help` }, { "@type": "ListItem", position: 2, name: h.q, item: url }] },
        ],
      }} />
    </article>
  );
}
