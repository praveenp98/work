import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Papa from "papaparse";
import { z } from "zod";
import { analyze, REPORT_HELP } from "../analyze";
import { parseBulk } from "../parsers/bulk";
import { validatePolarKey } from "../polar";
import { proposalsBulkCsv, proposalsCsv } from "../rules/export";
import { SITE } from "../site";
import { getStore } from "../store";
import type { ActionStatus } from "../store/types";
import { applyChanges, buildBrief, createWorkspace, DEFAULT_BRAND, revertChanges, runAnalysis, setBrandSettings } from "../workspace";
import { FREE_PROPOSALS, formatActions, formatAnalysis, formatBrief, proposalLine } from "./format";
import type { McpContext } from "./server";

export const MAX_CSV = 3_000_000;
const ro = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const rw = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const fail = (t: string) => ({ isError: true, content: [{ type: "text" as const, text: t }] });
const parse = (csv: string) => Papa.parse<unknown[]>(csv, { skipEmptyLines: true }).data;
const brandArg = z.string().max(80).optional().describe(`Brand / seller account name. Defaults to "${DEFAULT_BRAND}".`);
const reportList = Object.values(REPORT_HELP).map((h) => `${h.name} (${h.where})`).join("; ");

export function registerMemoryTools(server: McpServer, { store, ws, token }: McpContext) {
  server.registerTool("rocco_brief", {
    title: "Rocco's brief: what to do today",
    description: "Start here. Rocco's to-do list from memory: results of past changes, changes due for a check, proposed changes not applied yet, trends per brand, which reports to refresh, and seasonal reminders.",
    inputSchema: {},
    annotations: ro,
  }, async () => text(formatBrief(await buildBrief(store, ws))));

  server.registerTool("analyze_report", {
    title: "Analyze any Amazon report",
    description: `Analyze an Amazon report (CSV/TSV text with header row). Auto-detects: ${reportList}. Saves a snapshot to memory, returns findings and an approval list of coded changes, and checks past changes against newer data.`,
    inputSchema: {
      report_csv: z.string().min(20).max(MAX_CSV).describe("The report as CSV or TSV text, including the header row."),
      brand: brandArg,
    },
    annotations: rw,
  }, async ({ report_csv, brand }) => {
    try {
      const b = brand || DEFAULT_BRAND;
      const { out, run, checked, previous } = await runAnalysis(store, ws, b, parse(report_csv));
      return text(formatAnalysis(out, { licensed: ws.licensed, runId: run?.id, checked, previous, memory: true }));
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
      const res = await applyChanges(store, ws, codes, { runId, brand: brand || undefined, note, freeLimit: ws.licensed ? undefined : FREE_PROPOSALS });
      const L = [`Logged ${res.actions.length} change${res.actions.length === 1 ? "" : "s"} for ${res.brand}. Rocco will check them after ${res.actions[0]?.followUpAt.slice(0, 10) ?? "–"} using a newer search term report (Daily, starting the day after today).`];
      L.push(...res.actions.map((a) => proposalLine(a.proposal) + ` · id \`${a.id.slice(0, 8)}\``));
      if (res.dupes.length) L.push(`Already logged: ${res.dupes.join(", ")}.`);
      if (res.unknown.length) L.push(`Unknown codes: ${res.unknown.join(", ")}.`);
      if (res.locked.length) L.push(`Not logged (needs a license): ${res.locked.join(", ")}. Free workspaces track the top ${FREE_PROPOSALS} changes per report; activate a license (${SITE.url}/pricing) to track everything.`);
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
    description: "Mark logged changes as reverted and return the exact steps to undo each one in Amazon Ads. Use the 8-character ids from list_changes.",
    inputSchema: { change_ids: z.array(z.string().max(40)).min(1).max(100) },
    annotations: rw,
  }, async ({ change_ids }) => {
    const hit = await revertChanges(store, ws, change_ids);
    if (!hit.length) return fail("No matching changes. Use the ids from list_changes.");
    return text(["Marked as reverted. To undo in Amazon Ads:", ...hit.map((a) => `- **${a.code}** ${a.proposal.undo}`)].join("\n"));
  });

  server.registerTool("set_brand_settings", {
    title: "Brand settings",
    description: "Save per-brand settings Rocco uses in every analysis: target and breakeven ACoS, click threshold for negatives, and protected terms Rocco must never negate (brand names, hero keywords).",
    inputSchema: {
      brand: brandArg,
      target_acos_percent: z.number().min(1).max(200).optional(),
      breakeven_acos_percent: z.number().min(-100).max(200).optional(),
      min_clicks: z.number().int().min(3).max(100).optional(),
      protected_terms: z.array(z.string().max(80)).max(100).optional(),
      notes: z.string().max(1000).optional(),
    },
    annotations: rw,
  }, async (a) => {
    const saved = await setBrandSettings(store, ws, a.brand || DEFAULT_BRAND, {
      targetAcos: a.target_acos_percent !== undefined ? a.target_acos_percent / 100 : undefined,
      breakevenAcos: a.breakeven_acos_percent !== undefined ? a.breakeven_acos_percent / 100 : undefined,
      minClicks: a.min_clicks, protectedTerms: a.protected_terms, notes: a.notes,
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
    },
    annotations: ro,
  }, async ({ codes, brand, bulk_csv }) => {
    if (!ws.licensed) return fail(`Exports need a Rocco license. Get one at ${SITE.url}/pricing, then call activate_license.`);
    const run = await store.getRun(ws.id, undefined, brand || undefined);
    if (!run) return fail("No proposals yet. Analyze a report first.");
    const { expandCodes } = await import("../workspace");
    const want = codes?.length ? new Set(expandCodes(codes)) : null;
    const ps = run.proposals.filter((p) => !want || want.has(p.code));
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
    const v = await validatePolarKey(license_key);
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
    description: `Analyze an Amazon report (CSV/TSV text with header row). Auto-detects: ${reportList}. Returns findings and an approval list. No memory on this shared connector.`,
    inputSchema: {
      report_csv: z.string().min(20).max(MAX_CSV),
      target_acos_percent: z.number().min(1).max(200).optional(),
      license_key: z.string().max(200).optional(),
    },
    annotations: ro,
  }, async ({ report_csv, target_acos_percent, license_key }) => {
    try {
      const out = analyze(parse(report_csv), { targetAcos: target_acos_percent ? target_acos_percent / 100 : undefined });
      const licensed = license_key ? (await validatePolarKey(license_key)).ok : false;
      return text(formatAnalysis(out, { licensed, memory: false }));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Couldn't analyze that report.");
    }
  });

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
