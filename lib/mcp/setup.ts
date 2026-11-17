import { AMAZON_ADS_URL, claudeCodeCommands, regionForMarketplace, REGIONS, SELLING_PARTNER_URL, type Client } from "../connectors";
import { SITE } from "../site";

/** Tailored help for connecting the Amazon connectors next to Rocco, from inside the chat. */
export function setupHelp(o: { client: Client; marketplace: string; hasAds: boolean; hasSeller: boolean; token?: string }): string {
  const region = regionForMarketplace(o.marketplace || "US");
  const rocco = o.token ? `${SITE.url}/mcp/${o.token}` : `${SITE.url}/mcp`;
  const L = [`## Connect Amazon to ${o.client === "claude_code" ? "Claude Code" : o.client === "chatgpt" ? "ChatGPT" : o.client === "cursor" ? "your MCP app" : "Claude"}`, `Marketplace region: ${REGIONS[region].label} (${REGIONS[region].markets}).`];
  if (o.hasAds && o.hasSeller) L.push("", "✅ Amazon Ads and Seller Central are both connected. Say \"Rocco, morning check\".");
  const missing: string[] = [];
  if (!o.hasAds) missing.push(`**Amazon Ads (official)**: ${AMAZON_ADS_URL[region]}. Needs Amazon Ads API access (sign in with Login with Amazon).`);
  if (!o.hasSeller) missing.push(`**Amazon Selling Partner / Seller Central (official, beta)**: ${SELLING_PARTNER_URL}. In Claude it's in the connector directory as "Amazon Selling Partner".`);
  if (missing.length) {
    L.push("", "### Missing connectors", ...missing.map((m) => `- ${m}`), "", "### How to add them");
    if (o.client === "claude_code") L.push("Run in a terminal, then type /mcp in Claude Code to sign in:", "```", claudeCodeCommands(region, o.token), "```");
    else if (o.client === "chatgpt") L.push("Settings → Apps & Connectors → Advanced → Developer mode on → Create a connector per URL above (sign in to Amazon when asked). Then start a new chat in Developer mode with them enabled.");
    else if (o.client === "cursor") L.push("Add each URL to your MCP config (mcpServers → { url }) and sign in when prompted.");
    else L.push("Settings → Connectors → Browse connectors (\"Amazon Selling Partner\") or Add custom connector (paste the URL), then sign in to Amazon. Turn them on in the chat's tools menu.");
  }
  L.push("", `Rocco: ${rocco}`, `Step-by-step page with copy buttons: ${SITE.url}/setup`, "", "No Ads API access yet? Rocco works with what's connected and can read an exported ads report until access is approved.");
  return L.join("\n");
}
