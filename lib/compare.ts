import { PLAN } from "./pricing";

/**
 * Comparison pages (/compare/<slug>): one entry per competitor. Prices are from public pages and listings, checked Nov 24,
 * 2026; most vendors don't publish exact prices, so every number says where it came from and readers are told to check.
 * Rule: say what they ARE (price, model, focus, who it's for). Never claim a competitor lacks a feature unless their own
 * site says so. Dr. PPC has its own hand-built page (app/compare/dr-ppc).
 */
export interface Competitor {
  slug: string;
  name: string;
  url: string;
  kind: string; // one line: what it is
  price: string; // headline price, as published
  model: string; // how they charge
  trial?: string;
  bestFor: string;
  focus: string[]; // what they're known for (fair, positive)
  /** Estimated monthly cost at a monthly ad spend; null where the public price doesn't say. */
  monthlyAt: (adSpend: number) => number | null;
  pickThem: string[];
  pickRocco: string[];
  source: string; // where the numbers came from
  angle: string; // the H1
  sub: string; // the lede
}

export const CHECKED = "Nov 24, 2026";
const R = { monthly: PLAN.monthlyCents / 100, annual: PLAN.annualCents / 100 };
export const roccoYear = R.annual;

const commonRocco = [
  "You want one flat price that doesn't grow with your ad budget",
  "You want restock, Buy Box and suppressed listings handled next to ads",
  "You'd rather approve from iMessage, WhatsApp or Slack than log into a console",
];

