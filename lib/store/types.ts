import type { TermLite } from "../rules/terms";
import type { Finding, Metrics, Proposal } from "../rules/types";

export interface BrandSettings {
  targetAcos?: number; // fraction
  breakevenAcos?: number; // fraction
  minClicks?: number;
  protectedTerms?: string[]; // never negated (brand names, hero keywords)
  protectedCampaigns?: string[]; // launch / ranking / brand-defense campaigns: never auto-negated
  notes?: string;
}

export interface PendingItem {
  type: "apply" | "undo";
  codes: string[]; // proposal codes (apply) or change ids / codes (undo)
  brand: string;
  at: string;
  by: string; // masked phone of the teammate who approved by text
}

/** One email that landed in the team's report inbox (lib/inbox.ts). */
export interface InboxItem {
  at: string;
  from: string;
  subject: string;
  files: { name: string; kind?: string; headline?: string; error?: string }[];
  /** link_only: the email had only a sign-in link (Rocco never logs in); no_report: nothing to read. */
  note?: "link_only" | "no_report";
}

export interface Workspace {
  id: string;
  createdAt: string;
  licenseKey?: string | null;
  licensed: boolean;
  /** Subscription (Dodo, $99/yr after a 3-day trial): paid period end, trial end, ids, last known status. */
  paidUntil?: string;
  trialEndsAt?: string;
  subscriptionId?: string;
  subStatus?: string;
  /** How this team feeds Rocco: Claude + Amazon's connectors (US), or Amazon's scheduled report emails (elsewhere). */
  mode?: "claude" | "reports";
  /** Report inbox (mode "reports"): last 20 emails and when the first real report arrived. */
  inbox?: InboxItem[];
  reportsAt?: string;
  /** Direct Amazon connection through DataDoe (lib/datadoe.ts): connected accounts + the open invite. */
  amazon?: {
    accounts: { id: string; name: string; country: string; connectedAt: string; ads?: boolean }[];
    invite?: { id: string; url: string; expiresAt: string };
    /** DataDoe recurring export ids per account and report kind (created on the first pull). */
    schedules?: Record<string, Record<string, string>>;
    /** Last daily pull: when, what came in, what failed (shown on the page while data loads). */
    lastSync?: { at: string; kinds: string[]; errors: string[] };
  };
  /** The account email (entered at Hire Rocco, prefilled at checkout). */
  ownerEmail?: string;
  brands: Record<string, BrandSettings>;
  /** 6-char code teammates text to link their phone ("link R7K2QX"). */
  linkCode?: string;
  /** Approvals/undos sent by text, waiting for the team's AI (with Amazon's connector) to apply. */
  pending?: PendingItem[];
  /** Workspace key, encrypted (lib/vault), so Rocco can text a linked phone its links. */
  tokenSealed?: string;
  /** What the team told Rocco about themselves on their first text. */
  about?: string;
  /** When the team first paid, and on which plan (lib/billing.ts): the dashboard compares savings to what Rocco cost. */
  hiredAt?: string;
  plan?: "annual" | "monthly";
  /** Free access granted by the founder for testing (/api/admin/tester). Never counted as a hire. */
  comp?: string;
  /** Fixes the team skipped on the dashboard (lib/memory.ts): Rocco learns what this account doesn't want. */
  skips?: Skip[];
  /** Claude's senior-manager pass over today's fixes, per brand (lib/manager.ts). */
  manager?: Record<string, ManagerView>;
  /** How Rocco nudges the team after payment (dashboard card): cadence, channel, and whether fixes can be approved by text. */
  reminders?: { cadence: "daily" | "weekly" | "off"; weekday?: number; channel?: "imessage" | "whatsapp" | "slack"; approveByText: boolean; setAt: string };
  /** First time the team saw today's work on the dashboard (approve-by-text unlocks after this). */
  seenJobsAt?: string;
  /** "Tidy your campaigns" per Amazon account: the last scan's plan and the last applied change (for Undo). */
  tidy?: Record<string, { plan?: import("../rules/tidy").TidyPlan; done?: import("../tidy-apply").TidyDone }>;
  /** When each paywall moment was last shown (lib/paywall), so Rocco never nags. */
  nudges?: Record<string, string>;
  /** Rocco in the team's Slack (lib/slack). Bot token is sealed. */
  slack?: import("../slack").SlackLink;
  /** Claude bridge (lib/notify): when the team's AI first used Rocco, first data, last day numbers were pushed, which AI they use. */
  connectedAt?: string;
  firstDataAt?: string;
  lastPushDay?: string;
  ai?: "claude" | "chatgpt" | "claude_code";
}

