import { createHmac } from "node:crypto";
import { secretOk } from "./security";
import { supabaseEnv } from "./store";

/**
 * First-party funnel events (supabase/migrations/004_events.sql). Privacy-friendly on purpose: no third-party
 * script, no cookie, no IP or user agent stored. A row is an event name, a page path, the visit's first-touch
 * source (UTM tags or referrer host) and a random id that lives in the visitor's own browser storage.
 *
 * Without Supabase (local dev, tests) rows are kept in memory so the funnel page still works.
 * Recording never throws: analytics must not be able to break a page, a signup or a payment.
 */
export const CLIENT_EVENTS = ["page_view", "lead_captured", "tool_result", "call_click", "hire_click", "signup_started", "checkout_started", "link_click", "audit_started"] as const;
/** Only the server may write these: call_booked (admin), paid (payment webhook). */
export const SERVER_EVENTS = ["call_booked", "paid"] as const;
export type EventName = (typeof CLIENT_EVENTS)[number] | (typeof SERVER_EVENTS)[number];

export interface EventRow {
  event: EventName;
  path?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  ref_host?: string | null;
  anon_id?: string | null;
  props?: Record<string, string>;
  ref?: string | null;
  created_at?: string;
}
export interface FunnelRow { source: string; visits: number; leads: number; call_clicks: number; calls_booked: number; audits: number; checkouts: number; paid: number }

// ── Cleaning what a browser sends ──────────────────────────────────────────────────────────────────────────
/** Pages behind a private link. Their path is cut to the first segment so a team link can never be stored. */
const PRIVATE = /^\/(w|me|j|welcome|oauth|mcp|admin|thanks|api|card)(\/|$)/;
export const isLandingPath = (p: string) => !PRIVATE.test(p);

export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  const p = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const m = p.match(PRIVATE);
  return (m ? `/${m[1]}` : p).slice(0, 120);
}
const tag = (v: unknown, max = 80) => (typeof v === "string" && v.trim() ? v.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || null : null);
export const cleanHost = (v: unknown) => (typeof v === "string" && /^[a-z0-9.-]{3,80}$/i.test(v.trim()) ? v.trim().toLowerCase().replace(/^www\./, "") : null);
export const cleanAnonId = (v: unknown) => (typeof v === "string" && /^[a-z0-9-]{8,40}$/i.test(v) ? v : null);
const PROP_KEYS = ["magnet", "tool", "plan", "link"] as const;

/** Turn an untrusted request body into a row, or null if it isn't a valid client event. */
export function cleanClientEvent(body: unknown): EventRow | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!(CLIENT_EVENTS as readonly string[]).includes(b.event as string)) return null;
  const path = cleanPath(b.path);
  if (b.event === "page_view" && (!path || !isLandingPath(path))) return null; // landing pages only
  const utm = (b.utm && typeof b.utm === "object" ? b.utm : {}) as Record<string, unknown>;
  const props: Record<string, string> = {};
  const rawProps = (b.props && typeof b.props === "object" ? b.props : {}) as Record<string, unknown>;
  for (const k of PROP_KEYS) { const v = tag(rawProps[k], 60); if (v) props[k] = v; }
  return {
    event: b.event as EventName, path,
    utm_source: tag(utm.source), utm_medium: tag(utm.medium), utm_campaign: tag(utm.campaign), utm_content: tag(utm.content), utm_term: tag(utm.term),
    ref_host: cleanHost(b.ref_host), anon_id: cleanAnonId(b.aid), props,
  };
}

// ── Storage ────────────────────────────────────────────────────────────────────────────────────────────────
const g = globalThis as unknown as { __roccoEvents?: (EventRow & { id: number })[] };
const mem = () => (g.__roccoEvents ??= []);
export const eventsPersistent = () => { const { url, key } = supabaseEnv(); return !!(url && key); };
/** Tests only. */
export const resetEventsForTests = () => { g.__roccoEvents = []; };

async function sb(path: string, init: RequestInit): Promise<{ ok: boolean; status: number; json: unknown } | null> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;
  const base = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const auth: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...auth, "Content-Type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
    const t = await res.text();
    return { ok: res.ok, status: res.status, json: t ? JSON.parse(t) : null };
  } catch { return null; }
}

/** Save one event. Returns false if it could not be saved (or was a duplicate "paid"). Never throws. */
export async function recordEvent(row: EventRow): Promise<boolean> {
  try {
    const clean = { ...row, props: row.props ?? {} };
    if (!eventsPersistent()) {
      if (clean.event === "paid" && clean.ref && mem().some((e) => e.event === "paid" && e.ref === clean.ref)) return false;
      mem().push({ ...clean, id: mem().length + 1, created_at: clean.created_at ?? new Date().toISOString() });
      if (mem().length > 20_000) mem().splice(0, 5_000);
      return true;
    }
    const r = await sb("rocco_events", { method: "POST", body: JSON.stringify(clean), headers: { Prefer: "return=minimal" } });
    return !!r?.ok;
  } catch { return false; }
}

