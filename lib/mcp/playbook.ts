import { SURGE_RULES } from "../rules/surge";

/**
 * Rocco's operator playbook: the "judgment" layer an AI uses on top of raw Amazon Ads data
 * (whether that data comes from a report upload or from Amazon's own Ads MCP connector).
 */
export const PLAYBOOK: Record<string, { title: string; body: string }> = {
  overview: {
    title: "How Rocco audits an Amazon ads account",
    body: [
      "Order of work: 1) stop the bleeding (negatives), 2) protect winners (harvest + fund), 3) tune bids, 4) budgets and placements, 5) re-check weekly.",
      "Always work from the search term report for the last 30–60 days. Never judge a term on under ~10 clicks.",
      "Every recommendation gets: what to change, the number, why (clicks, spend, orders, ACoS), and how to undo it.",
      "Use the seller's target ACoS. If unknown, compute breakeven ACoS = (price − referral − FBA − COGS − other) ÷ price, then target = breakeven − desired profit margin.",
      "Present changes as an approval list. Apply nothing without explicit approval from the seller. Log every change so it can be reversed.",
    ].join("\n"),
  },
  negatives: {
    title: "Negatives",
    body: [
      "Negate a search term (negative exact, in the ad group where it spent) when clicks ≥ threshold (default 10) and orders = 0.",
      "Raise the threshold to 15–20 for low conversion-rate or high-price products (expected clicks per order is higher).",
      "ASIN search terms (B0…) with no orders → negative product targeting, not negative keyword.",
      "Junk intent (free, how to, DIY, used, repair, manual, near me, wholesale, jobs) can be negated sooner, at ~5–8 clicks.",
      "Never negate a term that is also your own exact keyword in the same ad group: lower its bid or pause it instead.",
      "Prefer negative exact over negative phrase unless a junk word repeats across many terms.",
    ].join("\n"),
  },
  harvest: {
    title: "Harvesting winners",
    body: [
      "Harvest a search term from auto/broad/phrase into an exact (or product-targeting) campaign when orders ≥ 2 and ACoS ≤ target, and it isn't already targeted as exact.",
      "Start bid ≈ its average CPC × 1.1.",
      "Then add it as a negative exact in the source ad group so the two campaigns don't compete.",
    ].join("\n"),
  },
  bids: {
    title: "Bid changes",
    body: [
      "New bid = current bid × (target ACoS ÷ actual ACoS), capped at ±20% per step. Re-check after 7 days, then step again.",
      "Zero orders with clicks ≥ threshold → −20% (or pause if it's a single-term target with big spend).",
      "Skip moves under 5% and targets with fewer clicks than the threshold: not enough data.",
      "In peak season (BFCM), only raise bids on proven winners; tolerate ACoS up to breakeven on peak days only.",
    ].join("\n"),
  },
  budgets: {
    title: "Budgets and placements",
    body: [
      "Fund the campaigns holding your winners first. A winner that runs out of budget by midday is the most expensive leak there is.",
      "Move budget from campaigns above breakeven ACoS to campaigns under target with impression share left.",
      "Top-of-search placement adjustments: only on campaigns already profitable; +10–25%, never blanket.",
      "No budget increases on SKUs with under 21 days of stock cover.",
    ].join("\n"),
  },
  bfcm: { title: "Black Friday / Cyber Monday 2026", body: ["Black Friday = Nov 27, 2026, Cyber Monday = Nov 30. Ramp from Nov 19, peak Nov 26–30, cool down Dec 1–2.", ...SURGE_RULES].join("\n") },
  guardrails: {
    title: "Guardrails (non-negotiable)",
    body: [
      "Never apply changes to a seller's account without explicit approval of the specific list of changes.",
      "Never move a bid more than ±20% in one step. Never raise bids account-wide.",
      "Never touch campaigns for SKUs that are out of stock or suppressed: fix the listing first.",
      "Keep a change log (what, old value, new value, why, date) so every change can be reversed.",
      "Don't negate brand terms or your own ASINs without asking.",
    ].join("\n"),
  },
  with_amazon_ads_mcp: {
    title: "Working beside Amazon's Ads MCP connector",
    body: [
      "If the user also has Amazon's official Ads connector (requires Amazon Ads API access): use it to pull the search term report and current bids, then use Rocco's roast_ads_report and this playbook to decide, then present an approval list.",
      "Only after the user approves a specific list, use Amazon's connector to apply exactly those changes, one batch at a time, and log them.",
      "Without Amazon's connector: ask the user to download the Sponsored Products search term report (Amazon Ads → Measurement & Reporting → Sponsored ads reports → Search term, Summary, last 30–60 days) and paste or attach it.",
    ].join("\n"),
  },
};

export const PLAYBOOK_TOPICS = Object.keys(PLAYBOOK) as [string, ...string[]];
