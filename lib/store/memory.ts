import { randomUUID } from "node:crypto";
import type { Action, Run, Snapshot, Store, Workspace } from "./types";

/** In-process store for dev and tests. Not durable across server instances. */
export class MemoryStore implements Store {
  readonly persistent = false;
  private ws = new Map<string, Workspace>(); // tokenHash → ws
  private snaps: Snapshot[] = [];
  private runs: Run[] = [];
  private actions: Action[] = [];

  async createWorkspace(tokenHash: string) {
    const w: Workspace = { id: randomUUID(), createdAt: new Date().toISOString(), licensed: false, brands: {} };
    this.ws.set(tokenHash, w);
    return structuredClone(w);
  }
  async getWorkspace(tokenHash: string) {
    const w = this.ws.get(tokenHash);
    return w ? structuredClone(w) : null;
  }
  async saveWorkspace(w: Workspace) {
    for (const [h, v] of this.ws) if (v.id === w.id) this.ws.set(h, structuredClone(w));
  }
  async addSnapshot(s: Snapshot) { this.snaps.push(structuredClone(s)); }
  async listSnapshots(id: string, o: { brand?: string; kind?: string; limit?: number } = {}) {
    return this.snaps.filter((s) => s.workspaceId === id && (!o.brand || s.brand === o.brand) && (!o.kind || s.kind === o.kind))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, o.limit ?? 50).map((s) => structuredClone(s));
  }
  async addRun(r: Run) { this.runs.push(structuredClone(r)); }
  async getRun(id: string, runId?: string, brand?: string) {
    const list = this.runs.filter((r) => r.workspaceId === id && (!runId || r.id === runId) && (!brand || r.brand === brand))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list[0] ? structuredClone(list[0]) : null;
  }
  async listRuns(id: string, o: { limit?: number } = {}) {
    return this.runs.filter((r) => r.workspaceId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, o.limit ?? 20).map((r) => structuredClone(r));
  }
  async addActions(a: Action[]) { this.actions.push(...a.map((x) => structuredClone(x))); }
  async listActions(id: string, o: { brand?: string; status?: Action["status"][]; limit?: number } = {}) {
    return this.actions.filter((a) => a.workspaceId === id && (!o.brand || a.brand === o.brand) && (!o.status || o.status.includes(a.status)))
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, o.limit ?? 200).map((a) => structuredClone(a));
  }
  async saveAction(a: Action) {
    const i = this.actions.findIndex((x) => x.id === a.id);
    if (i >= 0) this.actions[i] = structuredClone(a);
  }
}
