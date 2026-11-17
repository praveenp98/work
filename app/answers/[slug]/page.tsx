import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskRoccoButton } from "@/components/home/AskRoccoButton";
import { JsonLd } from "@/components/JsonLd";
import { RoccoHead } from "@/components/Rocco";
import { ANSWERS, answerBySlug } from "@/lib/answers";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => ANSWERS.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = answerBySlug((await params).slug);
  if (!a) return {};
  return { title: a.q, description: a.short.slice(0, 158), alternates: { canonical: `/answers/${a.slug}` }, openGraph: { type: "article", title: a.q, description: a.short } };
}

/** One question, answered first (AEO), then steps and FAQ. Boardy-calm layout. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const a = answerBySlug((await params).slug);
  if (!a) notFound();
  const related = ANSWERS.filter((x) => x.topic === a.topic && x.slug !== a.slug).slice(0, 3);
  const url = `${SITE.url}/answers/${a.slug}`;
  return (
    <article className="answer">
      <p className="fine"><Link href="/answers">Answers</Link> · {a.topic} · Updated {new Date(a.updated + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
      <h1>{a.q}</h1>
      <div className="answer-card">
        <div className="answer-who"><span className="stage-av"><svg width="30" height="25" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="ans" /></svg></span><b>Rocco</b><span className="fine">AI Amazon manager</span></div>
        <p className="answer-short">{a.short}</p>
      </div>
      {a.steps && (<><h2>Step by step</h2><ol className="answer-steps">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol></>)}
      {a.details.map((d) => <p key={d} className="answer-p">{d}</p>)}
      <div className="answer-cta">
        <p>Want this for your own account? Text Rocco: <b>&ldquo;{a.ask}&rdquo;</b></p>
        <AskRoccoButton ask={a.ask} />
        <Link className="fine" href="/setup">or use Rocco in Claude / ChatGPT</Link>
      </div>
      <h2>More questions</h2>
      <dl className="answer-faq">{a.faq.map((f) => <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl>
      {related.length > 0 && (<><h2>Related</h2><ul className="answer-related">{related.map((r) => <li key={r.slug}><Link href={`/answers/${r.slug}`}>{r.q}</Link></li>)}</ul></>)}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: [{ "@type": "Question", name: a.q, acceptedAnswer: { "@type": "Answer", text: a.short } }, ...a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))] },
          ...(a.steps ? [{ "@type": "HowTo", name: a.q, step: a.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) }] : []),
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Answers", item: `${SITE.url}/answers` }, { "@type": "ListItem", position: 2, name: a.q, item: url }] },
        ],
      }} />
    </article>
  );
}
