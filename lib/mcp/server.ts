import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { hasAccess } from "../access";
import Papa from "papaparse";
import { z } from "zod";
import { parseSearchTermReport } from "../parsers/searchTerm";
import { validateLicenseKey } from "../payments";
import { breakevenAcos, couponMath } from "../rules/coupon";
import { paybackDays, roast, type RoastResult } from "../rules/roast";
import { surgePlan } from "../rules/surge";
import { PLAN } from "../pricing";
import { SITE } from "../site";
import { PLAYBOOK, PLAYBOOK_TOPICS } from "./playbook";
import type { Store, Workspace } from "../store/types";
import { registerMemoryTools, registerStatelessTools } from "./memoryTools";

export const MAX_REPORT_CHARS = 3_000_000;

const INSTRUCTIONS_BASE = `Rocco is the seller's AI Amazon teammate. He decides what to check, judges the data, drafts every change, remembers what was done and checks whether it worked. The seller approves.
Personality: a blunt, funny raccoon who is always on the seller's side. Numbers first, one cheeky line per finding at most.
DATA: get it from the seller's connected Amazon connectors (Amazon's official Ads MCP server / Amazon Ads API, Selling Partner API connectors, and any other Amazon tools they've connected). Call rocco_plan to get the exact reports and columns to pull for a job, pull them, and pass the rows to analyze_report as report_json. Only ask the seller to export a file if no connector can provide the data. If you can't see Amazon Ads or Amazon Selling Partner tools, call setup_check and walk the seller through connecting them (they're official Amazon connectors; the seller signs in to Amazon directly).
analyze_report understands: SP search terms, SP campaigns, SP placements, Sales & Traffic (Business Report), Restock inventory, SP bulk files. It detects the type.
CHANGES: present proposals as an approval list by code (N negative, H harvest, B bid, G budget, P placement, S stock, F structure). Never change anything without the seller's explicit approval of specific codes. After approval, use the seller's Amazon Ads connector to apply exactly those codes (export_changes with format "amazon_ads_api" gives the change list), then log them with apply_changes.
Call amazon_ads_playbook for Rocco's rules. Rocco is not affiliated with Amazon.`;

const INSTRUCTIONS_MEMORY = `${INSTRUCTIONS_BASE}
This connector has memory (a personal Rocco workspace). Start each conversation with rocco_brief; for "check my account" / "morning check", follow rocco_plan("morning_check"). After the seller applies approved codes, call apply_changes so Rocco can check results on the next report. Use set_brand_settings when the seller mentions target ACoS, breakeven, brand terms to protect, or a new brand.`;

const INSTRUCTIONS_STATELESS = `${INSTRUCTIONS_BASE}
This is the shared connector without memory. If the seller wants Rocco to remember changes and check results, call create_workspace and tell them to add their personal connector URL.`;

const money = (c: string, n: number) => `${c}${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => (n < 0 ? "n/a" : `${Math.round(n * 100)}%`);

export function roastSummary(r: RoastResult, full: boolean): string {
  const lines = [
    `## Rocco's roast: grade ${r.grade}`,
    r.headline,
    "",
    `- Period: ${r.days} days · spend ${money(r.currency, r.totals.spend)} · ad sales ${money(r.currency, r.totals.sales)} · ACoS ${pct(r.totals.acos)}`,
    `- Leaking: ${money(r.currency, r.leakTotal)} in this report → ${money(r.currency, r.leakMonthly)}/month → ${money(r.currency, r.leakYearly)}/year`,
    `- ACoS if the leak is cut (sales held): ${pct(r.projectedAcos)}`,
    "",
    "### Top leaks",
    ...r.leaks.slice(0, full ? 10 : 3).map((l) => `- **${l.title}** (${l.count} terms${l.wasted ? `, ${money(r.currency, l.monthly)}/month` : ""}): ${l.line}`),
  ];
  if (r.win) lines.push("", `Best term: "${r.win.term}", ${money(r.currency, r.win.sales)} at ${pct(r.win.acos)} ACoS.`);
  lines.push("", `Fixes found: ${r.fixes.negatives.length} negatives, ${r.fixes.harvest.length} harvests, ${r.fixes.bids.length} bid changes (±${Math.round(r.settings.bidCap * 100)}% cap).`);
  if (full) {
    lines.push("", "### Negatives (add as negative exact / negative product)");
    for (const n of r.fixes.negatives) lines.push(`- "${n.keyword}" in ${n.campaign} / ${n.adGroup}: ${n.reason}, spent ${r.currency}${n.spend}`);
    lines.push("", "### Harvest as exact keywords");
    for (const h of r.fixes.harvest) lines.push(`- "${h.keyword}" (${h.reason}) start bid ${r.currency}${h.suggestedBid}; then negate it in ${h.sourceCampaign}`);
    lines.push("", "### Bid changes");
    for (const b of r.fixes.bids) lines.push(`- ${b.targeting} (${b.matchType}) in ${b.campaign} / ${b.adGroup}: ${r.currency}${b.currentCpc} → ${r.currency}${b.newBid} (${b.changePct > 0 ? "+" : ""}${b.changePct}%): ${b.reason}`);
    lines.push("", "Present these as an approval list. Nothing should be applied without the seller's explicit OK.");
  } else {
    const pb = paybackDays(PLAN.monthlyCents / 100, r.leakMonthly);
    lines.push(
      "",
      `The full fix list (every negative, harvest and bid change, plus an upload-ready bulk file) is part of Rocco's paid plans${pb ? `; Rocco ($119 a month) would pay for itself in about ${pb} days at this leak rate` : ""}. Pass license_key to this tool to unlock, or see ${SITE.url}/pricing.`,
    );
  }
  return lines.join("\n");
}

