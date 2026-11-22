import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Papa from "papaparse";
import { z } from "zod";
import { analyze, REPORT_HELP } from "../analyze";
import { parseBulk } from "../parsers/bulk";
import { jsonToTable, recordsToTable } from "../parsers/json";
import { dataPlan, APPLY_GUIDE, JOBS, type Job } from "./sources";
import { setupHelp } from "./setup";
import { getPriceState, validateLicenseKey } from "../payments";
import { hireUrl, paywall } from "../paywall";
import { hasAccess } from "../access";
import { later, onFreshCheck } from "../notify";
import { proposalsApiChanges, proposalsBulkCsv, proposalsCsv } from "../rules/export";
import { SITE } from "../site";
import { getStore } from "../store";
import type { ActionStatus } from "../store/types";
import { applyChanges, buildBrief, clearPending, createWorkspace, DEFAULT_BRAND, ensureLinkCode, revertChanges, runAnalysis, setBrandSettings } from "../workspace";
import { listingGaps } from "../rules/terms";
import { FREE_PROPOSALS, formatActions, formatAnalysis, formatBrief, proposalLine } from "./format";
import type { McpContext } from "./server";

export const MAX_CSV = 3_000_000;
const ro = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const rw = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const fail = (t: string) => ({ isError: true, content: [{ type: "text" as const, text: t }] });
const parse = (csv: string) => Papa.parse<unknown[]>(csv, { skipEmptyLines: true }).data;

/** Rows from another connector (JSON) or an exported file (CSV/TSV) → table. */
const dataArgs = {
  report_json: z.string().max(MAX_CSV).optional().describe("Data from another connector (e.g. Amazon Ads API report rows, SP-API report JSON). Any JSON containing an array of rows."),
  rows: z.array(z.record(z.string(), z.unknown())).max(50000).optional().describe("Rows as objects, if you already have them parsed."),
  report_csv: z.string().max(MAX_CSV).optional().describe("Fallback: an exported report as CSV/TSV text with its header row."),
};
function toTable(a: { report_json?: string; rows?: Record<string, unknown>[]; report_csv?: string }): unknown[][] {
  if (a.rows?.length) return recordsToTable(a.rows);
  const raw = (a.report_json ?? a.report_csv ?? "").trim();
  if (!raw) throw new Error("Pass the data as report_json (from a connector) or report_csv.");
  if (raw.startsWith("{") || raw.startsWith("[")) {
    const t = jsonToTable(raw);
    if (t) return t;
  }
  return parse(raw);
}
const brandArg = z.string().max(80).optional().describe(`Brand / seller account name. Defaults to "${DEFAULT_BRAND}".`);
const reportList = Object.values(REPORT_HELP).map((h) => `${h.name} (${h.where})`).join("; ");

/** Approvals the team sent by text: the AI should apply these first. */
function pendingNote(pending?: { type: "apply" | "undo"; codes: string[]; by: string; at: string }[]): string {
  if (!pending?.length) return "";
  const L = ["## 📱 Approved by text, waiting for you"];
  for (const p of pending) L.push(`- ${p.type === "apply" ? "APPLY" : "UNDO"} ${p.codes.join(", ")} (by ${p.by}, ${p.at.slice(0, 10)})`);
  L.push("Do these first: for APPLY, call export_changes for those codes, apply exactly them with the seller's Amazon Ads connector, then apply_changes. For UNDO, follow revert_changes. Confirm with the seller in one line before applying.", "", "");
  return L.join("\n");
}

