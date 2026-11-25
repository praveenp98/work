import { MAGNETS } from "@/lib/magnets";
import { SELL } from "@/lib/sell-data";
import { SELL_PUBLISHED } from "@/lib/sell";
import { MARKETS } from "@/lib/season";
import { ANSWERS } from "@/lib/answers";
import { GUIDES } from "@/lib/guides";
import { HELP } from "@/lib/help";
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
    "## Help (customers and their AI assistants: the full text is at /llms-full.txt)",
    `- [Full help in one file](${SITE.url}/llms-full.txt)`,
    ...HELP.map((h) => `- [${h.q}](${SITE.url}/help/${h.slug})`),
    "",
    "## Answers",
    ...ANSWERS.map((a) => `- [${a.q}](${SITE.url}/answers/${a.slug}): ${a.short}`),
    "",
    ...(SELL_PUBLISHED ? ["## Start selling on Amazon (beginner guides per marketplace, sourced, updated 2026)"] : []),
    ...(SELL_PUBLISHED ? SELL : []).map((g) => `- [${g.title}](${SITE.url}/sell-on-amazon${g.slug === "index" ? "" : `/${g.slug}`}): ${g.description}`),
    "",
    "## Amazon seller calendar (sales, holidays, fee changes, and what to change before/during/after)",
    ...MARKETS.map((m) => `- [Amazon seller calendar: ${m.name}](${SITE.url}/amazon-seller-calendar/${m.slug})`),
    "",
    "## Guides",
    ...GUIDES.map((g) => `- [${g.title}](${SITE.url}/guides/${g.slug}): ${g.description}`),
    "",
    "## Free tools",
    ...liveTools().map((t) => `- [${t.name}](${SITE.url}/tools/${t.slug}): ${t.description}`),
    ...MAGNETS.map((m) => `- [${m.name}](${SITE.url}/free/${m.slug}): ${m.promise}`),
    "",
    "## Rocco inside Claude and ChatGPT",
    `- [Rocco connector](${SITE.url}/connector): add Rocco to Claude or ChatGPT (MCP, OAuth 2.0 sign-in at ${SITE.url}/mcp/login). Daily brief, report analysis with a numbered approval list, change log, result checks, brand settings. Rocco never changes Amazon from a chat.`,
    "",
    "## Comparisons",
    `- [Rocco vs Claude](${SITE.url}/compare/claude): Claude analyses what you ask about; Rocco (built on Claude Opus 5.5) checks the account every morning unasked, remembers every change, keeps money decisions inside fixed rules (±20% bid steps, break-even, budget limits) and measures every change 7 days later.`,
    `- [Rocco vs ChatGPT](${SITE.url}/compare/chatgpt): same difference: daily proactive checks, memory, guardrails, measured results.`,
    `- [Rocco vs Dr. PPC](${SITE.url}/compare/dr-ppc): flat $279/mo vs $299/mo + 2% of ad spend.`,
    `- [All comparisons](${SITE.url}/compare): Helium 10 Ads, Teikametrics, Perpetua, Scale Insights, Ad Badger, BidX, Quartile, agencies, Amazon's free tools.`,
    "",
    "## Pricing",
    `- [Hire Rocco](${SITE.url}/pricing): one plan for the whole team, 3 Amazon accounts included (+$49/mo each extra): $2,790 a year (2 months free) or $279 a month, 7-day money-back guarantee.`,
    "",
    "## Notes",
    `- ${SITE.disclaimer}`,
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
