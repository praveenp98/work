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
