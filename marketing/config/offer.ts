/**
 * The offer, in one place. Every marketing asset (videos, PDFs, pages, emails, carousels) reads price, guarantee,
 * links and handles from here. Never type a price into an asset.
 *
 * Plan prices and guarantee days come from the app's own source, lib/pricing.ts (PLAN). When the price rises:
 * Praveen raises both Dodo products and PLAN in lib/pricing.ts (docs/ROUTINE.md), then re-render the assets.
 * The values the app only has as page copy (price-rise step, included accounts, time math) are defined here and
 * mirror components/start/ValueCalc.tsx and components/PricingPlans.tsx. If the site changes them, change them here.
 *
 * Keep this file to erasable TypeScript (no enums, no path aliases) so plain Node can load it:
 * marketing/scripts/load-config.mjs.
 */
import { PLAN } from "../../lib/pricing";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// ── Price ────────────────────────────────────────────────────────────────────────────────────────────────────
const monthly = PLAN.monthlyCents / 100; // 279
const annual = PLAN.annualCents / 100; // 2790
const perMonthAnnual = Math.round(annual / 12); // 233
const saveYearly = monthly * 12 - annual; // 558

/** Mirrors PriceRise in components/start/ValueCalc.tsx. Applied by hand, so the step is copy, not code. */
export const PRICE_RISE = { everyHires: 5, monthlyStep: 10, annualStep: 100 } as const;
/** Mirrors components/PricingPlans.tsx and app/pricing/page.tsx. */
export const ACCOUNTS = { included: 3, extraPerMonth: 49 } as const;
/** Mirrors ValueCalc: hours a day x 22 workdays x $35 an hour. Always show the assumption next to the result. */
export const TIME_MATH = { hoursPerDay: 1, ratePerHour: 35, workdaysPerMonth: 22 } as const;
const timeCostMonthly = TIME_MATH.hoursPerDay * TIME_MATH.workdaysPerMonth * TIME_MATH.ratePerHour; // 770

export const OFFER = {
  product: "Rocco",
  planName: "Hire Rocco",
  cta: "Hire Rocco",
  oneLiner: "Your AI Amazon manager: you approve, Rocco does the rest.",
  tagline: "Real work without the fluff.",
  roccoVoice: "I find what to fix. You tap approve. I make the change in Amazon, then check it worked.",

  price: {
    monthly, // 279
    annual, // 2790
    perMonthAnnual, // 233
    saveYearly, // 558
    monthlyText: usd(monthly), // "$279"
    annualText: usd(annual), // "$2,790"
    perMonthAnnualText: usd(perMonthAnnual), // "$233"
    saveYearlyText: usd(saveYearly), // "$558"
    /** "$233/mo billed yearly" */
    from: `${usd(perMonthAnnual)}/mo billed yearly`,
    /** "$2,790 a year (2 months free) or $279 a month" */
    line: `${usd(annual)} a year (2 months free) or ${usd(monthly)} a month`,
    /** "$2,790/year or $279/month" */
    short: `${usd(annual)}/year or ${usd(monthly)}/month`,
    yearlyPerk: "2 months free",
    includes: `Whole team. ${ACCOUNTS.included} Amazon accounts included (each marketplace counts as one), +${usd(ACCOUNTS.extraPerMonth)}/mo each extra.`,
    currencyNote: "Prices in USD; checkout shows your local price.",
    checkoutNote: "Secure checkout by Dodo Payments.",
  },

  priceRise: {
    ...PRICE_RISE,
    /** "Prices go up every 5 hires: +$10 a month, +$100 a year." */
    line: `Prices go up every ${PRICE_RISE.everyHires} hires: +${usd(PRICE_RISE.monthlyStep)} a month, +${usd(PRICE_RISE.annualStep)} a year.`,
    nextMonthly: monthly + PRICE_RISE.monthlyStep, // 129
    nextAnnual: annual + PRICE_RISE.annualStep, // 1290
  },

  guarantee: {
    days: PLAN.guaranteeDays, // 7
    short: `${PLAN.guaranteeDays}-day money-back guarantee`,
    full: `If you don't like the fixes I give you in your first ${PLAN.guaranteeDays} days, email human@rocco.works and you get a full refund. No call, no forms.`,
  },

  /** There is no free plan, and this is the reason to give. */
  whyPaid: "No free plan: reading an Amazon account costs real money to run.",

  timeMath: {
    ...TIME_MATH,
    monthly: timeCostMonthly, // 770
    monthlyText: usd(timeCostMonthly), // "$770"
    /** Use the whole line, so the assumption always travels with the number. */
    line: `${TIME_MATH.hoursPerDay} hour a day checking ads, bids and stock at ${usd(TIME_MATH.ratePerHour)} an hour is ${usd(timeCostMonthly)} a month. Rocco is ${usd(perMonthAnnual)} a month, billed yearly.`,
    assumption: `Assumes ${TIME_MATH.hoursPerDay} hour a day, ${TIME_MATH.workdaysPerMonth} workdays a month, ${usd(TIME_MATH.ratePerHour)} an hour.`,
  },

  disclaimer: "Not affiliated with Amazon.",
  disclaimerFull: "Rocco is an independent tool and is not affiliated with, endorsed by or sponsored by Amazon.",
  dataPartner: "You sign in on Amazon's own page through DataDoe, an Amazon-approved data partner. Rocco never sees your password. Remove access anytime in Seller Central.",
} as const;

