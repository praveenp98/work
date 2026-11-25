import Link from "next/link";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PLAN, PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

/**
 * Rocco vs a general AI assistant (Claude, ChatGPT). Not a takedown: Rocco runs on Claude. The point is what happens
 * before you ask (Rocco checks every morning) and after (it remembers, guards the money math, and measures results).
 * Rule: say what the assistant IS; never claim it can't do something its maker says it can.
 */
export interface AiTool { name: string; plan: string; data: string; act: string; makerUrl: string; checked: string }

export function AiCompare({ ai }: { ai: AiTool }) {
  const n = ai.name;
  const rows: [string, string, string][] = [
    ["Who starts", `You open a chat and ask`, "Rocco checks your account every morning and tells you what needs attention, unasked"],
    ["Your data", ai.data, "Seller Central + Amazon Ads pulled every day through Amazon's official APIs, every marketplace"],
    ["Memory", "Each chat works from what you give it (projects help)", "Every change, result and skip-with-a-reason, kept for your account; your strategy written down once"],
    ["The money math", "The model reasons over the numbers you share; worth double-checking", "Bid caps (±20% a step), break-even, budget limits and restock quantities run on fixed, tested rules; the AI explains"],
    ["Making changes", ai.act, "One tap to approve; checked with Amazon first, logged, undoable"],
    ["Did it work?", "You'd check later yourself", "Measured 7 days later with before/after numbers: worked, flat, or undone in one tap"],
    ["Team", "Your chat", "Everyone approves, every approval named; iMessage, WhatsApp or Slack"],
    ["Price", ai.plan, `${PRICE.monthly}/mo or ${PRICE.annual}/yr, flat`],
  ];
  const FAQ = [
    { q: `Can ${n} manage my Amazon PPC?`, a: `${n} can analyse your reports and suggest changes, and it's very good at it. What a chat doesn't do by itself is check your account every morning, remember what it changed, keep bids inside safe limits, and tell you a week later whether the change made money. That loop is what Rocco adds.` },
    { q: "Is Rocco just Claude?", a: "Rocco runs on Claude Opus 5.5 for reading your account, ranking jobs and answering questions. Around it: a daily pull of your Amazon data, fixed rules for every money decision, a change log with undo, and a result check on every change. It's the system, not just the model." },
    { q: `Can I use ${n} and Rocco together?`, a: n === "Claude" ? "Yes. Add Rocco to Claude (rocco.works/mcp/login) and Claude can see Rocco's memory and results in your chats. Keep making changes in one place so two managers don't fight over the same bids." : "Yes. Ask ChatGPT for ideas; let Rocco run the daily checks, guardrails and result tracking. Keep making changes in one place so two managers don't fight over the same bids." },
    { q: `${n} told me to restructure my campaigns. Should I?`, a: "Maybe, but change in small, measured steps. Big restructures reset learning and can sink sales for weeks. Rocco moves bids at most 20% a step, never past your break-even, and checks each change a week later before doing more." },
    { q: "Does Rocco change things without asking?", a: "Not by default: every change waits for a tap. You can opt into \"inside guardrails\" or \"fully autonomous\"; every change is still logged and undoable." },
  ];
  return (
    <section className="pr cmp">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <header className="pr-head">
        <span className="h5-kicker">Rocco vs {n}</span>
        <h1>{n} gives advice. Rocco keeps the receipts.</h1>
        <p className="pr-sub">{n} is brilliant at answering questions about your Amazon business. {n === "Claude" ? "Rocco runs on Claude too." : "Rocco runs on Claude Opus 5.5."} The difference is what happens before you ask (Rocco checks every morning) and after (it remembers, keeps the money math inside your limits, and measures whether each change worked).</p>
        <p><Link className="btn" href="/pricing">Hire Rocco · {PRICE.from}</Link> <Link className="btn ghost" href="/demo">Watch the 2-minute demo</Link></p>
      </header>

      <section className="pr-sec">
        <h2>Side by side</h2>
        <div className="cmp-wrap">
          <table className="cmp-t">
            <thead><tr><th></th><th>{n} (chat)</th><th>Rocco</th></tr></thead>
            <tbody>{rows.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td data-label={`${n} (chat)`}>{a}</td><td data-label="Rocco"><b>{b}</b></td></tr>)}</tbody>
          </table>
        </div>
        <p className="fine">{n} details from {ai.makerUrl.replace("https://", "")}, checked {ai.checked}. Assistants change fast; check theirs. Spot something wrong? <a href={`mailto:${SITE.contactEmail}`}>Tell us</a>.</p>
      </section>

      <section className="pr-sec">
        <h2>The honest version</h2>
        <div className="pr-groups">
          <div className="pr-group"><h3>Just use {n} if</h3><ul><li>You enjoy digging into reports and making changes yourself</li><li>Your ad spend is small and you check it every week anyway</li><li>You want one assistant for everything, not just Amazon</li></ul></div>
          <div className="pr-group"><h3>Hire Rocco if</h3><ul><li>You want to be told what&apos;s wrong without asking</li><li>You want every change logged, capped and undoable</li><li>You want to know, a week later, whether it made money</li><li>Your team needs to approve from their phones</li></ul></div>
        </div>
      </section>

      <section className="pr-sec pr-faq">
        <h2>Questions</h2>
        <Faq items={FAQ} title={null} />
      </section>
      <section className="pr-sec"><p className="cmp-more"><Link href="/compare">All comparisons →</Link> · {PLAN.guaranteeDays}-day money-back guarantee</p></section>
    </section>
  );
}
