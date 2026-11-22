import { JsonLd } from "./JsonLd";

export interface QA { q: string; a: string }

export function Faq({ items, title = "FAQ" }: { items: QA[]; title?: string | null }) {
  return (
    <section className="faq">
      {title && <h2>{title}</h2>}
      {items.map((x) => (
        <details key={x.q}>
          <summary>{x.q}</summary>
          <p>{x.a}</p>
        </details>
      ))}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
        }}
      />
    </section>
  );
}
