/** Tool registry. Sitemap, llms.txt, nav and the tools index read from here. */
export interface ToolMeta {
  slug: string;
  name: string;
  short: string;
  description: string;
  free: string;
  paid?: string;
  live: boolean;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "account-check",
    name: "Amazon Account Check",
    short: "Score your whole account: ads, budgets, placements, listings, stock.",
    description:
      "Free Amazon account check: drop in your search term, campaign, placement, business, restock and bulk reports to get a Rocco Score, the money at stake per month, and what to fix first. Runs in your browser.",
    free: "Rocco Score, $ at stake, top 5 actions, area-by-area findings",
    paid: "Every fix approved in one tap, made in Amazon and re-checked a week later",
    live: true,
  },
  {
    slug: "ad-roast",
    name: "Amazon Ad Roast",
    short: "Upload a search term report. Get your Leak Score and the fixes.",
    description:
      "Free Amazon PPC audit: upload your Sponsored Products search term report and see how much ad spend is leaking, which search terms to negate, which to harvest, and which bids to change. Runs in your browser.",
    free: "Leak Score, monthly $ leaking, top 3 leaks, share card",
    paid: "Every negative, harvest and bid fix + ready-to-upload bulk file",
    live: true,
  },
  {
    slug: "coupon-calculator",
    name: "Amazon Coupon Profit Calculator",
    short: "See what a Black Friday coupon really leaves you after fees.",
    description:
      "Free calculator for Amazon coupons: enter price, discount, cost and fees to see profit per unit, margin after the coupon, and the deepest discount you can afford before you lose money.",
    free: "Profit per unit, margin after coupon and fees, max safe discount",
    paid: "Per-SKU coupon plan with budget and setup steps",
    live: true,
  },
  {
    slug: "bfcm-surge-plan",
    name: "BFCM Surge Plan",
    short: "Day-by-day Black Friday budget and bid plan, with guardrails.",
    description:
      "Free Black Friday and Cyber Monday 2026 ad plan for Amazon sellers: enter your daily budget and ACoS targets to get budget, winner-bid and placement changes for every day from Nov 19 to Dec 2.",
    free: "Full 14-day schedule, CSV download, surge rules",
    live: true,
  },
  {
    slug: "breakeven-acos",
    name: "Breakeven ACoS Calculator",
    short: "The ACoS where your ads stop making money.",
    description:
      "Free breakeven ACoS and target ACoS calculator for Amazon sellers. Enter price and costs to get your breakeven ACoS, a profit-target ACoS and the max cost per click you can pay.",
    free: "Breakeven ACoS, target ACoS, max CPC",
    live: true,
  },
];

export const liveTools = () => TOOLS.filter((t) => t.live);
export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
