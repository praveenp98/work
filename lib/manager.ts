import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { hasAccess } from "./access";
import { askRocco, brainOn } from "./brain";
import { historyFor, historyText } from "./history";
import { currencyOf, localize, type Currency } from "./currency";
import { accountMemory, applyTuning, memoryText, tuning, type Priors } from "./memory";
import { ASK_SYSTEM, MANAGER_SYSTEM, MANAGER_VERSION } from "./prompts/manager";
import type { Proposal } from "./rules/types";
import type { ManagerView, Store, Workspace } from "./store/types";
import { buildBrief } from "./workspace";

/**
 * The senior manager over the rules engine (Claude, behind ANTHROPIC_API_KEY):
 *  - curate(): from today's fixes, pick 3-5 (grouping related ones), drop noise, write a why-now line and a
 *    one-sentence morning brief. It can only choose existing codes, and any sentence with a number that isn't in the
 *    input is thrown away (checkPlan), so Claude can't invent money.
 *  - refreshManager(): runs curate per brand after a data pull, only when the set of fixes changed.
 *  - askAccount(): the dashboard's "Ask Rocco" box, answered from this account's data.
 * Without the key everything falls back to the rules engine's own ranking.
 */
const MODEL = "claude-opus-5-5";
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export const KIND_TITLE: Record<Proposal["kind"], string> = { negative: "Cut a money-burner", harvest: "Promote a winner to exact", bid: "Adjust a bid", budget: "Raise a budget", placement: "Tune a placement", ads_down: "Ease ads, stock is low", structure: "Clean up structure" };

const Plan = z.object({
  brief: z.string(),
  picks: z.array(z.object({ codes: z.array(z.string()), title: z.string(), why: z.string() })),
});
type RawPlan = z.infer<typeof Plan>;

export const basisOf = (ps: Proposal[]) => ps.map((p) => p.code).sort().join(",");
const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const fixLine = (p: Proposal) => [p.code, p.kind, p.target, p.campaign || "-", `~${$(p.valueMonthly)}/mo`, p.reason.replace(/\s+/g, " ").slice(0, 240)].join(" | ");

/** Numbers in a text, normalized (commas dropped). */
export const numbersIn = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, ""));

/** Every number the input contains, plus its rounded forms. */
export function allowedNumbers(input: string): Set<string> {
  const ok = new Set<string>();
  for (const n of numbersIn(input)) { ok.add(n); const v = Number(n); if (isFinite(v)) { ok.add(String(Math.round(v))); ok.add(String(Math.round(v * 10) / 10)); } }
  return ok;
}
const clean = (s: string, max: number) => s.replace(/\s+/g, " ").replace(/[!]+/g, ".").trim().slice(0, max);
/** Money and percentages must come from the input; plain small counts ("two searches", "3 fixes") are fine. */
const honest = (s: string, ok: Set<string>) =>
  [...s.matchAll(/(\$?)(\d+(?:[.,]\d+)*)\s*(%|k\b)?/gi)].every(([, cur, n, unit]) => {
    const v = n.replace(/,/g, "");
    return ok.has(v) || (!cur && !unit && Number(v) <= 31);
  });

/** Keep only what's safe: real codes (each once), ≤ 5 picks, sentences whose numbers all come from the input. */
export function checkPlan(raw: RawPlan, proposals: Proposal[], input: string, now = new Date()): ManagerView {
  const byCode = new Map(proposals.map((p) => [p.code.toUpperCase(), p]));
  const ok = allowedNumbers(input);
  const used = new Set<string>();
  const picks: ManagerView["picks"] = [];
  for (const pk of raw.picks) {
    const codes = pk.codes.map((c) => c.trim().toUpperCase()).filter((c) => byCode.has(c) && !used.has(c) && used.add(c));
    if (!codes.length) continue;
    const first = byCode.get(codes[0])!;
    const title = clean(pk.title, 60);
    const why = clean(pk.why, 200);
    picks.push({
      codes: codes.map((c) => byCode.get(c)!.code),
      title: title && honest(title, ok) ? title : KIND_TITLE[first.kind],
      why: why && honest(why, ok) ? why : first.reason,
    });
    if (picks.length === 5) break;
  }
  const brief = clean(raw.brief, 220);
  return { at: now.toISOString(), basis: basisOf(proposals), brief: brief && honest(brief, ok) ? brief : null, picks };
}

/** Account facts for the prompt: latest numbers per report, target, alerts. */
export function factsFor(b: Awaited<ReturnType<typeof buildBrief>>["perBrand"][number], account?: string): string {
  const L = [`Account: ${account ?? b.brand}. Target ACoS ${Math.round(b.settings.targetAcos * 100)}%.`];
  for (const t of b.trends) {
    const nums = Object.entries(t.latest.stats).filter(([, v]) => typeof v === "number" || /^-?\d/.test(String(v))).map(([k, v]) => `${k}=${v}`).join(", ");
    L.push(`${t.kind} (${t.latest.createdAt.slice(0, 10)}): ${t.latest.headline}${nums ? ` [${nums}]` : ""}`);
  }
  return L.join("\n").slice(0, 6000);
}