export function registerMemoryTools(server: McpServer, { store, ws, token }: McpContext) {
  /** Until someone on the team texts Rocco: a one-tap link that joins their phone to this workspace. */
  async function textMe(): Promise<string> {
    if ((await store.listPhones({ workspaceId: ws.id })).some((p) => p.phone.startsWith("+"))) return "";
    return `\n\n📱 **Get these numbers by text every morning:** ${SITE.url}/j/${await ensureLinkCode(store, ws)} (open on your iPhone, tap, send: your phone joins this Rocco).`;
  }


  /** Paywall line for the chat, only at a value moment (see lib/paywall). Empty otherwise. */
  async function offer(prefer?: { worked?: { id: string; saved?: number } }): Promise<string> {
    if (hasAccess(ws)) return "";
    const b = await buildBrief(store, ws);
    const price = await getPriceState().catch(() => null);
    const p = (prefer?.worked && paywall(ws, b, "worked", { price, key: prefer.worked.id, saved: prefer.worked.saved })) || paywall(ws, b, "found", { price });
    if (!p) return "";
    await store.saveWorkspace(ws);
    return `\n\n---\n${p.text}\n**Hire Rocco:** ${p.url}\n_(Show this to the seller as is, with the link. Paying unlocks this workspace automatically.)_`;
  }

  server.registerTool("rocco_brief", {
    title: "Rocco's brief: what to do today",
    description: "Start here (also when the seller says \"apply my approved fixes\"). Lists fixes the team approved on the dashboard or by text that are waiting to be applied, then Rocco's to-do list from memory: results of past changes, changes due for a check, proposed changes not applied yet, trends per brand, which reports to refresh, and seasonal reminders.",
    inputSchema: {},
    annotations: ro,
  }, async () => { later(() => onFreshCheck(store, ws)); return text(pendingNote(ws.pending) + formatBrief(await buildBrief(store, ws)) + `\n\n_Dashboard: ${SITE.url}/w/${token} · Follow-up reminders in your calendar: webcal://${SITE.domain}/w/${token}/calendar.ics_` + (await textMe()) + (await offer())); });


  server.registerTool("setup_check", {
    title: "Connect Amazon Ads & Seller Central",
    description: "Use when the seller hasn't connected Amazon's official Ads or Selling Partner (Seller Central) connectors yet, or asks how. Tell it which Amazon tools you can currently see. Returns the exact URLs for their marketplace region and the steps for their AI app.",
    inputSchema: {
      client: z.enum(["claude", "claude_code", "chatgpt", "cursor"]).default("claude"),
      marketplace: z.string().max(60).default("US").describe("e.g. US, UK, Germany, Japan"),
      has_amazon_ads_connector: z.boolean().default(false),
      has_seller_central_connector: z.boolean().default(false),
    },
    annotations: ro,
  }, async (a) => text(setupHelp({ client: a.client, marketplace: a.marketplace, hasAds: a.has_amazon_ads_connector, hasSeller: a.has_seller_central_connector, token: token })));

  server.registerTool("rocco_plan", {
    title: "What data to pull for a job",
    description: `Rocco's data plan for a job: which reports/columns to pull from the seller's connected Amazon connectors (Amazon Ads API, SP-API), then what to do. Jobs: ${JOBS.join(", ")}. Use morning_check for "check my account".`,
    inputSchema: { job: z.enum(JOBS).default("morning_check") },
    annotations: ro,
  }, async ({ job }) => text(dataPlan(job as Job) + "\n\n" + APPLY_GUIDE));

  server.registerTool("listing_gaps", {
    title: "Listing keyword gaps",
    description: "Compare the seller's listing (title, bullets, backend search terms) with the search terms that actually convert in their ads (from Rocco's memory of the latest search term report). Returns words to add to the title or backend keywords.",
    inputSchema: {
      title: z.string().min(3).max(500),
      bullets: z.string().max(5000).optional(),
      backend_keywords: z.string().max(1000).optional(),
      brand: brandArg,
    },
    annotations: ro,
  }, async ({ title, bullets, backend_keywords, brand }) => {
    const snap = (await store.listSnapshots(ws.id, { brand: brand || DEFAULT_BRAND, kind: "sp_search_term", limit: 1 }))[0];
    if (!snap?.extra?.terms?.length) return fail("Rocco needs a search term report first. Attach one and say \"analyze this\".");
    const gaps = listingGaps(snap.extra.terms, { title, bullets, backend: backend_keywords });
    if (!gaps.length) return text("Your listing already covers the words in every converting search term. Nice. 🦝");
    const title5 = gaps.filter((g) => g.where === "title");
    const back = gaps.filter((g) => g.where === "backend");
    const L = [`## Listing gaps (from ${snap.createdAt.slice(0, 10)} search terms)`];
    if (title5.length) { L.push("", "### Worth putting in the title (top converting terms)"); L.push(...title5.map((g) => `- "${g.term}" (${g.orders} orders, $${Math.round(g.sales)}): missing **${g.missing.join(", ")}**`)); }
    if (back.length) { L.push("", "### Add to backend search terms"); L.push(...back.map((g) => `- "${g.term}" (${g.orders} orders): missing **${g.missing.join(", ")}**`)); }
    const words = [...new Set(back.flatMap((g) => g.missing))];
    if (words.length) L.push("", `Backend keyword line to paste (under 250 bytes): \`${words.join(" ").slice(0, 249)}\``);
    return text(L.join("\n"));
  });

  server.registerTool("analyze_report", {
    title: "Analyze any Amazon report",
    description: `Analyze Amazon data pulled from the seller's connectors (Amazon Ads API / SP-API rows as JSON) or an exported report. Auto-detects: search terms, campaigns, placements, Sales & Traffic, restock, bulk. Saves a snapshot to memory, returns findings + an approval list of coded changes, flags what's new since last time, and checks past changes against the new data.`,
    inputSchema: { ...dataArgs, brand: brandArg },
    annotations: rw,
  }, async ({ report_json, rows, report_csv, brand }) => {
    try {
      const b = brand || DEFAULT_BRAND;
      const { out, run, checked, previous, diff, bench } = await runAnalysis(store, ws, b, toTable({ report_json, rows, report_csv }));
      const win = checked.find((a) => a.status === "worked");
      return text(formatAnalysis(out, { licensed: hasAccess(ws), runId: run?.id, checked, previous, memory: true, diff, bench }) + (await offer(win ? { worked: { id: win.id, saved: win.result?.savedEstimate } } : undefined)));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Couldn't analyze that report.");
    }
  });

  server.registerTool("apply_changes", {
    title: "Log approved changes",
    description: "Record changes the seller approved and applied (by code, e.g. \"N1-N4, B2\") so Rocco tracks them, sets a follow-up date and checks results on the next report. Uses the latest proposals unless run_id is given. Only call after the seller explicitly approved these codes.",
    inputSchema: {
      codes: z.array(z.string().max(40)).min(1).max(200).describe('Codes like ["N1-N4", "B2", "H1"]'),
      brand: brandArg,
      run_id: z.string().max(40).optional().describe("Proposal run id (first 8 chars ok). Defaults to the latest run for the brand."),
      note: z.string().max(500).optional(),
    },
    annotations: rw,
  }, async ({ codes, brand, run_id, note }) => {
    try {
      let runId = run_id;
      if (runId && runId.length < 36) runId = (await store.listRuns(ws.id, { limit: 50 })).find((r) => r.id.startsWith(runId!))?.id;
      const res = await applyChanges(store, ws, codes, { runId, brand: brand || undefined, note, freeLimit: hasAccess(ws) ? undefined : FREE_PROPOSALS });
      await clearPending(store, ws, "apply", [...res.actions.map((x) => x.code), ...res.dupes]);
      const L = [`Logged ${res.actions.length} change${res.actions.length === 1 ? "" : "s"} for ${res.brand}. Rocco will re-check them after ${res.actions[0]?.followUpAt.slice(0, 10) ?? "–"} (just ask "did last week's changes work?" and he'll pull fresh data with rocco_plan("results_check")).`];
      L.push(...res.actions.map((a) => proposalLine(a.proposal) + ` · id \`${a.id.slice(0, 8)}\``));
      if (res.dupes.length) L.push(`Already logged: ${res.dupes.join(", ")}.`);
      if (res.unknown.length) L.push(`Unknown codes: ${res.unknown.join(", ")}.`);
      if (res.locked.length) L.push(`Not logged: ${res.locked.join(", ")}. Changes need an active Rocco ($1,190/yr or $119/mo): ${hireUrl(ws)}. Or activate a license (${SITE.url}/pricing) to track everything.`);
      return text(L.join("\n"));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Couldn't log those changes.");
    }
  });

  server.registerTool("list_changes", {
    title: "Change history",
    description: "Everything the seller applied with Rocco: what, when, why, follow-up date and measured result.",
    inputSchema: {
      brand: brandArg,
      status: z.enum(["applied", "worked", "no_effect", "worse", "not_enough_data", "reverted"]).optional(),
      limit: z.number().int().min(1).max(200).default(30),
    },
    annotations: ro,
  }, async ({ brand, status, limit }) => text(formatActions(await store.listActions(ws.id, { brand: brand || undefined, status: status ? [status as ActionStatus] : undefined, limit }))));

  server.registerTool("revert_changes", {
    title: "Undo changes",
    description: "Mark logged changes as reverted and return the exact steps to undo each one in Amazon Ads. Use the 8-character ids from list_changes, or the codes a teammate asked to undo by text.",
    inputSchema: { change_ids: z.array(z.string().max(40)).min(1).max(100) },
    annotations: rw,
  }, async ({ change_ids }) => {
    const hit = await revertChanges(store, ws, change_ids);
    if (!hit.length) return fail("No matching changes. Use the ids from list_changes.");
    await clearPending(store, ws, "undo", [...hit.map((x) => x.code), ...change_ids]);
    return text(["Marked as reverted. To undo in Amazon Ads:", ...hit.map((a) => `- **${a.code}** ${a.proposal.undo}`)].join("\n"));
  });

  server.registerTool("set_brand_settings", {
    title: "Brand settings",
    description: "Save per-brand settings Rocco uses in every analysis: target and breakeven ACoS, click threshold for negatives, protected terms Rocco must never negate (brand names, hero keywords), and protected campaigns (launch, ranking, brand defense) where zero-sale terms are expected. Ask the seller for their margin to set breakeven ACoS: it makes every cut decision sharper.",
    inputSchema: {
      brand: brandArg,
      target_acos_percent: z.number().min(1).max(200).optional(),
      breakeven_acos_percent: z.number().min(-100).max(200).optional(),
      min_clicks: z.number().int().min(3).max(100).optional(),
      protected_terms: z.array(z.string().max(80)).max(100).optional(),
      protected_campaigns: z.array(z.string().max(120)).max(100).optional().describe("Campaign names (or parts) meant to spend without immediate sales: never auto-negated."),
      notes: z.string().max(1000).optional(),
    },
    annotations: rw,
  }, async (a) => {
    const saved = await setBrandSettings(store, ws, a.brand || DEFAULT_BRAND, {
      targetAcos: a.target_acos_percent !== undefined ? a.target_acos_percent / 100 : undefined,
      breakevenAcos: a.breakeven_acos_percent !== undefined ? a.breakeven_acos_percent / 100 : undefined,
      minClicks: a.min_clicks, protectedTerms: a.protected_terms, protectedCampaigns: a.protected_campaigns, notes: a.notes,
    });
    return text(`Saved for ${a.brand || DEFAULT_BRAND}: ${JSON.stringify(saved)}`);
  });

  server.registerTool("export_changes", {
    title: "Export changes as a file",
    description: "Export the latest approval list (or chosen codes) as CSV. With the seller's bulk file (CSV) it returns Bulksheets 2.0 rows ready to upload in Amazon Ads → Bulk operations. Requires a license.",
    inputSchema: {
      codes: z.array(z.string().max(40)).max(200).optional().describe("Only these codes. Default: all from the latest run."),
      brand: brandArg,
      bulk_csv: z.string().max(MAX_CSV).optional().describe("Sponsored Products bulk file as CSV (for campaign/ad group/keyword IDs)."),
      format: z.enum(["amazon_ads_api", "csv"]).default("amazon_ads_api").describe("amazon_ads_api: change list to apply with the seller's Amazon Ads connector. csv: fix list (+ bulk rows if bulk_csv given)."),
    },
    annotations: ro,
  }, async ({ codes, brand, bulk_csv, format }) => {
    const { expandCodes, latestRuns } = await import("../workspace");
    const runs = await latestRuns(store, ws, brand || DEFAULT_BRAND);
    if (!runs.length) return fail("No proposals yet. Analyze some data first.");
    if (!hasAccess(ws) && format !== "amazon_ads_api") return fail(`File exports need an active Rocco: ${hireUrl(ws)}`);
    const want = codes?.length ? new Set(expandCodes(codes)) : null;
    const pool = runs.flatMap((r) => (hasAccess(ws) ? r.proposals : r.proposals.slice(0, FREE_PROPOSALS)));
    const ps = pool.filter((p) => !want || want.has(p.code));
    if (!ps.length) return fail(hasAccess(ws) ? "No matching codes." : `Those codes need an active Rocco ($1,190/yr or $119/mo): ${hireUrl(ws)}. ${SITE.url}/pricing`);
    if (format === "amazon_ads_api") {
      const missingIds = ps.filter((p) => ["negative", "bid", "budget", "placement"].includes(p.kind) && !p.ids?.campaignId).map((p) => p.code);
      return text([`### Change list for Amazon's Ads connector (${ps.length})`, "Apply only the codes the seller approved. Then call apply_changes with the same codes.", "```json", JSON.stringify(proposalsApiChanges(ps), null, 2), "```",
        missingIds.length ? `IDs unknown for ${missingIds.join(", ")} (data came from a file). Look them up by campaign/ad group name with the Amazon Ads connector before applying.` : ""].join("\n"));
    }
    const out = [`### Fix list (${ps.length} changes)`, "```csv", proposalsCsv(ps), "```"];
    if (bulk_csv) {
      try {
        const b = proposalsBulkCsv(ps, parseBulk(parse(bulk_csv)));
        out.push("", `### Bulk upload (${b.matched} rows${b.skipped.length ? `; not in bulk: ${b.skipped.join(", ")}` : ""})`, "Save as .csv and upload in Amazon Ads → Bulk operations. Review first.", "```csv", b.csv, "```");
      } catch (e) { out.push("", `Bulk file problem: ${e instanceof Error ? e.message : "unreadable"}`); }
    }
    return text(out.join("\n"));
  });

  server.registerTool("activate_license", {
    title: "Activate license",
    description: "Attach a Rocco license key (from the purchase email) to this workspace to unlock every proposal, full tracking and exports.",
    inputSchema: { license_key: z.string().min(4).max(200) },
    annotations: rw,
  }, async ({ license_key }) => {
    const v = await validateLicenseKey(license_key);
    if (!v.ok) return fail(v.error ?? "That key didn't work.");
    ws.licensed = true;
    ws.licenseKey = license_key.trim();
    await store.saveWorkspace(ws);
    return text("License active. Rocco now shows every change, tracks all of them, and exports bulk files. 🦝");
  });

  server.registerTool("workspace_link", {
    title: "Open the Rocco dashboard",
    description: "Where the seller can see their Rocco history in a browser.",
    inputSchema: {},
    annotations: ro,
  }, async () => text(`Your Rocco dashboard: ${SITE.url}/w/${token}\nIt shows your change log, results and history. The link is private (same key as your connector).`));
}