export interface McpContext {
  store: Store;
  ws: Workspace;
  token: string;
}

export function buildServer(ctx?: McpContext) {
  const server = new McpServer({ name: "rocco", version: "2.0.0", title: "Rocco: your AI Amazon teammate" }, { instructions: ctx ? INSTRUCTIONS_MEMORY : INSTRUCTIONS_STATELESS });
  registerCoreTools(server, ctx);
  if (ctx) registerMemoryTools(server, ctx);
  else registerStatelessTools(server);
  return server;
}

function registerCoreTools(server: McpServer, ctx?: McpContext) {
  const ro = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };

  server.registerTool(
    "roast_ads_report",
    {
      title: "Roast an Amazon ads search term report",
      description:
        "Audit an Amazon Sponsored Products search term report (CSV/TSV text, as downloaded from Amazon Ads, header row included). Returns a Leak Score A–F, money leaking per month/year, top leaks, and counts of negatives, harvests and bid fixes. With a valid license_key, returns every fix.",
      inputSchema: {
        report_csv: z.string().min(20).max(MAX_REPORT_CHARS).describe("The search term report as CSV or TSV text, including the header row."),
        target_acos_percent: z.number().min(5).max(100).optional().describe("Seller's target ACoS in percent. Default 30."),
        min_clicks: z.number().int().min(3).max(100).optional().describe("Clicks with zero orders before a term counts as a leak. Default 10."),
        license_key: z.string().max(200).optional().describe("Rocco license key to unlock the full fix list."),
      },
      annotations: ro,
    },
    async ({ report_csv, target_acos_percent, min_clicks, license_key }) => {
      const table = Papa.parse<unknown[]>(report_csv, { skipEmptyLines: true }).data;
      let r: RoastResult;
      try {
        r = roast(parseSearchTermReport(table), {
          ...(target_acos_percent ? { targetAcos: target_acos_percent / 100 } : {}),
          ...(min_clicks ? { minClicksNegative: min_clicks } : {}),
        });
      } catch (e) {
        return { isError: true, content: [{ type: "text" as const, text: e instanceof Error ? e.message : "Couldn't parse that report." }] };
      }
      let full = ctx?.ws ? hasAccess(ctx.ws) : false;
      let note = "";
      if (license_key) {
        const v = await validateLicenseKey(license_key);
        full = v.ok;
        if (!v.ok) note = `\n\n(License key not accepted: ${v.error})`;
      }
      return { content: [{ type: "text" as const, text: roastSummary(r, full) + note }] };
    },
  );

  server.registerTool(
    "amazon_ads_playbook",
    {
      title: "Rocco's Amazon ads playbook",
      description: "Rocco's operator rules for judging Amazon ads: what to check, thresholds, bid formula, budgets, Black Friday, guardrails, and how to work beside Amazon's own Ads MCP connector.",
      inputSchema: { topic: z.enum(PLAYBOOK_TOPICS).optional().describe(`One of: ${PLAYBOOK_TOPICS.join(", ")}. Omit for all.`) },
      annotations: ro,
    },
    async ({ topic }) => {
      const keys = topic ? [topic] : PLAYBOOK_TOPICS;
      const text = keys.map((k) => `## ${PLAYBOOK[k].title}\n${PLAYBOOK[k].body}`).join("\n\n");
      return { content: [{ type: "text" as const, text }] };
    },
  );

  server.registerTool(
    "breakeven_acos",
    {
      title: "Breakeven and target ACoS",
      description: "Compute breakeven ACoS, target ACoS and max CPC for an Amazon product.",
      inputSchema: {
        price: z.number().positive(),
        product_cost: z.number().min(0).describe("COGS incl. inbound shipping, per unit"),
        referral_fee_percent: z.number().min(0).max(50).default(15),
        fba_fee: z.number().min(0),
        other_costs: z.number().min(0).default(0),
        profit_to_keep_percent: z.number().min(0).max(80).default(10),
        conversion_rate_percent: z.number().min(0.1).max(100).default(10),
      },
      annotations: ro,
    },
    async (a) => {
      const b = breakevenAcos({ price: a.price, cogs: a.product_cost, referralPct: a.referral_fee_percent, fbaFee: a.fba_fee, otherCosts: a.other_costs, targetProfitPct: a.profit_to_keep_percent, conversionRate: a.conversion_rate_percent });
      return { content: [{ type: "text" as const, text: `Breakeven ACoS: ${pct(b.breakeven)}\nTarget ACoS (keeps ${a.profit_to_keep_percent}% profit): ${pct(b.target)}\nProfit per unit before ads: $${b.profitBeforeAds.toFixed(2)}\nMax CPC at breakeven: $${b.maxCpcBreakeven.toFixed(2)} · at target: $${b.maxCpcTarget.toFixed(2)}` }] };
    },
  );

  server.registerTool(
    "coupon_profit",
    {
      title: "Amazon coupon profit check",
      description: "Profit per unit before and after an Amazon coupon, margin, the deepest safe discount, and how many coupon sales are needed to match full-price profit. Fees are inputs: confirm current coupon fees in Seller Central.",
      inputSchema: {
        price: z.number().positive(),
        discount: z.number().min(0),
        discount_type: z.enum(["percent", "amount"]).default("percent"),
        product_cost: z.number().min(0),
        referral_fee_percent: z.number().min(0).max(50).default(15),
        fba_fee: z.number().min(0),
        ad_cost_per_unit: z.number().min(0).default(0),
        coupon_fee_percent: z.number().min(0).max(20).default(2.5),
        coupon_fixed_fee: z.number().min(0).default(5),
        expected_units: z.number().int().min(0).default(100),
      },
      annotations: ro,
    },
    async (a) => {
      const m = couponMath({ price: a.price, discountType: a.discount_type === "percent" ? "pct" : "amt", discount: a.discount, cogs: a.product_cost, referralPct: a.referral_fee_percent, fbaFee: a.fba_fee, adCostPerUnit: a.ad_cost_per_unit, couponFeePct: a.coupon_fee_percent, couponFixedFee: a.coupon_fixed_fee, units: a.expected_units });
      return { content: [{ type: "text" as const, text: `Price after coupon: $${m.salePrice.toFixed(2)}\nProfit/unit without coupon: $${m.profitBefore.toFixed(2)} · with coupon: $${m.profitAfter.toFixed(2)} (margin ${(m.marginAfter * 100).toFixed(1)}%)\nTotal profit on ${a.expected_units} units: $${m.totalProfit.toFixed(2)}\nDeepest safe coupon: ${m.maxSafePct.toFixed(0)}%${m.unitsToMatch ? `\nCoupon sales needed to match full-price profit: ${m.unitsToMatch}` : ""}` }] };
    },
  );

  server.registerTool(
    "bfcm_surge_plan",
    {
      title: "Black Friday / Cyber Monday budget plan",
      description: "Day-by-day budget, winner-bid and placement plan for Nov 19 – Dec 2, 2026, with guardrails.",
      inputSchema: {
        daily_budget: z.number().positive().describe("Current total daily ad budget"),
        target_acos_percent: z.number().min(1).max(100),
        breakeven_acos_percent: z.number().min(-100).max(100),
        aggression: z.enum(["careful", "normal", "bold"]).default("normal"),
      },
      annotations: ro,
    },
    async (a) => {
      const p = surgePlan({ dailyBudget: a.daily_budget, targetAcos: a.target_acos_percent / 100, breakevenAcos: a.breakeven_acos_percent / 100, aggression: a.aggression });
      const rows = p.days.map((d) => `| ${d.label} | $${Math.round(d.budget)} (×${d.budgetMult}) | ${d.winnerBidPct ? `+${d.winnerBidPct}%` : "normal"} | ${d.topOfSearchPct ? `+${d.topOfSearchPct}%` : "–"} | ${Math.round(d.acosCeiling * 100)}% | ${d.note} |`);
      const text = [...p.warnings.map((w) => `⚠ ${w}`), `Total budget: $${Math.round(p.totalBudget)} (+$${Math.round(p.extraBudget)} vs normal)`, "", "| Day | Budget | Winner bids | Top of search | Cut above ACoS | Note |", "|---|---|---|---|---|---|", ...rows].join("\n");
      return { content: [{ type: "text" as const, text }] };
    },
  );

}

