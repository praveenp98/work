/**
 * The connectors a seller plugs in next to Rocco. Official Amazon endpoints as published
 * (Amazon Ads MCP server: open beta; Amazon Selling Partner connector: beta, in Claude's directory).
 */
export type Region = "na" | "eu" | "fe";
export type Client = "claude" | "claude_code" | "chatgpt" | "cursor";

export const REGIONS: Record<Region, { label: string; markets: string }> = {
  na: { label: "North America", markets: "US, Canada, Mexico, Brazil" },
  eu: { label: "Europe", markets: "UK, Germany, France, Italy, Spain, Netherlands, Sweden, Poland, Türkiye, UAE, Saudi Arabia, Egypt, India" },
  fe: { label: "Far East", markets: "Japan, Australia, Singapore" },
};

export const AMAZON_ADS_URL: Record<Region, string> = {
  na: "https://advertising-ai.amazon.com/mcp",
  eu: "https://advertising-ai-eu.amazon.com/mcp",
  fe: "https://advertising-ai-fe.amazon.com/mcp",
};

export const SELLING_PARTNER_URL = "https://sellingpartner-ai.amazon.com/mcp";
export const ROCCO_SHARED_URL = "https://rocco.works/mcp";

export interface ConnectorInfo {
  id: "amazon_ads" | "selling_partner" | "rocco";
  name: string;
  slug: string; // short name for config files
  by: string;
  what: string;
  needs: string;
  url: (r: Region, token?: string | null) => string;
  status: string;
}

export const CONNECTORS: ConnectorInfo[] = [
  {
    id: "amazon_ads", name: "Amazon Ads (official)", slug: "amazon-ads", by: "Amazon",
    what: "Campaigns, search terms, placements, budgets and bids. Pulls reports and applies the changes you approve.",
    needs: "An Amazon Ads account with Amazon Ads API access (sign in with Login with Amazon; an approved Ads API app is required).",
    url: (r) => AMAZON_ADS_URL[r], status: "Open beta",
  },
  {
    id: "selling_partner", name: "Amazon Selling Partner / Seller Central (official)", slug: "amazon-seller", by: "Amazon",
    what: "Sales & traffic, inventory, listings and orders from Seller Central. You approve every action.",
    needs: "A Seller Central account. In beta; listed in Claude's connector directory (US stores first).",
    url: () => SELLING_PARTNER_URL, status: "Beta",
  },
  {
    id: "rocco", name: "Rocco", slug: "rocco", by: "rocco.works",
    what: "The judgment and memory: what to pull, what to change, approval lists, change log and result checks.",
    needs: "Nothing. Free to add. Personal URL adds memory.",
    url: (_r, token) => (token ? `${ROCCO_SHARED_URL}/${token}` : ROCCO_SHARED_URL), status: "Live",
  },
];

/** Claude Code: one command per connector (HTTP transport; OAuth sign-in happens via /mcp). */
export function claudeCodeCommands(r: Region, token?: string | null): string {
  return CONNECTORS.map((c) => `claude mcp add --transport http ${c.slug} ${c.url(r, token)}`).join("\n");
}

/** Project-scoped .mcp.json (Claude Code) / mcp.json (Cursor). */
export function mcpJson(r: Region, token?: string | null, flavor: "claude_code" | "cursor" = "claude_code"): string {
  const servers = Object.fromEntries(CONNECTORS.map((c) => [c.slug, flavor === "cursor" ? { url: c.url(r, token) } : { type: "http", url: c.url(r, token) }]));
  return JSON.stringify({ mcpServers: servers }, null, 2);
}

/** Claude Code slash command: .claude/commands/morning-check.md → type /morning-check. */
export const MORNING_CHECK_COMMAND = `---
description: Rocco's morning check of my Amazon account
---
Use the Rocco connector as my Amazon teammate.
1. Call rocco_brief.
2. Call rocco_plan with job "morning_check" and pull every dataset it lists using my Amazon Ads and Amazon Selling Partner connectors. If a connector is missing, call setup_check and help me add it.
3. Pass each dataset to analyze_report (as report_json).
4. Show one approval list sorted by $ at stake, with codes. Change nothing until I approve specific codes.
5. For approved codes: export_changes (format amazon_ads_api), apply exactly those with the Amazon connector, then apply_changes to log them.
$ARGUMENTS
`;

const FE = ["jp", "japan", "au", "australia", "sg", "singapore"];
const EU = ["uk", "gb", "united kingdom", "germany", "de", "france", "fr", "italy", "it", "spain", "es", "netherlands", "nl", "sweden", "se", "poland", "pl", "turkey", "türkiye", "tr", "uae", "ae", "united arab emirates", "saudi arabia", "sa", "egypt", "eg", "india", "in", "europe", "eu"];

/** Marketplace name or 2-letter code → Ads API region. Unknown → North America. */
export function regionForMarketplace(m: string): Region {
  const s = m.toLowerCase().replace(/^amazon\./, "").trim();
  const has = (list: string[]) => list.some((x) => s === x || (x.length > 2 && s.includes(x)));
  if (has(FE)) return "fe";
  if (has(EU)) return "eu";
  return "na";
}

/**
 * Daily autopilot for Claude Code, read-only by construction: headless runs can only use the tools
 * listed in --allowedTools (anything else is denied), so it prepares the approval list but can't change the account.
 */
export const AUTOPILOT_PROMPT = 'Rocco, morning check. Call rocco_brief, follow rocco_plan("morning_check") to pull the data with my Amazon connectors, analyze it, and write today\'s approval list sorted by $ at stake. Do not apply or change anything.';

export function autopilotCron(): string {
  const allowed = ["mcp__rocco", "mcp__amazon-seller__search_tools", "mcp__amazon-seller__get_tool_schema", "mcp__amazon-seller__call_read_only_tool"].join(",");
  return [
    "# Weekdays 8:00: Rocco prepares your approval list. Read-only: only the tools below are allowed.",
    "# Add your Amazon Ads connector's report/read tools to --allowedTools (see their names with: claude mcp list / /mcp). Never add write tools here.",
    `0 8 * * 1-5 cd ~/rocco && claude -p '${AUTOPILOT_PROMPT.replace(/'/g, "'\\''")}' --allowedTools "${allowed}" > ~/rocco/briefs/$(date +\\%F).md 2>&1`,
  ].join("\n");
}
