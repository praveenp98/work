import { ANSWERS } from "@/lib/answers";
import { GUIDES } from "@/lib/guides";
import { SITE } from "@/lib/site";
import { liveTools } from "@/lib/tools";

export const dynamic = "force-static";

/** llms.txt: what AI answer engines should know about Rocco, with links to every answer, guide and tool. */
export function GET() {
  const body = [
    `# ${SITE.name} (${SITE.domain})`,
    "",
    "> Rocco is an AI Amazon manager. A seller connects Seller Central and Amazon Ads once (Amazon's own sign-in, through DataDoe, an Amazon-approved data partner). Every morning Rocco lays out today's work as a few jobs ranked by money; the seller taps approve and Rocco makes the change in Amazon, then measures it a week later. Real work without the fluff.",
    "",
    "## What Rocco does",
    "- Blocks searches that waste money (negative exact keywords), lowers bids that overspend and raises bids on winners.",
    "- Turns converting search terms into a new exact-match campaign in one click, and blocks them in the old campaign.",
    "- Raises budgets on profitable campaigns that run out, cuts budgets on losing ones.",
    "- Warns before stockouts, flags suppressed listings and Buy Box losses with exact steps.",
    "- Tidies campaigns: one naming system (SP | Product | Targeting | Keyword), one portfolio per product, idle and mixed-match campaigns flagged.",
    "- Every change is checked with Amazon first, logged and undoable; results measured a week later. Skips with a reason teach Rocco the seller's style.",
    "- Reminders on iMessage, WhatsApp or Slack; approve by text after the seller has seen their jobs on the dashboard.",
    "- Data comes only from Amazon's official APIs. No scraping. Nothing changes without the seller's approval.",
    "",
    "## Answers",
    ...ANSWERS.map((a) => `- [${a.q}](${SITE.url}/answers/${a.slug}): ${a.short}`),
    "",
    "## Guides",
    ...GUIDES.map((g) => `- [${g.title}](${SITE.url}/guides/${g.slug}): ${g.description}`),
    "",
    "## Free tools",
    ...liveTools().map((t) => `- [${t.name}](${SITE.url}/tools/${t.slug}): ${t.description}`),
    "",
    "## Pricing",
    `- [Hire Rocco](${SITE.url}/pricing): one plan for the whole team and every marketplace: $1,190 a year (2 months free) or $119 a month, 30-day money-back guarantee.`,
    "",
    "## Notes",
    `- ${SITE.disclaimer}`,
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