/** The last checkout this team started: where "paid" gets its source from. */
async function lastCheckout(ref: string): Promise<EventRow | null> {
  if (!eventsPersistent()) return [...mem()].reverse().find((e) => e.event === "checkout_started" && e.ref === ref) ?? null;
  const r = await sb(`rocco_events?event=eq.checkout_started&ref=eq.${encodeURIComponent(ref)}&order=created_at.desc&limit=1`, { method: "GET" });
  return r?.ok && Array.isArray(r.json) ? ((r.json[0] as EventRow | undefined) ?? null) : null;
}

/**
 * A team paid. Called from the payment webhook after billing has been decided: it reads nothing back into billing
 * and changes nothing there. Counted once per team (unique index), with the source of the checkout that led to it.
 */
export async function recordPaid(teamId: string, plan?: string, partner?: string | null): Promise<boolean> {
  try {
    const from = await lastCheckout(teamId);
    const p = partner ?? from?.props?.partner;
    return await recordEvent({
      event: "paid", ref: teamId, path: null, anon_id: from?.anon_id ?? null,
      utm_source: from?.utm_source ?? null, utm_medium: from?.utm_medium ?? null, utm_campaign: from?.utm_campaign ?? null, utm_content: from?.utm_content ?? null, utm_term: from?.utm_term ?? null,
      ref_host: from?.ref_host ?? null, props: { ...(plan ? { plan } : {}), ...(p ? { partner: p } : {}) },
    });
  } catch { return false; }
}

/** A partner's referral (props.partner, added on the server from the rocco_partner cookie) beats UTM tags. */
const sourceOf = (e: EventRow) => (e.props?.partner ? `partner:${e.props.partner}` : e.utm_source || e.ref_host || "direct");

/** Same rules as the SQL function rocco_funnel: visits and checkouts count people, the rest count events. */
export function funnelFromRows(rows: (EventRow & { id?: number })[], days: number, now = Date.now()): FunnelRow[] {
  const since = now - days * 86_400_000;
  const by = new Map<string, { visits: Set<string>; checkouts: Set<string>; row: FunnelRow }>();
  rows.forEach((e, i) => {
    if (new Date(e.created_at ?? now).getTime() < since) return;
    const s = sourceOf(e);
    const b = by.get(s) ?? { visits: new Set(), checkouts: new Set(), row: { source: s, visits: 0, leads: 0, call_clicks: 0, calls_booked: 0, audits: 0, checkouts: 0, paid: 0 } };
    by.set(s, b);
    const unique = `#${e.id ?? i}`;
    if (e.event === "page_view") b.visits.add(e.anon_id ?? unique);
    else if (e.event === "lead_captured") b.row.leads++;
    else if (e.event === "call_click") b.row.call_clicks++;
    else if (e.event === "call_booked") b.row.calls_booked++;
    else if (e.event === "audit_started") b.row.audits++;
    else if (e.event === "checkout_started") b.checkouts.add(e.ref ?? e.anon_id ?? unique);
    else if (e.event === "paid") b.row.paid++;
  });
  return [...by.values()].map((b) => ({ ...b.row, visits: b.visits.size, checkouts: b.checkouts.size })).sort((a, b) => b.visits - a.visits || a.source.localeCompare(b.source));
}

export async function funnel(days: number): Promise<{ rows: FunnelRow[]; ok: boolean }> {
  if (!eventsPersistent()) return { rows: funnelFromRows(mem(), days), ok: true };
  const r = await sb("rpc/rocco_funnel", { method: "POST", body: JSON.stringify({ p_days: days }) });
  if (!r?.ok || !Array.isArray(r.json)) return { rows: [], ok: false };
  return { rows: (r.json as Record<string, unknown>[]).map((x) => ({ source: String(x.source), visits: Number(x.visits), leads: Number(x.leads), call_clicks: Number(x.call_clicks), calls_booked: Number(x.calls_booked), audits: Number(x.audits ?? 0) /* 0 until migration 007 */, checkouts: Number(x.checkouts), paid: Number(x.paid) })), ok: true };
}

/** Newest rows first, for checking that events arrive (GET /api/admin/events). */
export async function recentEvents(limit = 50): Promise<EventRow[]> {
  const n = Math.min(500, Math.max(1, limit));
  if (!eventsPersistent()) return [...mem()].reverse().slice(0, n);
  const r = await sb(`rocco_events?order=id.desc&limit=${n}`, { method: "GET" });
  return r?.ok && Array.isArray(r.json) ? (r.json as EventRow[]) : [];
}

// ── Admin sign-in for /admin pages ─────────────────────────────────────────────────────────────────────────
/**
 * /admin pages use the same secret as the admin API routes (CRON_SECRET), but never keep it in a page URL: the
 * hackathon tracker script runs on every page and could read it. /admin/login?key=… checks the secret once, sets
 * this httpOnly cookie (a keyed hash, not the secret) and redirects to a clean URL.
 */
export const ADMIN_COOKIE = "rocco_admin";
export const adminCookieValue = () => (process.env.CRON_SECRET ? createHmac("sha256", process.env.CRON_SECRET).update("rocco-admin-v1").digest("hex") : "");
export const adminCookieOk = (value: string | undefined | null) => secretOk(value, adminCookieValue() || undefined);
export const adminCookieFromHeader = (cookie: string | null) => cookie?.match(/(?:^|;\s*)rocco_admin=([^;]+)/)?.[1] ?? null;