/** A teammate's phone linked to a workspace (Text Rocco). */
export interface Phone {
  phone: string; // E.164-ish, digits with leading +
  workspaceId: string;
  optedOut: boolean;
  createdAt: string;
  lastSeenAt?: string;
  /** "intro": Rocco asked who they are and is waiting for the answer. */
  stage?: "intro";
}

export interface Snapshot {
  id: string;
  workspaceId: string;
  brand: string;
  kind: string;
  createdAt: string;
  headline: string;
  stats: Record<string, number | string>;
  /** Search-term memory (top spenders + converters) and top findings, for diffs, listing gaps and client reports. */
  extra?: { terms?: TermLite[]; findings?: Finding[] };
}

export interface Run {
  id: string;
  workspaceId: string;
  brand: string;
  kind: string;
  createdAt: string;
  proposals: Proposal[];
}

export type ActionStatus = "applied" | "worked" | "no_effect" | "worse" | "not_enough_data" | "reverted";

export interface ActionResult {
  checkedAt: string;
  status: Exclude<ActionStatus, "applied" | "reverted">;
  summary: string;
  after?: Metrics;
  savedEstimate?: number;
  /** measured = real before/after with sales holding; estimated = spend avoided at the old daily rate (lib/savings.ts). */
  basis?: "measured" | "estimated";
}

export interface Action {
  id: string;
  workspaceId: string;
  brand: string;
  runId: string;
  code: string;
  proposal: Proposal;
  appliedAt: string;
  followUpAt: string;
  status: ActionStatus;
  note?: string;
  result?: ActionResult;
}

export interface Store {
  readonly persistent: boolean;
  createWorkspace(tokenHash: string): Promise<Workspace>;
  getWorkspace(tokenHash: string): Promise<Workspace | null>;
  saveWorkspace(ws: Workspace): Promise<void>;
  getWorkspaceById(id: string): Promise<Workspace | null>;
  findWorkspaceByLinkCode(code: string): Promise<Workspace | null>;
  /** Teams whose account email is this (Google sign-in), newest first. */
  findWorkspacesByOwner(email: string): Promise<Workspace[]>;
  getPhone(phone: string): Promise<Phone | null>;
  savePhone(p: Phone): Promise<void>;
  listPhones(opts?: { workspaceId?: string; optedIn?: boolean }): Promise<Phone[]>;
  /** Teams with Amazon connected directly (DataDoe), for the daily pull. */
  listAmazonWorkspaces(): Promise<Workspace[]>;
  addSnapshot(s: Snapshot): Promise<void>;
  listSnapshots(workspaceId: string, opts?: { brand?: string; kind?: string; limit?: number }): Promise<Snapshot[]>; // newest first
  /** Latest snapshot stats of this kind from OTHER workspaces (last 60 days), for anonymized benchmarks. */
  peerStats(kind: string, excludeWorkspaceId: string): Promise<Record<string, number | string>[]>;
  addRun(r: Run): Promise<void>;
  getRun(workspaceId: string, runId?: string, brand?: string): Promise<Run | null>; // latest when no id
  listRuns(workspaceId: string, opts?: { limit?: number }): Promise<Run[]>; // newest first
  addActions(a: Action[]): Promise<void>;
  listActions(workspaceId: string, opts?: { brand?: string; status?: ActionStatus[]; limit?: number }): Promise<Action[]>; // newest first
  saveAction(a: Action): Promise<void>;
}

/** A fix the team skipped (newest first, capped at 200). */
/** Why a fix was skipped (asked in one tap). Teaches Rocco this team's style (lib/memory.ts). */
export type SkipReason = "done" | "strategy" | "risky" | "numbers" | "later";
export interface Skip { code: string; kind: import("../rules/types").ProposalKind; target: string; value: number; at: string; reason?: SkipReason; note?: string }

/** Today's plan from Claude: a one-line brief and 3-5 picks (groups of existing fix codes) with a why-now line. */
export interface ManagerView {
  at: string;
  /** Sorted open codes this view was made from; a new set of fixes means a fresh view. */
  basis: string;
  brief: string | null;
  picks: { codes: string[]; title: string; why: string }[];
}
