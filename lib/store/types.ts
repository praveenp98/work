import type { TermLite } from "../rules/terms";
import type { Finding, Metrics, Proposal } from "../rules/types";

export interface BrandSettings {
  targetAcos?: number; // fraction
  breakevenAcos?: number; // fraction
  minClicks?: number;
  protectedTerms?: string[]; // never negated (brand names, hero keywords)
  notes?: string;
}

export interface Workspace {
  id: string;
  createdAt: string;
  licenseKey?: string | null;
  licensed: boolean;
  brands: Record<string, BrandSettings>;
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
