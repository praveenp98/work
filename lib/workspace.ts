import { randomUUID } from "node:crypto";
import { analyze, REPORT_HELP, type AnalyzeOutput, type ReportKind } from "./analyze";
import { evaluateAction, evaluateBudget } from "./rules/results";
import { diffTerms, termSnapshot, type TermDiff } from "./rules/terms";
import { DEFAULT_SETTINGS } from "./rules/settings";
import type { Proposal } from "./rules/types";
import { hashToken, isToken, newToken } from "./store";
import type { Action, BrandSettings, Run, Store, Workspace } from "./store/types";

export const DEFAULT_BRAND = "main";
/** Free workspaces see and track the top N proposals per report. */
export const FREE_PROPOSALS = 3;
const DAY = 86400000;

export async function createWorkspace(store: Store) {
  const token = newToken();
  const ws = await store.createWorkspace(hashToken(token));
  return { token, ws };
}

export async function loadWorkspace(store: Store, token: string): Promise<Workspace | null> {
  if (!isToken(token)) return null;
  return store.getWorkspace(hashToken(token));
}

export function brandSettings(ws: Workspace, brand: string): BrandSettings & { targetAcos: number; breakevenAcos: number; minClicks: number } {
  const b = ws.brands[brand] ?? {};
  const target = b.targetAcos ?? DEFAULT_SETTINGS.targetAcos;
  return { ...b, targetAcos: target, breakevenAcos: b.breakevenAcos ?? target * 1.5, minClicks: b.minClicks ?? DEFAULT_SETTINGS.minClicksNegative };
}

