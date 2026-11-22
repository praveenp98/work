import type { Proposal, ProposalKind } from "./rules/types";
import type { Action, Skip } from "./store/types";

/**
 * Rocco learns each account (pure functions, no AI): what this team approves, skips, and what worked.
 *  - accountMemory: per fix type, counts from the change log + skips
 *  - tuning: per-account thresholds that follow from that (skip a type often → only show big ones; a type keeps
 *    failing → hold it back)
 *  - priorsFrom: anonymized cross-account success rates per fix type (counts only, no names, terms or numbers)
 * The manager prompt reads all three; the dashboard applies `tuning` even when Claude is off.
 */
export type KindMemory = { approved: number; skipped: number; worked: number; failed: number };
export type Memory = Partial<Record<ProposalKind, KindMemory>>;
export type Tuning = Partial<Record<ProposalKind, { minValue?: number; hold?: boolean; why: string }>>;
export type Priors = Partial<Record<ProposalKind, { worked: number; measured: number; accounts: number }>>;

const FAILED = new Set(["no_effect", "worse", "reverted"]);
const blank = (): KindMemory => ({ approved: 0, skipped: 0, worked: 0, failed: 0 });

export function accountMemory(actions: Action[], skips: Skip[] = []): Memory {
  const m: Memory = {};
  for (const a of actions) {
    const k = (m[a.proposal.kind] ??= blank());
    k.approved++;
    if (a.status === "worked") k.worked++;
    else if (FAILED.has(a.status)) k.failed++;
  }
  for (const s of skips) (m[s.kind] ??= blank()).skipped++;
  return m;
}

/** Thresholds per fix type. Conservative: needs 3+ signals before it changes anything. */
export function tuning(mem: Memory, skips: Skip[] = []): Tuning {
  const t: Tuning = {};
  for (const [kind, k] of Object.entries(mem) as [ProposalKind, KindMemory][]) {
    if (k.failed >= 3 && k.worked === 0) { t[kind] = { hold: true, why: `${k.failed} of these didn't work on this account` }; continue; }
    if (k.skipped >= 3 && k.skipped > k.approved * 2) {
      const vals = skips.filter((s) => s.kind === kind).map((s) => s.value).sort((a, b) => a - b);
      const median = vals[Math.floor(vals.length / 2)] ?? 0;
      t[kind] = { minValue: Math.ceil(median * 2), why: `skipped ${k.skipped} times, so only bigger ones show` };
    }
  }
  return t;
}

/** Hide what this account has taught Rocco to hide; report how many were held back. */
export function applyTuning(ps: Proposal[], t: Tuning): { shown: Proposal[]; held: number } {
  const shown = ps.filter((p) => { const r = t[p.kind]; return !r || (!r.hold && p.valueMonthly >= (r.minValue ?? 0)); });
  return { shown, held: ps.length - shown.length };
}

/** Anonymized cross-account defaults: share of measured changes that worked, per fix type. */
export function priorsFrom(perAccount: Action[][]): Priors {
  const p: Priors = {};
  for (const actions of perAccount) {
    const seen = new Set<ProposalKind>();
    for (const a of actions) {
      if (a.status !== "worked" && a.status !== "no_effect" && a.status !== "worse") continue;
      const x = (p[a.proposal.kind] ??= { worked: 0, measured: 0, accounts: 0 });
      x.measured++;
      if (a.status === "worked") x.worked++;
      if (!seen.has(a.proposal.kind)) { seen.add(a.proposal.kind); x.accounts++; }
    }
  }
  // Too few accounts to be anonymous or meaningful: drop.
  for (const k of Object.keys(p) as ProposalKind[]) if (p[k]!.accounts < 3) delete p[k];
  return p;
}

/** Plain-text memory for the manager prompt. */
export function memoryText(mem: Memory, t: Tuning, priors: Priors = {}): string {
  const L: string[] = [];
  for (const [kind, k] of Object.entries(mem) as [ProposalKind, KindMemory][]) {
    L.push(`- ${kind}: approved ${k.approved}, skipped ${k.skipped}, worked ${k.worked}, didn't work ${k.failed}${t[kind] ? ` (${t[kind]!.why})` : ""}`);
  }
  const P = (Object.entries(priors) as [ProposalKind, NonNullable<Priors[ProposalKind]>][]).map(([kind, x]) => `- ${kind}: ${x.worked} of ${x.measured} measured changes worked across ${x.accounts} accounts`);
  return [
    L.length ? `This account's history:\n${L.join("\n")}` : "This account's history: none yet (new account).",
    P.length ? `Across all Rocco accounts (anonymized):\n${P.join("\n")}` : "",
  ].filter(Boolean).join("\n");
}

/** Keep the newest 200 skips. */
export const addSkips = (prev: Skip[] = [], add: Skip[]) => [...add, ...prev.filter((s) => !add.some((a) => a.code === s.code))].slice(0, 200);
