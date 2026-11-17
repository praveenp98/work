/**
 * Data recipes: what Rocco asks the AI to pull from the seller's other connectors
 * (Amazon's official Ads MCP server / Amazon Ads API, Selling Partner API connectors, other Amazon tools)
 * so nobody downloads spreadsheets. Field names follow Amazon Ads API v3 reporting and SP-API report types.
 */
export type Job = "morning_check" | "search_terms" | "budgets" | "placements" | "listings" | "stock" | "listing_health" | "results_check";
type Fetch = { source: string; request: Record<string, unknown>; fallback: string };

const SEARCH_TERMS: Fetch & { request: { columns: string[] } } = {
  source: "Amazon Ads connector (Amazon Ads API v3 reporting)",
  request: { reportTypeId: "spSearchTerm", groupBy: ["searchTerm"], timeUnit: "SUMMARY", last: "30 days",
    columns: ["campaignName", "campaignId", "adGroupName", "adGroupId", "keyword", "keywordId", "targeting", "matchType", "searchTerm", "impressions", "clicks", "cost", "purchases7d", "sales7d", "startDate", "endDate"] },
  fallback: "Amazon Ads → Measurement & Reporting → Sponsored ads reports → Sponsored Products → Search term → Summary, last 30 days.",
};
const CAMPAIGNS: Fetch & { request: { columns: string[] } } = {
  source: "Amazon Ads connector",
  request: { reportTypeId: "spCampaigns", groupBy: ["campaign"], timeUnit: "SUMMARY", last: "30 days",
    columns: ["campaignName", "campaignId", "campaignStatus", "campaignBudgetAmount", "impressions", "clicks", "cost", "purchases7d", "sales7d", "startDate", "endDate"] },
  fallback: "Amazon Ads → Sponsored ads reports → Sponsored Products → Campaign → Summary, last 30 days.",
};
const PLACEMENTS: Fetch = {
  source: "Amazon Ads connector",
  request: { reportTypeId: "spCampaigns", groupBy: ["campaign", "campaignPlacement"], timeUnit: "SUMMARY", last: "30 days",
    columns: ["campaignName", "campaignId", "placementClassification", "impressions", "clicks", "cost", "purchases7d", "sales7d"] },
  fallback: "Amazon Ads → Sponsored ads reports → Sponsored Products → Placement → Summary, last 30 days.",
};
const BUSINESS: Fetch = {
  source: "Selling Partner API connector (Reports API)",
  request: { reportType: "GET_SALES_AND_TRAFFIC_REPORT", reportOptions: { asinGranularity: "CHILD", dateGranularity: "DAY" }, last: "30 days", pass: "the salesAndTrafficByAsin array" },
  fallback: "Seller Central → Reports → Business Reports → Detail Page Sales and Traffic by Child Item.",
};
const STOCK: Fetch = {
  source: "Selling Partner API connector (Reports API)",
  request: { reportType: "GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT", pass: "the report rows (TSV or JSON)" },
  fallback: "Seller Central → Inventory → FBA Inventory → Restock Inventory → Download.",
};

const LISTING_HEALTH: Fetch = {
  source: "Selling Partner API connector (Listings Items API, or Reports API)",
  request: { preferred: "Listings Items API: for each SKU, get status and issues (includedData: summaries, issues)", alternative: { reportType: "GET_MERCHANT_LISTINGS_ALL_DATA" }, pass: "rows of { sku, asin, status, issues } (issues as the API returns them)" },
  fallback: "Seller Central → Inventory → Inventory Reports → All Listings report (or Fix your products → Suppressed → Download).",
};

