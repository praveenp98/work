import { allow } from "./human";
import { firstDelivery } from "./text/provider";
import { supabaseEnv } from "./store";

/**
 * Limits and "only once" checks shared by every server (Supabase, supabase/migrations/003_limits.sql).
 * If that table isn't there yet (or Supabase is off, e.g. tests), they fall back to the per-server versions.
 */
async function sb<T>(path: string, init: RequestInit): Promise<T | null> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;
  const base = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const auth: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...auth, "Content-Type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
    if (!res.ok) return null;
    const t = await res.text();
    return (t ? JSON.parse(t) : null) as T;
  } catch { return null; }
}

/** At most `max` times per window for this key, across all servers. */
export async function allowShared(key: string, max: number, windowMs: number): Promise<boolean> {
  const r = await sb<boolean>("rpc/rocco_hit", { method: "POST", body: JSON.stringify({ p_key: key.slice(0, 200), p_max: max, p_window_seconds: Math.ceil(windowMs / 1000) }) });
  return typeof r === "boolean" ? r : allow(key, max, windowMs);
}

/** True only the first time this key is seen (e.g. a webhook message id), across all servers. */
export async function firstTime(key: string): Promise<boolean> {
  const r = await sb<unknown[]>("rocco_marks?on_conflict=key", { method: "POST", body: JSON.stringify({ key: key.slice(0, 200) }), headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
  if (Array.isArray(r)) return r.length > 0 && firstDelivery(key);
  return firstDelivery(key);
}

/** Daily housekeeping. */
export async function cleanupLimits(): Promise<void> {
  await sb("rpc/rocco_limits_cleanup", { method: "POST", body: "{}" });
}