export const COMPETITORS: Competitor[] = [
  {
    slug: "helium-10-ads", name: "Helium 10 Ads (Adtomic)", url: "https://www.helium10.com",
    kind: "The ads tool inside the Helium 10 seller suite (formerly Adtomic).",
    price: "A Helium 10 plan (Platinum from ~$129/mo) + 2% of managed ad spend",
    model: "Suite subscription + % of ad spend", trial: "Free Helium 10 plan; Ads needs a paid plan",
    bestFor: "Sellers who already live in Helium 10 for product and keyword research",
    focus: ["Keyword research, product research and listing tools in one suite", "Rule-based and AI bidding for Sponsored ads", "Large education library and community"],
    monthlyAt: (s) => 129 + 0.02 * s,
    pickThem: ["You use Helium 10's research tools every day and want ads in the same login", "You want to write your own bid rules"],
    pickRocco: commonRocco,
    source: "Helium 10 knowledge base (2% management fee on managed spend) and 2026 pricing guides; which plans include Ads varies by source",
    angle: "Your Amazon manager, not another tab in a suite.", sub: "Helium 10 Ads adds 2% of your managed ad spend on top of a Helium 10 plan. Rocco is one flat price and runs ads and Seller Central for you, with your approval.",
  },
  {
    slug: "teikametrics", name: "Teikametrics", url: "https://www.teikametrics.com",
    kind: "AI ad optimization (Flywheel) for Amazon, Walmart and more.",
    price: "$179/mo ($149/mo yearly) up to $10K ad spend; higher tiers add 3% of spend over $10K",
    model: "Tiered subscription + % of ad spend above $10K", trial: "Free trial on the entry plan",
    bestFor: "Brands selling on Amazon and Walmart who want one ads optimizer",
    focus: ["Automated bidding across Amazon and Walmart", "Inventory-aware advertising", "Managed service tiers"],
    monthlyAt: (s) => (s <= 10000 ? 179 : 499 + 0.03 * (s - 10000)),
    pickThem: ["You sell on Walmart too and want both in one ads tool", "You want a managed-service option from the same company"],
    pickRocco: commonRocco,
    source: "teikametrics.com/pricing and their help center (tiers vary between pages)",
    angle: "Above $10K in ads, they take 3%. Rocco takes nothing.", sub: "Teikametrics is priced by ad spend, with 3% of spend over $10K on the bigger tiers. Rocco is a flat price, and it handles stock, Buy Box and listings next to ads.",
  },
  {
    slug: "perpetua", name: "Perpetua", url: "https://perpetua.io",
    kind: "Goal-based ad automation for Amazon and other retail media (part of Ascential).",
    price: "From ~$695/mo up to $10K ad spend, then a % of spend (estimates vary)",
    model: "Subscription tiered by ad spend", trial: "No free trial listed",
    bestFor: "Brands spending $10K+ a month across several retail media channels",
    focus: ["Goal-based campaigns (you set a goal, it manages bids)", "Multi-channel retail media", "Reporting for larger teams"],
    monthlyAt: (s) => (s <= 10000 ? 695 : null),
    pickThem: ["You run ads on several retailers and want one goal-based tool", "You have a larger team and budget"],
    pickRocco: commonRocco,
    source: "GetApp / Capterra listings and 2026 reviews; Perpetua doesn't publish a full price list",
    angle: "Goal-based ads, without the enterprise price.", sub: "Perpetua starts around $695 a month and scales with ad spend. Rocco is a flat price: you set the strategy, it does the daily work, and you approve every change.",
  },
  {
    slug: "scale-insights", name: "Scale Insights", url: "https://scaleinsights.com",
    kind: "Rule-based Amazon PPC automation priced by how many products you automate.",
    price: "$78/mo (5 ASINs) to $688/mo (100 ASINs)",
    model: "Flat, tiered by automated ASINs", trial: "30-day free trial",
    bestFor: "Hands-on PPC operators who like building their own rules",
    focus: ["Powerful custom bid rules", "Dayparting and placement controls", "Priced by ASIN count, not ad spend"],
    monthlyAt: () => null,
    pickThem: ["You enjoy writing and tuning your own bid rules", "You have a few ASINs and want the cheapest automation"],
    pickRocco: ["You want the decisions made for you, with the reason shown, instead of writing rules", "You want restock, Buy Box and listings handled next to ads", "You'd rather approve from your phone than manage rules"],
    source: "Scale Insights plan listings (May 2026 snapshot) and 2026 reviews",
    angle: "Rules you write vs a manager who decides.", sub: "Scale Insights is great if you want to build your own PPC rules. Rocco is for sellers who want the decisions made for them, with the reason shown, and a tap to approve.",
  },
  {
    slug: "ad-badger", name: "Ad Badger", url: "https://www.adbadger.com",
    kind: "Amazon PPC software plus optional managed service, priced by ad spend tier.",
    price: "$275/mo ($2,550/yr) up to $5K ad spend; up to $1,830/mo at the top tier",
    model: "Subscription tiered by ad spend", trial: "30-day trial",
    bestFor: "Sellers who want PPC software with lots of training content",
    focus: ["Bid automation and search term harvesting", "Strong PPC education content", "Managed service option"],
    monthlyAt: (s) => (s <= 5000 ? 275 : null),
    pickThem: ["You want to learn PPC deeply with their training", "You might want a managed service later"],
    pickRocco: commonRocco,
    source: "adbadger.com/pricing (Capterra lists a different starting price)",
    angle: "Same price at $5K or $50K in ads.", sub: "Ad Badger's price climbs with your ad spend tier. Rocco is one flat price at any spend, and it handles Seller Central jobs too.",
  },
  {
    slug: "bidx", name: "BidX", url: "https://www.bidx.io",
    kind: "AI Amazon ads platform with self-service and managed plans.",
    price: "From €495/mo plus a % of ad spend (not published)",
    model: "Subscription + % of ad spend", trial: "Short trial listed",
    bestFor: "Larger EU and US brands who want AI bidding plus account managers",
    focus: ["AI bid optimization and rules", "Managed platform and managed service tiers", "Strong in European marketplaces"],
    monthlyAt: () => null,
    pickThem: ["You want a dedicated account manager on top of software", "You're a larger brand in Europe"],
    pickRocco: commonRocco,
    source: "2026 reviews checking BidX's pricing page (older listings show $295/mo)",
    angle: "Less than half the entry price. No % of spend.", sub: "BidX starts around €495 a month plus a share of ad spend. Rocco is a flat price for ads and Seller Central, every marketplace, your whole team.",
  },
  {
    slug: "quartile", name: "Quartile", url: "https://quartile.com",
    kind: "Machine-learning ad management for larger brands across retail media.",
    price: "From ~$895/mo per channel (up to $10K ad spend), up to ~$9,995/mo; +$500 per extra account",
    model: "Tiered by ad spend, per channel", trial: "Demo first",
    bestFor: "Bigger brands with large budgets across Amazon, Walmart and Google",
    focus: ["Hourly machine-learning bidding", "Many channels in one platform", "Account managers"],
    monthlyAt: (s) => (s <= 10000 ? 895 : null),
    pickThem: ["You spend heavily across several channels", "You want a sales-led setup with account managers"],
    pickRocco: [...commonRocco, "You want to start today, not after a demo"],
    source: "RevenueGeeks and Findstack estimates; Quartile doesn't publish prices",
    angle: "Start in 2 minutes. No demo, no per-channel fees.", sub: "Quartile is sold through a demo, from about $895 a month per channel. Rocco is self-serve: hire, connect Amazon, set your strategy, approve your first jobs.",
  },
  {
    slug: "amazon-ppc-agency", name: "an Amazon PPC agency", url: "",
    kind: "A human team that manages your ads for a monthly retainer or a share of spend.",
    price: "Usually $1,500–$8,000/mo, or 10–20% of ad spend",
    model: "Retainer or % of ad spend", trial: "Usually a contract",
    bestFor: "Brands that want people on calls, strategy decks and creative work",
    focus: ["Strategy calls and monthly reports", "Creative, DSP and launches", "A named account manager"],
    monthlyAt: (s) => Math.max(1500, 0.12 * s),
    pickThem: ["You want people on calls and a monthly strategy deck", "You need creative, DSP or launch services"],
    pickRocco: ["You want the daily work done every morning, not reviewed once a month", "You want every change logged, measured and undoable", "You want a fraction of the price with no contract"],
    source: "2026 agency pricing guides and surveys (typical ranges; quotes vary a lot)",
    angle: "The daily work of an agency, for a fraction of a retainer.", sub: "Agencies usually charge $1,500–$8,000 a month or 10–20% of ad spend, and look at your account a few times a month. Rocco checks it every morning and you approve each change.",
  },
  {
    slug: "amazon-free-ad-tools", name: "Amazon's free ad tools", url: "https://advertising.amazon.com",
    kind: "The bidding, budget rules and recommendations built into the Amazon Ads console.",
    price: "Free",
    model: "Included with Amazon Ads", trial: "—",
    bestFor: "Small accounts under ~$2K a month in ads",
    focus: ["Dynamic bidding and budget rules", "Recommendations in the console", "No extra cost"],
    monthlyAt: () => 0,
    pickThem: ["Your ad spend is small and you check the console yourself", "You don't need Seller Central and ads in one place"],
    pickRocco: ["You don't have time to work through the console every day", "You want someone to decide, show the reason, and check the result a week later", "You want stock, Buy Box and listings next to ads"],
    source: "Amazon Ads console features",
    angle: "Free tools still need someone to use them.", sub: "Amazon's built-in bidding and recommendations are free, but you still have to read them, decide and click. Rocco does that every morning and asks for one tap.",
  },
];

export const competitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug);

/** Yearly cost at a monthly ad spend (null when the public price doesn't say). */
export function yearlyCost(c: Competitor, adSpend: number): number | null {
  const m = c.monthlyAt(adSpend);
  return m === null ? null : Math.round(m * 12);
}
