import { randomUUID } from "node:crypto";
import type { Action, Phone, Run, Snapshot, Store, Workspace } from "./types";

/** In-process store for dev and tests. Not durable across server instances. */
export class MemoryStore implements Store {
  readonly persistent = false;
  private ws = new Map<string, Workspace>(); // tokenHash → ws
  private snaps: Snapshot[] = [];
  private runs: Run[] = [];
  private actions: Action[] = [];
  private phones = new Map<string, Phone>();

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
  async getWorkspaceById(id: string) {
    for (const w of this.ws.values()) if (w.id === id) return structuredClone(w);
    return null;
  }
  async findWorkspaceByLinkCode(code: string) {
    for (const w of this.ws.values()) if (w.linkCode && w.linkCode === code.toUpperCase()) return structuredClone(w);
    return null;
  }
  async findWorkspacesByOwner(email: string) {
    const e = email.toLowerCase();
    return [...this.ws.values()].filter((w) => w.ownerEmail?.toLowerCase() === e).reverse().map((w) => structuredClone(w));
  }
  async findWorkspacesByMember(email: string) {
    const e = email.toLowerCase();
    return [...this.ws.values()].filter((w) => w.members?.some((m) => m.email === e)).reverse().map((w) => structuredClone(w));
  }
  async rotateToken(id: string, newTokenHash: string) {
    for (const [h, v] of this.ws) if (v.id === id) { this.ws.delete(h); this.ws.set(newTokenHash, v); return; }
  }
  async getPhone(phone: string) { const p = this.phones.get(phone); return p ? structuredClone(p) : null; }
  async savePhone(p: Phone) { this.phones.set(p.phone, structuredClone(p)); }
  async listAmazonWorkspaces() {
    return [...this.ws.values()].filter((w) => w.amazon?.accounts?.length).map((w) => structuredClone(w));
  }
  async listPhones(o: { workspaceId?: string; optedIn?: boolean } = {}) {
    return [...this.phones.values()].filter((p) => (!o.workspaceId || p.workspaceId === o.workspaceId) && (!o.optedIn || !p.optedOut)).map((p) => structuredClone(p));
  }
  async addSnapshot(s: Snapshot) { this.snaps.push(structuredClone(s)); }
  async listSnapshots(id: string, o: { brand?: string; kind?: string; limit?: number } = {}) {
    return this.snaps.filter((s) => s.workspaceId === id && (!o.brand || s.brand === o.brand) && (!o.kind || s.kind === o.kind))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, o.limit ?? 50).map((s) => structuredClone(s));
  }
  async peerStats(kind: string, exclude: string) {
    const since = Date.now() - 60 * 86400000;
    const latest = new Map<string, Snapshot>();
    for (const s of this.snaps) {
      if (s.kind !== kind || s.workspaceId === exclude || new Date(s.createdAt).getTime() < since) continue;
      const k = s.workspaceId + "\u0001" + s.brand;
      const prev = latest.get(k);
      if (!prev || prev.createdAt < s.createdAt) latest.set(k, s);
    }
    return [...latest.values()].map((s) => ({ ...s.stats }));
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
