import { DOE_ACTIONS, type Area, type DoeAction } from "./doe-actions-data";

export { DOE_ACTIONS, type Area, type DoeAction };

/** Seller-facing names for each area, in the order the Actions page shows them. */
export const AREAS: { id: Area; label: string; icon: string; blurb: string }[] = [
  { id: "ads", label: "Ads: campaigns, keywords, bids", icon: "📣", blurb: "Launch, pause, re-budget and re-bid Sponsored Products, Brands and Display." },
  { id: "budget_rules", label: "Ads: budget rules", icon: "📈", blurb: "Automatic budget raises for events or when campaigns perform." },
  { id: "listings", label: "Listings and prices", icon: "🏷️", blurb: "Titles, bullets, search terms, images, any attribute, prices, fee estimates." },
  { id: "aplus", label: "A+ Content", icon: "🖼️", blurb: "Create, revise, publish or take down A+ documents." },
  { id: "fba", label: "FBA stock", icon: "📦", blurb: "Shipment plans, prep requirements, eligibility, removal orders." },
  { id: "orders", label: "Orders and shipping (FBM)", icon: "🚚", blurb: "Cancel items, confirm shipments, buy labels, request reviews." },
  { id: "mcf", label: "Multi-Channel Fulfilment", icon: "🌐", blurb: "Ship FBA stock to customers off Amazon (your site, other stores)." },
  { id: "audiences", label: "Audiences (Amazon Marketing Cloud)", icon: "🎯", blurb: "Build and manage AMC audiences for ads. Needs AMC." },
  { id: "vendor", label: "Vendor Central", icon: "🏭", blurb: "Purchase orders, shipments, Direct Fulfilment. Vendor accounts only." },
  { id: "other", label: "Other", icon: "⚙️", blurb: "" },
];

/** Types Rocco already runs from today's jobs (one-tap approvals), so the page can say so. */
export const USED_BY_JOBS = new Set([
  "AMAZON_ADS_TARGETS_ADD", "AMAZON_ADS_TARGETS_UPDATE", "AMAZON_ADS_CAMPAIGNS_ADD", "AMAZON_ADS_CAMPAIGNS_UPDATE", "AMAZON_ADS_AD_GROUPS_ADD",
  "AMAZON_ADS_ADS_ADD", "AMAZON_ADS_PORTFOLIOS_ADD", "AMAZON_LISTINGS_UPDATE", "AMAZON_LISTINGS_DETAILS_UPDATE", "AMAZON_LISTINGS_FIND",
  "AMAZON_APLUS_CONTENT_ADD", "AMAZON_APLUS_CONTENT_VALIDATE", "AMAZON_APLUS_CONTENT_FIND", "AMAZON_FBA_INBOUND_PLANS_ADD",
]);

export const actionByType = (t: string) => DOE_ACTIONS.find((a) => a.type === t);
export const isWrite = (t: string) => actionByType(t)?.mode === "W";
/** Types the account can't use (vendor-only on a seller account and vice versa). */
export function availableFor(a: DoeAction, accountType: "SELLER" | "VENDOR" = "SELLER"): boolean {
  return accountType === "VENDOR" ? /Vendors/.test(a.who) : /Sellers/.test(a.who);
}

/** Item count in a details payload (for rate limits and the preview). */
export function itemCount(type: string, details: Record<string, unknown>): number {
  const key = actionByType(type)?.key;
  const v = key ? details[key] : undefined;
  return Array.isArray(v) ? Math.max(1, v.length) : 1;
}

/** Compact catalogue for the planner's system prompt: one line per type. */
export const catalogueText = (accountType: "SELLER" | "VENDOR" = "SELLER") =>
  DOE_ACTIONS.filter((a) => availableFor(a, accountType)).map((a) => `${a.type} [${a.mode}${a.risk === "high" ? ", high-risk" : ""}] details.${a.key || "?"}: ${a.what}`).join("\n");