/** One manager pass. Null when the brain is off, refuses, or fails (the dashboard uses the rules ranking). */
export async function curate(o: { proposals: Proposal[]; facts: string; memory: string; now?: Date; cur?: Currency }): Promise<ManagerView | null> {
  if (!brainOn() || !o.proposals.length) return null;
  const top = [...o.proposals].sort((a, b) => b.valueMonthly - a.valueMonthly).slice(0, 40);
  const input = localize(`${o.facts}${o.cur && o.cur.code !== "USD" ? `\nCurrency: ${o.cur.code} (${o.cur.symbol.trim()})` : ""}\n\n${o.memory}\n\nToday's fixes (code | type | target | campaign | value | reason):\n${top.map(fixLine).join("\n")}`, o.cur);
  try {
    const res = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Plan) },
      system: [{ type: "text", text: MANAGER_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: input }],
    });
    console.info(`[ai] manager in=${res.usage?.input_tokens ?? 0} out=${res.usage?.output_tokens ?? 0} cached=${res.usage?.cache_read_input_tokens ?? 0}`); // cost tracking in Vercel logs
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens" || !res.parsed_output) return null;
    const view = checkPlan(res.parsed_output, top, input, o.now);
    return view.picks.length ? view : null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.warn(`[${MANAGER_VERSION}] rate limited`);
    else if (e instanceof Anthropic.APIError) console.warn(`[${MANAGER_VERSION}] API error ${e.status}`);
    else console.warn(`[${MANAGER_VERSION}] failed`, e);
    return null;
  }
}

/** After a pull: refresh the manager view for each brand whose fixes changed. Paying teams only. */
export async function refreshManager(store: Store, wsId: string, o: { priors?: Priors; force?: boolean } = {}): Promise<number> {
  const ws = await store.getWorkspaceById(wsId);
  if (!ws || !brainOn() || !hasAccess(ws)) return 0;
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 500 })]);
  const mem = accountMemory(actions, ws.skips);
  const tune = tuning(mem, ws.skips);
  const memory = memoryText(mem, tune, o.priors);
  const updates: Record<string, ManagerView> = {};
  for (const b of brief.perBrand.filter((x) => x.open.length).slice(0, 5)) {
    const { shown } = applyTuning(b.open, tune);
    if (!shown.length || (!o.force && ws.manager?.[b.brand]?.basis === basisOf(shown))) continue;
    const view = await curate({ cur: currencyOf(ws.amazon?.accounts?.find((a) => a.name === b.brand)?.country), proposals: shown, facts: factsFor(b, accountName(ws, b.brand)), memory: [memory, historyText(historyFor(ws, b.brand))].filter(Boolean).join("\n\n") });
    if (view) updates[b.brand] = { ...view, basis: basisOf(shown) };
  }
  if (!Object.keys(updates).length) return 0;
  const fresh = (await store.getWorkspaceById(wsId)) ?? ws;
  fresh.manager = { ...(fresh.manager ?? {}), ...updates };
  await store.saveWorkspace(fresh);
  return Object.keys(updates).length;
}

const accountName = (ws: Workspace, brand: string) => ws.amazon?.accounts?.find((a) => a.name === brand)?.name;

/** "Ask Rocco" on the dashboard: grounded in this account's numbers, fixes, history and memory. */
export async function askAccount(store: Store, ws: Workspace, question: string, brand?: string): Promise<string | null> {
  const [brief, actions] = await Promise.all([buildBrief(store, ws), store.listActions(ws.id, { limit: 200 })]);
  const b = brief.perBrand.find((x) => x.brand === brand) ?? brief.perBrand.find((x) => x.trends.length) ?? brief.perBrand[0];
  const mem = accountMemory(actions, ws.skips);
  const past = actions.slice(0, 15).map((a) => `${a.code} ${a.proposal.kind} "${a.proposal.target}" on ${a.appliedAt.slice(0, 10)}: ${a.status}${a.result ? ` (${a.result.summary.slice(0, 120)})` : ""}`);
  const plan = ws.manager?.[b.brand];
  const context = [
    factsFor(b, accountName(ws, b.brand)),
    plan?.brief ? `Today's brief: ${plan.brief}` : "",
    `Today's fixes:\n${[...b.open].sort((x, y) => y.valueMonthly - x.valueMonthly).slice(0, 25).map(fixLine).join("\n") || "none"}`,
    past.length ? `Past changes:\n${past.join("\n")}` : "Past changes: none yet.",
    memoryText(mem, tuning(mem, ws.skips)),
    historyText(historyFor(ws, b.brand)),
    brief.savedMeasured || brief.savedEstimated ? `Results so far: measured ${$(brief.savedMeasured)}, estimated ${$(brief.savedEstimated)}.` : "",
  ].filter(Boolean).join("\n\n").slice(0, 14000);
  const cur = currencyOf(ws.amazon?.accounts?.find((x) => x.name === b.brand)?.country);
  return askRocco({ question, context: localize(cur.code === "USD" ? context : `Currency: ${cur.code} (${cur.symbol.trim()})\n${context}`, cur), system: ASK_SYSTEM, maxChars: 900, label: "Their question" });
}