/**
 * Hires left at today's price. `sold` is live (GET https://rocco.works/api/price, field "sold"). Never bake the
 * result into a rendered asset: it goes stale with the next hire. In static assets use the priceRise.line only.
 */
export const hiresLeftAtThisPrice = (sold: number) => PRICE_RISE.everyHires - (sold % PRICE_RISE.everyHires);

// ── Links and handles ────────────────────────────────────────────────────────────────────────────────────────
export const SITE_URL = "https://rocco.works";

export const LINKS = {
  home: `${SITE_URL}/`,
  pricing: `${SITE_URL}/pricing`,
  help: `${SITE_URL}/help`,
  press: `${SITE_URL}/press`,
  email: "human@rocco.works",
  /** PLACEHOLDER: no booking link exists in the repo or on the site yet. Praveen to supply. */
  setupCall: "{{SETUP_CALL_URL}}",
  /** PLACEHOLDER: the newest video (YouTube or wherever it lives). The /start page hides its button until this is a real URL. */
  latestVideo: "{{LATEST_VIDEO_URL}}",
} as const;

export const HANDLES = {
  founder: { name: "Praveen", x: "@veenonx", threads: "veenonig", instagram: "veenonig" },
  /** Instagram, LinkedIn and YouTube as given by Praveen on Nov 22, 2026. YouTube has no handle yet. */
  brand: { x: "@roccoworks", xUrl: "https://x.com/roccoworks", instagram: "rocco.works", linkedin: "rocco", youtube: "{{YT_HANDLE}}" },
} as const;

/** True once a placeholder link has been replaced by a real URL. Pages hide buttons for links that aren't real yet. */
export const isLive = (url: string) => /^https?:\/\//.test(url);

export type UtmSource = "x" | "threads" | "instagram" | "linkedin" | "reddit" | "youtube" | "tiktok" | "email" | "dm" | "pdf" | "video" | "carousel";
export interface Utm { source: UtmSource; medium?: string; campaign: string; content?: string }

/**
 * A rocco.works link with UTM tags. `path` is a site path ("/", "/pricing") or a full rocco.works URL.
 * utm("/pricing", { source: "x", campaign: "day7-thread" })
 *   -> https://rocco.works/pricing?utm_source=x&utm_medium=social&utm_campaign=day7-thread
 */
export function utm(path: string, { source, medium, campaign, content }: Utm): string {
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_URL) throw new Error(`utm(): only rocco.works links, got ${url.origin}`);
  const m = medium ?? (source === "email" ? "email" : source === "dm" ? "dm" : source === "pdf" || source === "video" || source === "carousel" ? "asset" : "social");
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", m);
  url.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  if (content) url.searchParams.set("utm_content", content.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  return url.toString();
}

// ── Hackathon clock ──────────────────────────────────────────────────────────────────────────────────────────
export const HACKATHON = { name: "Ship or Die", prize: 100_000, prizeText: "$100K", start: "2026-11-16", end: "2026-12-16", goalPayingSellers: 100 } as const;

/** Day N of the hackathon: days since Nov 16 + 1 (Nov 22 = day 7). Pass "YYYY-MM-DD" or a Date. */
export function hackathonDay(date: string | Date = new Date()): number {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  return Math.floor((d.getTime() - new Date(`${HACKATHON.start}T00:00:00Z`).getTime()) / 86_400_000) + 1;
}

// ── For the copy lint ────────────────────────────────────────────────────────────────────────────────────────
/** Every dollar amount an asset may state about the offer. marketing/scripts/lint-copy.mjs builds its allowlist from this. */
export const OFFER_DOLLAR_AMOUNTS: readonly number[] = [
  monthly, annual, perMonthAnnual, saveYearly,
  PRICE_RISE.monthlyStep, PRICE_RISE.annualStep, OFFER.priceRise.nextMonthly, OFFER.priceRise.nextAnnual,
  ACCOUNTS.extraPerMonth,
  TIME_MATH.ratePerHour, timeCostMonthly,
  HACKATHON.prize,
];