/** Tools for the shared, memory-less connector. */
export function registerStatelessTools(server: McpServer) {
  server.registerTool("analyze_report", {
    title: "Analyze any Amazon report",
    description: `Analyze Amazon data pulled from the seller's connectors (Amazon Ads API / SP-API rows as JSON) or an exported report. Auto-detects the type. Returns findings and an approval list. No memory on this shared connector.`,
    inputSchema: {
      ...dataArgs,
      target_acos_percent: z.number().min(1).max(200).optional(),
      license_key: z.string().max(200).optional(),
    },
    annotations: ro,
  }, async ({ report_json, rows, report_csv, target_acos_percent, license_key }) => {
    try {
      const out = analyze(toTable({ report_json, rows, report_csv }), { targetAcos: target_acos_percent ? target_acos_percent / 100 : undefined });
      const licensed = license_key ? (await validateLicenseKey(license_key)).ok : false;
      return text(formatAnalysis(out, { licensed, memory: false }));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Couldn't analyze that report.");
    }
  });

  server.registerTool("rocco_plan", {
    title: "What data to pull for a job",
    description: `Rocco's data plan: which reports/columns to pull from the seller's connected Amazon connectors for a job (${JOBS.join(", ")}).`,
    inputSchema: { job: z.enum(JOBS).default("morning_check") },
    annotations: ro,
  }, async ({ job }) => text(dataPlan(job as Job) + "\n\n" + APPLY_GUIDE));


  server.registerTool("setup_check", {
    title: "Connect Amazon Ads & Seller Central",
    description: "Use when the seller hasn't connected Amazon's official Ads or Selling Partner (Seller Central) connectors yet, or asks how. Tell it which Amazon tools you can currently see. Returns the exact URLs for their marketplace region and the steps for their AI app.",
    inputSchema: {
      client: z.enum(["claude", "claude_code", "chatgpt", "cursor"]).default("claude"),
      marketplace: z.string().max(60).default("US").describe("e.g. US, UK, Germany, Japan"),
      has_amazon_ads_connector: z.boolean().default(false),
      has_seller_central_connector: z.boolean().default(false),
    },
    annotations: ro,
  }, async (a) => text(setupHelp({ client: a.client, marketplace: a.marketplace, hasAds: a.has_amazon_ads_connector, hasSeller: a.has_seller_central_connector, token: undefined })));

  server.registerTool("create_workspace", {
    title: "Create a personal Rocco workspace",
    description: "Create a private Rocco workspace with memory (change log, result checks, daily brief) and return the seller's personal connector URL. The URL is secret: anyone with it can use the workspace.",
    inputSchema: {},
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async () => {
    const store = getStore();
    if (!store) return fail(`Workspaces aren't switched on yet. Create one later at ${SITE.url}/connect.`);
    const { token } = await createWorkspace(store);
    return text([
      "Your personal Rocco is ready. Add this as a new connector (and you can remove the shared one):",
      "", `**${SITE.url}/mcp/${token}**`, "",
      `Dashboard: ${SITE.url}/w/${token}`,
      "Keep this URL private: it's your key. Then say \"Rocco, brief me\" in a new chat.",
    ].join("\n"));
  });
}
