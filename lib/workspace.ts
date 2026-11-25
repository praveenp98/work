import { marketOf, seasonLine } from "./season";
import { targetFor } from "./rules/settings";
import { reversePlan, undoInAmazon } from "./undo";
import { sortFindings } from "./rules/types";
import { savingsOf } from "./savings";
import { randomUUID } from "node:crypto";
import { seal, unseal } from "./vault";
import { hasAccess } from "./access";
import { analyze, REPORT_HELP, type AnalyzeOutput, type ReportKind } from "./analyze";
import { evaluateAction, evaluateBudget } from "./rules/results";
import { diffTerms, termSnapshot, type TermDiff } from "./rules/terms";
import { benchmark } from "./rules/benchmarks";
import { DEFAULT_SETTINGS } from "./rules/settings";
import type { Proposal } from "./rules/types";
import { hashToken, isToken, newToken } from "./store";
import { randomInt } from "node:crypto";
import type { Action, BrandSettings, PendingItem, Run, Store, Workspace } from "./store/types";

export const DEFAULT_BRAND = "main";
/** Free workspaces see and track the top N proposals per report. */
/** No free plan (Nov 18): without a trial or paid plan, every fix is locked (teaser totals only). */
/** First real finding before payment (buyer feedback, Nov 19): the top fix of each analysis is shown in full and can be approved. */
/** Pay at signup (Nov 22): no free fix. Connecting and pulling Amazon data costs money, so only paying teams get it. */
export const FREE_PROPOSALS = 0;
const DAY = 86400000;

export async function createWorkspace(store: Store) {
  const token = newToken();
  const ws = await store.createWorkspace(hashToken(token));
  return { token, ws };
}

/** Keep an encrypted copy of the key so Rocco can text it back later (once per workspace). */
export async function rememberToken(store: Store, ws: Workspace, token: string) {
  if (ws.tokenSealed && unseal(ws.tokenSealed) === token) return;
  const sealed = seal(token);
  if (!sealed) return;
  ws.tokenSealed = sealed;
  await store.saveWorkspace(ws);
}
export const revealToken = (ws: Workspace) => unseal(ws.tokenSealed);
/** The team's own page, for texts and messages (works on any phone, no cookie needed). */
export const teamUrl = (ws: Workspace) => { const t = revealToken(ws); return t ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://rocco.works"}/w/${t}` : `${process.env.NEXT_PUBLIC_SITE_URL || "https://rocco.works"}/me`; };

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
  const out: AnalyzeOutput = analyze(table, { targetAcos: s.targetAcos, breakevenAcos: s.breakevenAcos, minClicks: s.minClicks, protectedTerms: s.protectedTerms, protectedCampaigns: s.protectedCampaigns, goals: s.goals, monthlyAdBudget: s.monthlyAdBudget, adSpend, adSales });
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
  await store.addSnapshot({ id: randomUUID(), workspaceId: ws.id, brand, kind: out.kind, createdAt: now, headline: out.analysis.headline, stats: out.analysis.stats, extra: { terms, findings: sortFindings(out.analysis.findings).slice(0, 12) } });
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
      const tgt = targetFor({ targetAcos: s.targetAcos, goals: s.goals }, a.proposal.campaign); // judged against this product's goal
      const res = out.report ? evaluateAction(a, out.report, tgt) : evaluateBudget(a, out.campaigns!, tgt);
      if (!res) continue;
      a.result = res;
      a.status = res.status;
      if (res.status === "not_enough_data") a.followUpAt = new Date(Date.now() + 7 * DAY).toISOString();
      // Opt-in: a bid or budget change that made things worse is put back in Amazon by itself (and says so in the log).
      const acct = ws.amazon?.accounts?.find((x) => x.name === brand) ?? (ws.amazon?.accounts?.length === 1 ? ws.amazon.accounts[0] : undefined);
      if (res.status === "worse" && ws.autoUndo && acct && reversePlan(a.proposal)) {
        const u = await undoInAmazon(acct.id, a).catch(() => ({ ok: false as const, error: "undo failed" }));
        if (u.ok) { a.status = "reverted"; a.note = `${a.note ? `${a.note} · ` : ""}undone automatically (${u.back}): it made things worse`; }
      }
      await store.saveAction(a);
      checked.push(a);
    }
  }
  const previous = (await store.listSnapshots(ws.id, { brand, kind: out.kind, limit: 2 }))[1] ?? null;
  const bench = benchmark(out.kind, out.analysis.stats, await store.peerStats(out.kind, ws.id));
  return { out, run, checked, previous, diff, bench };
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
  const want = new Set(ids.map((i) => i.toUpperCase()));
  const hit = all.filter((a) => ids.includes(a.id) || ids.includes(a.id.slice(0, 8)) || (a.status !== "reverted" && want.has(a.code.toUpperCase())));
  for (const a of hit) { a.status = "reverted"; await store.saveAction(a); }
  return hit;
}

