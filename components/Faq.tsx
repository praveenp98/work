import { JsonLd } from "./JsonLd";

export interface QA { q: string; a: string }

export function Faq({ items }: { items: QA[] }) {
  return (
    <section className="faq">
      <h2>FAQ</h2>
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