export async function setBrandSettings(store: Store, ws: Workspace, brand: string, patch: BrandSettings) {
  ws.brands[brand] = { ...(ws.brands[brand] ?? {}), ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
  await store.saveWorkspace(ws);
  return ws.brands[brand];
}

/** Analyze a report with the brand's settings, save a snapshot + proposal run, and check past changes against it. */
export async function runAnalysis(store: Store, ws: Workspace, brand: string, table: unknown[][], extra: { adSpend?: number; adSales?: number } = {}) {
  const s = brandSettings(ws, brand);
  let adSpend = extra.adSpend, adSales = extra.adSales;
  // TACoS: use the latest ads snapshot when the user didn't pass ad spend
  if (adSpend === undefined) {
    const last = (await store.listSnapshots(ws.id, { brand, kind: "sp_search_term", limit: 1 }))[0];
    if (last) { adSpend = Number(last.stats.spend) || undefined; adSales = Number(last.stats.sales) || undefined; }
  }
  const out: AnalyzeOutput = analyze(table, { targetAcos: s.targetAcos, breakevenAcos: s.breakevenAcos, minClicks: s.minClicks, protectedTerms: s.protectedTerms, adSpend, adSales });
  const now = new Date().toISOString();
  const terms = out.report ? termSnapshot(out.report.rows) : undefined;
  let diff: TermDiff | null = null;
  if (terms) {
    const prevTerms = (await store.listSnapshots(ws.id, { brand, kind: "sp_search_term", limit: 1 }))[0]?.extra?.terms;
    if (prevTerms?.length) {
      diff = diffTerms(prevTerms, terms);
      out.analysis.stats.newBurners = diff.newBurners.length;
      out.analysis.stats.newWinners = diff.newWinners.length;
    }
  }
  await store.addSnapshot({ id: randomUUID(), workspaceId: ws.id, brand, kind: out.kind, createdAt: now, headline: out.analysis.headline, stats: out.analysis.stats, extra: { terms, findings: out.analysis.findings.slice(0, 10) } });
  let run: Run | null = null;
  if (out.analysis.proposals.length) {
    run = { id: randomUUID(), workspaceId: ws.id, brand, kind: out.kind, createdAt: now, proposals: out.analysis.proposals };
    await store.addRun(run);
  }
  // result checks
  const checked: Action[] = [];
  if (out.report || out.campaigns) {
    const open = await store.listActions(ws.id, { brand, status: ["applied", "not_enough_data", "no_effect"] });
    for (const a of open) {
      const res = out.report ? evaluateAction(a, out.report, s.targetAcos) : evaluateBudget(a, out.campaigns!, s.targetAcos);
      if (!res) continue;
      a.result = res;
      a.status = res.status;
      if (res.status === "not_enough_data") a.followUpAt = new Date(Date.now() + 7 * DAY).toISOString();
      await store.saveAction(a);
      checked.push(a);
    }
  }
  const previous = (await store.listSnapshots(ws.id, { brand, kind: out.kind, limit: 2 }))[1] ?? null;
  return { out, run, checked, previous, diff };
}

/** Latest proposal run per report type for a brand. Code letters are unique per type (N/H/B, G, S, F). */
export async function latestRuns(store: Store, ws: Workspace, brand: string): Promise<Run[]> {
  const seen = new Set<string>();
  const out: Run[] = [];
  for (const r of await store.listRuns(ws.id, { limit: 100 })) {
    if (r.brand !== brand || seen.has(r.kind)) continue;
    seen.add(r.kind);
    out.push(r);
  }
  return out;
}

/** Record approved proposals as applied changes with a follow-up date. */
export async function applyChanges(store: Store, ws: Workspace, codes: string[], opts: { runId?: string; brand?: string; note?: string; freeLimit?: number } = {}) {
  const brand = opts.brand || DEFAULT_BRAND;
  const runs = opts.runId ? [await store.getRun(ws.id, opts.runId)].filter((r): r is Run => !!r) : await latestRuns(store, ws, brand);
  if (!runs.length) throw new Error("No proposals yet. Analyze a report first.");
  const wanted = new Set(expandCodes(codes));
  const runIds = new Set(runs.map((r) => r.id));
  const existing = new Set((await store.listActions(ws.id, { brand: runs[0].brand })).filter((a) => runIds.has(a.runId)).map((a) => a.code));
  const now = Date.now();
  const actions: Action[] = [];
  const locked: string[] = [];
  const found = new Set<string>();
  for (const run of runs) {
    const allowed = opts.freeLimit !== undefined ? new Set(run.proposals.slice(0, opts.freeLimit).map((p) => p.code)) : null;
    for (const p of run.proposals) {
      if (!wanted.has(p.code)) continue;
      found.add(p.code);
      if (existing.has(p.code)) continue;
      if (allowed && !allowed.has(p.code)) { locked.push(p.code); continue; }
      actions.push({
        id: randomUUID(), workspaceId: ws.id, brand: run.brand, runId: run.id, code: p.code, proposal: p,
        appliedAt: new Date(now).toISOString(),
        followUpAt: new Date(now + (p.kind === "harvest" ? 14 : 7) * DAY).toISOString(),
        status: "applied", note: opts.note,
      });
    }
  }
  await store.addActions(actions);
  const unknown = [...wanted].filter((c) => !found.has(c));
  const dupes = [...wanted].filter((c) => existing.has(c));
  return { brand: runs[0].brand, actions, unknown, dupes, locked };
}

/** "N1-N4, B2" → ["N1","N2","N3","N4","B2"] */
export function expandCodes(codes: string[]): string[] {
  const out: string[] = [];
  for (const raw of codes.flatMap((c) => c.split(/[,\s]+/)).filter(Boolean)) {
    const m = raw.toUpperCase().match(/^([A-Z])(\d+)(?:-(?:[A-Z])?(\d+))?$/);
    if (!m) continue;
    const [, L, a, b] = m;
    if (b) for (let i = Number(a); i <= Number(b); i++) out.push(`${L}${i}`);
    else out.push(`${L}${a}`);
  }
  return [...new Set(out)];
}

export async function revertChanges(store: Store, ws: Workspace, ids: string[]) {
  const all = await store.listActions(ws.id);
  const hit = all.filter((a) => ids.includes(a.id) || ids.includes(a.id.slice(0, 8)));
  for (const a of hit) { a.status = "reverted"; await store.saveAction(a); }
  return hit;
}

const BFCM = [
  { until: "2026-11-25", text: "Black Friday is Nov 27. Add negatives and harvest winners this week so peak budget goes to buyers." },
  { until: "2026-11-30", text: "Peak week: check budgets 3–4× a day on Black Friday (Nov 27) and Cyber Monday (Nov 30)." },
  { until: "2026-12-05", text: "Post-mortem time: run a search term report for Nov 19–30 and pull bids back toward normal." },
  { until: "2026-12-20", text: "Gifting season: keep winners funded through mid-December; watch stock cover." },
];

/** Everything Rocco knows, distilled into today's to-do list. */
export async function buildBrief(store: Store, ws: Workspace, now = new Date()) {
  const actions = await store.listActions(ws.id, { limit: 500 });
  const snaps = await store.listSnapshots(ws.id, { limit: 200 });
  const runs = await store.listRuns(ws.id, { limit: 20 });
  const brands = [...new Set([...Object.keys(ws.brands), ...snaps.map((s) => s.brand)])];
  if (!brands.length) brands.push(DEFAULT_BRAND);

  const due = actions.filter((a) => ["applied", "not_enough_data"].includes(a.status) && new Date(a.followUpAt) <= now);
  const recentResults = actions.filter((a) => a.result && now.getTime() - new Date(a.result.checkedAt).getTime() < 14 * DAY);
  const saved = actions.reduce((t, a) => t + (a.result?.savedEstimate ?? 0), 0);
  const appliedCodes = new Set(actions.map((a) => `${a.runId}:${a.code}`));

  const perBrand = brands.map((brand) => {
    const latestByKind = new Map<string, typeof snaps>();
    for (const s of snaps.filter((x) => x.brand === brand)) latestByKind.set(s.kind, [...(latestByKind.get(s.kind) ?? []), s]);
    const trends = [...latestByKind.entries()].map(([kind, list]) => ({ kind, latest: list[0], previous: list[1] ?? null }));
    const kinds = new Set<string>();
    const brandRuns = runs.filter((r) => r.brand === brand && !kinds.has(r.kind) && kinds.add(r.kind));
    const visible = (r: Run) => (ws.licensed ? r.proposals : r.proposals.slice(0, FREE_PROPOSALS));
    const hidden = ws.licensed ? 0 : brandRuns.reduce((t, r) => t + Math.max(0, r.proposals.length - FREE_PROPOSALS), 0);
    const open: Proposal[] = brandRuns.flatMap((r) => visible(r).filter((p) => !appliedCodes.has(`${r.id}:${p.code}`)));
    const stale: ReportKind[] = (["sp_search_term", "business_report", "inventory", "sp_campaign"] as ReportKind[]).filter((k) => {
      const l = latestByKind.get(k)?.[0];
      return !l || now.getTime() - new Date(l.createdAt).getTime() > 7 * DAY;
    });
    return { brand, settings: brandSettings(ws, brand), trends, open, hidden, openValue: open.reduce((t, p) => t + p.valueMonthly, 0), stale };
  });
  const iso = now.toISOString().slice(0, 10);
  const season = BFCM.find((b) => iso <= b.until)?.text ?? null;
  return { due, recentResults, saved, perBrand, season, totals: { applied: actions.length, worked: actions.filter((a) => a.status === "worked").length } };
}

export { REPORT_HELP };