const RECIPES: Record<Job, { why: string; fetch: Fetch[]; then: string }> = {
  morning_check: { why: "Full daily check: anything on fire (suppressed listings, lost Buy Box), ads waste, budgets, placements, listings, stock.", fetch: [LISTING_HEALTH, SEARCH_TERMS, CAMPAIGNS, PLACEMENTS, BUSINESS, STOCK], then: "Call analyze_report once per dataset (search terms first, so the Business Report can compute TACoS), then rocco_brief, and present one combined approval list sorted by $ at stake." },
  search_terms: { why: "Negatives, harvests and bid changes.", fetch: [SEARCH_TERMS], then: "Call analyze_report with the rows." },
  budgets: { why: "Profitable campaigns running out of budget; campaigns above breakeven.", fetch: [CAMPAIGNS], then: "Call analyze_report with the rows." },
  placements: { why: "Top of search / rest of search / product pages adjustments.", fetch: [PLACEMENTS], then: "Call analyze_report with the rows." },
  listings: { why: "Conversion, buy box and TACoS by ASIN; listing keyword gaps.", fetch: [BUSINESS], then: "Call analyze_report with the rows. For keyword gaps, also fetch the listing's title, bullets and backend search terms (Listings Items API) and call listing_gaps." },
  stock: { why: "Stockout risk, overstock, dead stock.", fetch: [STOCK], then: "Call analyze_report with the rows." },
  listing_health: { why: "Suppressed, inactive or incomplete listings (they sell nothing; ads on them burn money).", fetch: [LISTING_HEALTH], then: "Call analyze_report with the rows. Lead with any problem listing and pause its ads until it's fixed." },
  results_check: { why: "Judge changes applied 7+ days ago.", fetch: [{ ...SEARCH_TERMS, request: { ...SEARCH_TERMS.request, timeUnit: "DAILY", columns: [...SEARCH_TERMS.request.columns.filter((c) => c !== "startDate" && c !== "endDate"), "date"], last: "since the day after the oldest open change" } }, { ...CAMPAIGNS, request: { ...CAMPAIGNS.request, timeUnit: "DAILY", columns: [...CAMPAIGNS.request.columns.filter((c) => c !== "startDate" && c !== "endDate"), "date"], last: "since the day after the oldest open change" } }], then: "Call analyze_report with each; Rocco matches the data to logged changes and reports what worked." },
};

/**
 * Other seller tools the team may have connected in the same AI (Helium 10's official MCP, SellerSprite's MCP,
 * or any keyword/analytics connector). Rocco doesn't replace them: it tells the AI what to pull from them, the way
 * a senior manager uses every tool in the stack.
 */
const OTHER_TOOLS: Partial<Record<Job, string>> = {
  morning_check: "Keyword/market tools (e.g. Helium 10 or SellerSprite connector), if connected: organic rank for the top 10 spending search terms, and any competitor price or Buy Box change on the hero ASINs. Mention big rank moves next to the ads fixes.",
  search_terms: "Before negating a term, check its organic rank and search volume in a keyword tool (e.g. Helium 10 Cerebro/Magnet, SellerSprite) if connected: never cut a high-volume term where the listing ranks top 20 organically without flagging it. For harvests, prefer terms with real search volume.",
  listings: "With a keyword tool connected (e.g. Helium 10 Cerebro reverse-ASIN on the top 3 competitors, or SellerSprite), add high-volume competitor keywords the listing is missing, then call listing_gaps with both lists.",
  placements: "If a keyword tool shows the hero terms' organic rank dropped, keep top-of-search spend on those terms even if ACoS is high, and say why.",
};

export const JOBS = Object.keys(RECIPES) as [Job, ...Job[]];

export function dataPlan(job: Job): string {
  const r = RECIPES[job];
  const L = [`## Rocco's data plan: ${job.replace("_", " ")}`, r.why, "", "Pull this with the seller's connected Amazon connectors (don't ask them to download files unless no connector can):"];
  r.fetch.forEach((f, i) => {
    L.push("", `${i + 1}. **${f.source}**`, "```json", JSON.stringify(f.request, null, 2), "```", `If that connector isn't connected: ${f.fallback}`);
  });
  if (OTHER_TOOLS[job]) L.push("", `**Other tools in this chat:** ${OTHER_TOOLS[job]}`);
  L.push("", `Then: ${r.then}`, "", "Pass connector output straight to analyze_report as `report_json` (any JSON shape with an array of rows) or `report_csv`. Keep IDs (campaignId, adGroupId, keywordId) in the data: they let approved changes be applied back through Amazon's connector.");
  return L.join("\n");
}

export const APPLY_GUIDE = `To apply approved codes: call export_changes with format "amazon_ads_api" to get the exact change list, apply it with the seller's Amazon Ads connector (only the approved codes), confirm success, then call apply_changes with the same codes so Rocco tracks results.`;
