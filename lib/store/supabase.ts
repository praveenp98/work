import type { Action, Phone, Run, Snapshot, Store, Workspace } from "./types";

/**
 * Supabase (PostgREST) store. Server-only: uses the service role key.
 * Schema: supabase/migrations/001_rocco_memory.sql. Rows keep their payload in a `data` jsonb column.
 */
export class SupabaseStore implements Store {
  readonly persistent = true;
  private url: string;
  constructor(url: string, private key: string) {
    // accept "https://x.supabase.co", with trailing slash or "/rest/v1"
    this.url = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  }

  /** New-style keys (sb_secret_…) go only in `apikey`; legacy JWT keys also go in Authorization. */
  private authHeaders(): Record<string, string> {
    return this.key.startsWith("sb_") ? { apikey: this.key } : { apikey: this.key, Authorization: `Bearer ${this.key}` };
  }

  private async q<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: { ...this.authHeaders(), "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Rocco memory error (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  /** Diagnostics for /api/health: which tables answer. */
  async checkTables(tables: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const t of tables) {
      const res = await fetch(`${this.url}/rest/v1/${t}?select=*&limit=1`, { headers: this.authHeaders(), cache: "no-store" }).catch(() => null);
      out[t] = !res ? "unreachable" : res.ok ? "ok" : res.status === 401 || res.status === 403 ? `key rejected (${res.status})` : res.status === 404 ? "missing: run supabase/setup.sql" : `error ${res.status}`;
    }
    return out;
  }

  async createWorkspace(tokenHash: string) {
    const data = { createdAt: new Date().toISOString(), licensed: false, brands: {} };
    const [row] = await this.q<{ id: string; data: Omit<Workspace, "id"> }[]>("workspaces", { method: "POST", body: JSON.stringify({ token_hash: tokenHash, data }) });
    return { id: row.id, ...row.data };
  }
  async getWorkspace(tokenHash: string) {
    const rows = await this.q<{ id: string; data: Omit<Workspace, "id"> }[]>(`workspaces?token_hash=eq.${encodeURIComponent(tokenHash)}&select=id,data&limit=1`);
    return rows[0] ? { id: rows[0].id, ...rows[0].data } : null;
  }
  async saveWorkspace(w: Workspace) {
    const { id, ...data } = w;
    await this.q(`workspaces?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ data }), headers: { Prefer: "return=minimal" } });
  }

  async getWorkspaceById(id: string) {
    const rows = await this.q<{ id: string; data: Omit<Workspace, "id"> }[]>(`workspaces?id=eq.${encodeURIComponent(id)}&select=id,data&limit=1`);
    return rows[0] ? { id: rows[0].id, ...rows[0].data } : null;
  }
  async findWorkspaceByLinkCode(code: string) {
    const rows = await this.q<{ id: string; data: Omit<Workspace, "id"> }[]>(`workspaces?data->>linkCode=eq.${encodeURIComponent(code.toUpperCase())}&select=id,data&limit=1`);
    return rows[0] ? { id: rows[0].id, ...rows[0].data } : null;
  }
  async getPhone(phone: string) {
    const rows = await this.q<{ data: Phone }[]>(`phones?phone=eq.${encodeURIComponent(phone)}&select=data&limit=1`);
    return rows[0]?.data ?? null;
  }
  async savePhone(p: Phone) {
    await this.q("phones", { method: "POST", body: JSON.stringify({ phone: p.phone, workspace_id: p.workspaceId, opted_out: p.optedOut, data: p }), headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
  }
  async listPhones(o: { workspaceId?: string; optedIn?: boolean } = {}) {
    const f = [o.workspaceId ? `workspace_id=eq.${o.workspaceId}` : "", o.optedIn ? "opted_out=eq.false" : ""].filter(Boolean).join("&");
    const rows = await this.q<{ data: Phone }[]>(`phones?${f}${f ? "&" : ""}select=data&limit=5000`);
    return rows.map((r) => r.data);
  }
  async addSnapshot(s: Snapshot) {
    await this.q("snapshots", { method: "POST", body: JSON.stringify({ id: s.id, workspace_id: s.workspaceId, brand: s.brand, kind: s.kind, created_at: s.createdAt, data: s }), headers: { Prefer: "return=minimal" } });
  }
  async listSnapshots(id: string, o: { brand?: string; kind?: string; limit?: number } = {}) {
    const f = [`workspace_id=eq.${id}`, o.brand ? `brand=eq.${encodeURIComponent(o.brand)}` : "", o.kind ? `kind=eq.${o.kind}` : ""].filter(Boolean).join("&");
    const rows = await this.q<{ data: Snapshot }[]>(`snapshots?${f}&select=data&order=created_at.desc&limit=${o.limit ?? 50}`);
    return rows.map((r) => r.data);
  }

  async peerStats(kind: string, exclude: string) {
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const rows = await this.q<{ workspace_id: string; brand: string; data: Snapshot }[]>(`snapshots?kind=eq.${kind}&workspace_id=neq.${exclude}&created_at=gte.${since}&select=workspace_id,brand,data&order=created_at.desc&limit=2000`);
    const seen = new Set<string>();
    const out: Record<string, number | string>[] = [];
    for (const r of rows) { const k = r.workspace_id + "|" + r.brand; if (seen.has(k)) continue; seen.add(k); out.push(r.data.stats); }
    return out;
  }
  async addRun(r: Run) {
    await this.q("runs", { method: "POST", body: JSON.stringify({ id: r.id, workspace_id: r.workspaceId, brand: r.brand, kind: r.kind, created_at: r.createdAt, data: r }), headers: { Prefer: "return=minimal" } });
  }
  async getRun(id: string, runId?: string, brand?: string) {
    const f = [`workspace_id=eq.${id}`, runId ? `id=eq.${runId}` : "", brand ? `brand=eq.${encodeURIComponent(brand)}` : ""].filter(Boolean).join("&");
    const rows = await this.q<{ data: Run }[]>(`runs?${f}&select=data&order=created_at.desc&limit=1`);
    return rows[0]?.data ?? null;
  }
  async listRuns(id: string, o: { limit?: number } = {}) {
    const rows = await this.q<{ data: Run }[]>(`runs?workspace_id=eq.${id}&select=data&order=created_at.desc&limit=${o.limit ?? 20}`);
    return rows.map((r) => r.data);
  }

  async addActions(a: Action[]) {
    if (!a.length) return;
    await this.q("actions", { method: "POST", body: JSON.stringify(a.map((x) => ({ id: x.id, workspace_id: x.workspaceId, brand: x.brand, status: x.status, applied_at: x.appliedAt, follow_up_at: x.followUpAt, data: x }))), headers: { Prefer: "return=minimal" } });
  }
  async listActions(id: string, o: { brand?: string; status?: Action["status"][]; limit?: number } = {}) {
    const f = [`workspace_id=eq.${id}`, o.brand ? `brand=eq.${encodeURIComponent(o.brand)}` : "", o.status ? `status=in.(${o.status.join(",")})` : ""].filter(Boolean).join("&");
    const rows = await this.q<{ data: Action }[]>(`actions?${f}&select=data&order=applied_at.desc&limit=${o.limit ?? 200}`);
    return rows.map((r) => r.data);
  }
  async saveAction(a: Action) {
    await this.q(`actions?id=eq.${a.id}`, { method: "PATCH", body: JSON.stringify({ status: a.status, follow_up_at: a.followUpAt, data: a }), headers: { Prefer: "return=minimal" } });
  }
}
