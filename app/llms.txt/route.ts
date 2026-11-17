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
    "> Rocco is an AI Amazon manager that works with a seller's whole team over iMessage and inside Claude, ChatGPT and Claude Code. He texts the numbers every morning, finds wasted ad spend, stockouts, suppressed listings and Buy Box losses, and proposes coded fixes the team approves by replying YES. Every change is logged and checked a week later.",
    "",
    "## How it works",
    "- Text Rocco on iMessage (rocco.works → Text Rocco). He asks who you are, shows a demo brand's morning, then links your Rocco page to plug in Amazon.",
    `- Or add the connector in Claude/ChatGPT: ${SITE.url}/mcp/login (OAuth sign-in creates the team's private Rocco). It works next to Amazon's official connectors (Amazon Selling Partner for Seller Central; Amazon Ads MCP) and tools like Helium 10's MCP.`,
    "- Data comes from Amazon's official connectors or reports the team exports or texts (CSV). No scraping. Nothing changes in Amazon without the team's approval.",
    "- MCP tools: rocco_brief, rocco_plan, analyze_report (search terms, campaigns, placements, Business Report, Restock Inventory, listings/suppressed, bulk), apply_changes, list_changes, revert_changes, set_brand_settings, listing_gaps, export_changes, activate_license, workspace_link, setup_check.",
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
    `- [Hire Rocco](${SITE.url}/pricing): one plan, pay once for the whole team and unlimited brands. Starts at $99 and rises $10 every 5 hires, capped at $499. Free: demo, setup, first numbers and the top 3 fixes per report.`,
    "",
    "## Notes",
    `- ${SITE.disclaimer}`,
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
