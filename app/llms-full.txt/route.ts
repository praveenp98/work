import { HELP, HELP_SECTIONS, helpMarkdown } from "@/lib/help";
import { PRICE } from "@/lib/pricing";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Everything an AI assistant needs to help a Rocco customer, in one plain file: what Rocco is, what it can and can't
 * do, pricing, and every help answer with exact steps. People paste rocco.works links into Claude/ChatGPT; this is
 * what those assistants should read.
 */
export function GET() {
  const body = [
    `# ${SITE.name}: full help (${SITE.domain})`,
    "",
    "> Rocco is an AI Amazon manager. A seller connects Seller Central and Amazon Ads once. Every morning Rocco lays out today's work as a few jobs ranked by money; the team approves and Rocco makes the change in Amazon, then measures it a week later.",
    "",
    `Pricing: ${PRICE.line}`,
    "Support: human@rocco.works (a person replies, usually the same day). Each customer's dashboard is private (rocco.works/w/<private link>); assistants can't open it, so ask the customer to paste what they see.",
    "",
    "# What Rocco can and can't do",
    "- Makes in Amazon after the team approves: negative keywords, bid changes, daily budget changes, new exact-match Sponsored Products campaigns from proven searches, campaign tidy-ups (names, portfolios, pausing idle campaigns), and undoing those.",
    "- Flags with exact manual steps: restock, listing problems (suppressed, low sessions or conversion), lost Buy Box.",
    "- Does not do: listing, image, A+ or price edits; coupons, deals, promotions; Sponsored Brands or Display changes; inventory shipments.",
    "- Ask Rocco (dashboard, text, Slack) only answers questions about the seller's Amazon business.",
    "",
    ...HELP_SECTIONS.flatMap((sec) => [`# ${sec}`, "", ...HELP.filter((h) => h.section === sec).map((h) => helpMarkdown(h, SITE.url) + "\n")]),
    `# Notes`,
    `- ${SITE.disclaimer}`,
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