// Seasonal line: lib/season.ts (per marketplace, every year).

/** Everything Rocco knows, distilled into today's to-do list. */
export async function buildBrief(store: Store, ws: Workspace, now = new Date()) {
  const actions = await store.listActions(ws.id, { limit: 500 });
  const snaps = await store.listSnapshots(ws.id, { limit: 200 });
  const runs = await store.listRuns(ws.id, { limit: 20 });
  const brands = [...new Set([...Object.keys(ws.brands), ...snaps.map((s) => s.brand)])];
  if (!brands.length) brands.push(DEFAULT_BRAND);

  const due = actions.filter((a) => ["applied", "not_enough_data"].includes(a.status) && new Date(a.followUpAt) <= now);
  const recentResults = actions.filter((a) => a.result && now.getTime() - new Date(a.result.checkedAt).getTime() < 14 * DAY);
  const sv = savingsOf(actions);
  const saved = sv.total;
  const appliedCodes = new Set(actions.map((a) => `${a.runId}:${a.code}`));

  const perBrand = brands.map((brand) => {
    const latestByKind = new Map<string, typeof snaps>();
    for (const s of snaps.filter((x) => x.brand === brand)) latestByKind.set(s.kind, [...(latestByKind.get(s.kind) ?? []), s]);
    const trends = [...latestByKind.entries()].map(([kind, list]) => ({ kind, latest: list[0], previous: list[1] ?? null }));
    const kinds = new Set<string>();
    const brandRuns = runs.filter((r) => r.brand === brand && !kinds.has(r.kind) && kinds.add(r.kind));
    const open_ = hasAccess(ws, now);
    const visible = (r: Run) => (open_ ? r.proposals : r.proposals.slice(0, FREE_PROPOSALS));
    const hidden = open_ ? 0 : brandRuns.reduce((t, r) => t + Math.max(0, r.proposals.length - FREE_PROPOSALS), 0);
    const locked: Proposal[] = open_ ? [] : brandRuns.flatMap((r) => r.proposals.slice(FREE_PROPOSALS));
    const hiddenValue = locked.reduce((t, p) => t + p.valueMonthly, 0);
    const open: Proposal[] = brandRuns.flatMap((r) => visible(r).filter((p) => !appliedCodes.has(`${r.id}:${p.code}`)));
    const stale: ReportKind[] = (["sp_search_term", "business_report", "inventory", "sp_campaign"] as ReportKind[]).filter((k) => {
      const l = latestByKind.get(k)?.[0];
      return !l || now.getTime() - new Date(l.createdAt).getTime() > 7 * DAY;
    });
    return { brand, settings: brandSettings(ws, brand), trends, open, hidden, hiddenValue, openValue: open.reduce((t, p) => t + p.valueMonthly, 0), stale };
  });
  const season = seasonLine(marketOf(ws.amazon?.accounts?.[0]?.country), now);
  return { due, recentResults, saved, savedMeasured: sv.measured, savedEstimated: sv.estimated, perBrand, season, totals: { applied: actions.length, worked: actions.filter((a) => a.status === "worked").length } };
}

export { REPORT_HELP };

const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** The 6-char code teammates text to link their phone. Created on first use. */
export async function ensureLinkCode(store: Store, ws: Workspace): Promise<string> {
  if (ws.linkCode) return ws.linkCode;
  for (let i = 0; i < 5; i++) {
    const code = Array.from({ length: 6 }, () => CODE_ALPHA[randomInt(CODE_ALPHA.length)]).join("");
    if (!(await store.findWorkspaceByLinkCode(code))) { ws.linkCode = code; await store.saveWorkspace(ws); return code; }
  }
  throw new Error("Couldn't create a link code");
}

/** Approvals/undos sent by text wait here until the team's AI applies them. */
export async function queuePending(store: Store, ws: Workspace, item: PendingItem) {
  ws.pending = [...(ws.pending ?? []), item];
  await store.saveWorkspace(ws);
}

/** Remove codes from the queue once they're applied (apply_changes / revert_changes). */
export async function clearPending(store: Store, ws: Workspace, type: PendingItem["type"], codes: string[]) {
  if (!ws.pending?.length) return;
  const done = new Set(codes.map((c) => c.toUpperCase()));
  ws.pending = ws.pending.map((p) => (p.type === type ? { ...p, codes: p.codes.filter((c) => !done.has(c.toUpperCase())) } : p)).filter((p) => p.codes.length);
  await store.saveWorkspace(ws);
}
