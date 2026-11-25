import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LeadCapture } from "@/components/LeadCapture";
import { Rocco } from "@/components/Rocco";
import { SECTION_TOOLS, wordCount, type SellBlock, type SellGuide } from "@/lib/sell";
import { SITE } from "@/lib/site";

/** `**bold**` and citation markers [s3] → superscript links to the source list. */
export function Rich({ text, srcs }: { text: string; srcs: Map<string, number> }): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\[s\d+\])/).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <b key={i}>{part.slice(2, -2)}</b>;
    const m = part.match(/^\[(s\d+)\]$/);
    if (m) { const n = srcs.get(m[1]); return n ? <sup key={i} className="sl-cite"><a href={`#src-${m[1]}`} aria-label={`Source ${n}`}>{n}</a></sup> : null; }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function BlockView({ b, srcs }: { b: SellBlock; srcs: Map<string, number> }) {
  const R = (t: string) => <Rich text={t} srcs={srcs} />;
  if ("p" in b) return <p>{R(b.p)}</p>;
  if ("h3" in b) return <h3>{b.h3}</h3>;
  if ("ul" in b) return <ul>{b.ul.map((x, i) => <li key={i}>{R(x)}</li>)}</ul>;
  if ("ol" in b) return <ol>{b.ol.map((x, i) => <li key={i}>{R(x)}</li>)}</ol>;
  if ("table" in b) return (
    <figure className="sl-table">
      <div className="sl-tw"><table><thead><tr>{b.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{b.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{R(c)}</td>)}</tr>)}</tbody></table></div>
      {b.table.note && <figcaption>{R(b.table.note)}</figcaption>}
    </figure>
  );
  const c = b.callout;
  return <aside className={`sl-call t-${c.tone}`}><b>{c.tone === "new" ? "🆕 " : c.tone === "warn" ? "⚠️ " : "💡 "}{c.title}</b><p>{R(c.text)}</p></aside>;
}

const date = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** A full beginner guide: header, TL;DR, contents, sections with tool cards, FAQ, sources, structured data. */
export function SellArticle({ g, path, others, hub }: { g: SellGuide; path: string; others: { slug: string; flag: string; country: string }[]; hub?: ReactNode }) {
  const srcs = new Map(g.sources.map((s, i) => [s.id, i + 1]));
  const mins = Math.max(5, Math.round(wordCount(g) / 230));
  const checklist = g.sections.find((s) => s.id === "checklist")?.blocks.find((b): b is { ol: string[] } => "ol" in b)?.ol;
  const strip = (t: string) => t.replace(/\*\*/g, "").replace(/\[s\d+\]/g, "").trim();
  const isHub = g.slug === "index";
  return (
    <article className="sl">
      <header className="sl-head">
        <p className="fine"><Link href="/sell-on-amazon">Start selling on Amazon</Link>{isHub ? "" : ` · ${g.country}`}</p>
        <h1>{isHub ? "" : <span aria-hidden>{g.flag} </span>}{g.title}</h1>
        <p className="sl-sub">{g.description}</p>
        <p className="sl-meta"><span>Updated {date(g.updated)}</span><span>{mins}-minute read</span><span>{g.sources.length} sources checked</span>{!isHub && <span>{g.marketplace}</span>}</p>
      </header>

      <div className="sl-grid">
        <nav className="sl-toc" aria-label="Contents">
          <b>Contents</b>
          <ol>{g.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}<li><a href="#faq">Questions</a></li><li><a href="#sources">Sources</a></li></ol>
        </nav>

        <div className="sl-body">
          <section className="sl-tldr" aria-label="Summary">
            <b>The short version</b>
            <ul>{g.tldr.map((t, i) => <li key={i}><Rich text={t} srcs={srcs} /></li>)}</ul>
          </section>
          {hub}

          {g.sections.map((s, k) => (
            <section key={s.id} id={s.id} className="sl-sec">
              <h2><span className="sl-n">{String(k + 1).padStart(2, "0")}</span>{s.title}</h2>
              {s.blocks.map((b, i) => <BlockView key={i} b={b} srcs={srcs} />)}
              {SECTION_TOOLS[s.id] && (
                <div className="sl-tool"><Rocco pose="hero" size={56} /><div><b>Free tool: {SECTION_TOOLS[s.id].label}</b><p>{SECTION_TOOLS[s.id].why}</p></div><Link className="btn small" href={`${SECTION_TOOLS[s.id].href}?utm_source=sell_guide&utm_content=${g.slug}`}>Try it →</Link></div>
              )}
              {k === 3 && (
                <div className="sl-alert"><LeadCapture leadMagnet={`sell-${g.slug}`} title={isHub ? "Get an email when Amazon changes fees or rules" : `Get an email when ${g.marketplace} changes fees or rules`} cta="Keep me posted">
                  <p>Done. We update this guide when fees or rules change; you&apos;ll hear first.</p>
                </LeadCapture></div>
              )}
            </section>
          ))}

          <section id="faq"><Faq items={g.faq.map((f) => ({ q: f.q, a: strip(f.a) }))} title="Questions new sellers ask" /></section>

          <div className="cta-inline sl-rocco">
            <Rocco pose="wave" size={84} />
            <div style={{ flex: "1 1 260px" }}>
              <b>Once you&apos;re selling, Rocco runs the daily work.</b>
              <p className="muted" style={{ margin: 0 }}>Every morning Rocco checks your ads, budgets, stock and listings, lines up the fixes ranked by money, and makes the ones you approve in Amazon. Works on {isHub ? "every Amazon marketplace" : g.marketplace}.</p>
            </div>
            <Link className="btn small" href={`/?utm_source=sell_guide&utm_content=${g.slug}`}>Meet Rocco →</Link>
          </div>

          <section id="sources" className="sl-src">
            <h2>Sources</h2>
            <p className="fine">Fees and rules change. Every number above links to where it came from; confirm the current figure in Seller Central before you rely on it.</p>
            <ol>{g.sources.map((s) => <li key={s.id} id={`src-${s.id}`}><a href={s.url} target="_blank" rel="noopener nofollow">{s.title}</a>{s.publisher ? ` · ${s.publisher}` : ""}{s.date ? ` · ${s.date}` : ""}</li>)}</ol>
          </section>

          <nav className="sl-more" aria-label="Other marketplaces">
            <b>Guides for other marketplaces</b>
            <div>{others.map((o) => <Link key={o.slug} href={`/sell-on-amazon/${o.slug}`}>{o.flag} {o.country}</Link>)}</div>
          </nav>
          <p className="fine">{SITE.disclaimer} This guide is general information, not tax or legal advice.</p>
        </div>
      </div>

      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.description, dateModified: g.updated, datePublished: "2026-11-25", inLanguage: "en", author: { "@type": "Organization", name: SITE.name, url: SITE.url }, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url }, mainEntityOfPage: `${SITE.url}${path}`, citation: g.sources.map((s) => s.url) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })) }} />
      {checklist && <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: `How to start selling on ${g.marketplace}`, step: checklist.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: strip(t) })) }} />}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Start selling on Amazon", item: `${SITE.url}/sell-on-amazon` }, ...(isHub ? [] : [{ "@type": "ListItem", position: 2, name: g.country, item: `${SITE.url}${path}` }])] }} />
    </article>
  );
}
