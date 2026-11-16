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
