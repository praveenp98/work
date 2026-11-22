import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HELP, HELP_SECTIONS } from "@/lib/help";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help",
  description: "How Rocco works: connecting Amazon, approving jobs, team, reminders, billing, refunds and troubleshooting. Exact steps.",
  alternates: { canonical: "/help" },
};

/** Help center: every question customers ask, answered with exact steps. Also readable by AI assistants (/llms-full.txt). */
export default function Page() {
  return (
    <section className="answer help">
      <h1>Help</h1>
      <p className="answer-p">Exact answers, short. Can&apos;t find it? Email <a href="mailto:hello@rocco.works">hello@rocco.works</a>: a person replies, usually the same day.</p>
      <p className="fine">Using Claude, ChatGPT or another AI? Give it <a href="/llms-full.txt">rocco.works/llms-full.txt</a>: every answer below in one plain file.</p>
      {HELP_SECTIONS.map((sec) => (
        <div key={sec} className="help-sec">
          <h2>{sec}</h2>
          <ul className="answer-related">
            {HELP.filter((h) => h.section === sec).map((h) => <li key={h.slug}><Link href={`/help/${h.slug}`}>{h.q}</Link></li>)}
          </ul>
        </div>
      ))}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: HELP.map((h) => ({ "@type": "Question", name: h.q, url: `${SITE.url}/help/${h.slug}`, acceptedAnswer: { "@type": "Answer", text: h.short } })) }} />
    </section>
  );
}
