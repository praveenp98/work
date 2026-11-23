import { createHmac } from "node:crypto";
import { cleanHost, cleanPath } from "./events";
import { secretOk } from "./security";
import { supabaseEnv } from "./store";

/**
 * Marketing leads (supabase/migrations/005_leads.sql): the email someone leaves to get a lead magnet.
 * Server-only. The table has row level security with no policies, so only the service role key can touch it.
 * This module stores and reads; it never sends email.
 */
export const CONSENT_TEXT = "send me rocco's amazon tips and product emails. unsubscribe anytime.";
export const MARKETPLACES = ["US", "UK", "EU", "Canada", "India", "Japan", "Australia", "Other"] as const;
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export interface Lead {
  id?: number;
  email: string;
  name?: string | null;
  marketplace?: string | null;
  monthly_ad_spend_band?: string | null;
  source_page?: string | null;
  lead_magnet: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  consent_marketing: boolean;
  consent_text?: string | null;
  created_at?: string;
  unsubscribed_at?: string | null;
  notes?: string | null;
}

const tag = (v: unknown, max = 80) => (typeof v === "string" && v.trim() ? v.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max) || null : null);

/** The first-touch cookie set by lib/track.ts ("rocco_ft"). Untrusted: every field is cleaned. */
export function readFirstTouch(cookieHeader: string | null): Pick<Lead, "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "referrer"> {
  const empty = { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, referrer: null };
  const raw = cookieHeader?.match(/(?:^|;\s*)rocco_ft=([^;]+)/)?.[1];
  if (!raw) return empty;
  try {
    const ft = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    return { utm_source: tag(ft.source), utm_medium: tag(ft.medium), utm_campaign: tag(ft.campaign), utm_content: tag(ft.content), referrer: cleanHost(ft.ref) };
  } catch { return empty; }
}

/** Turn an untrusted form body into a lead, or say what is wrong with it. */
export function cleanLead(body: unknown, cookieHeader: string | null): { lead: Lead } | { error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return { error: "That email doesn't look right." };
  const lead_magnet = tag(b.leadMagnet, 60);
  if (!lead_magnet) return { error: "Missing lead magnet." };
  const marketplace = (MARKETPLACES as readonly string[]).includes(b.marketplace as string) ? (b.marketplace as string) : null;
  const consent = b.consent === true;
  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim().replace(/[<>]/g, "").slice(0, 80) : null;
  return { lead: { email, name, marketplace, monthly_ad_spend_band: tag(b.adSpendBand, 30), source_page: cleanPath(b.page), lead_magnet, ...readFirstTouch(cookieHeader), consent_marketing: consent, consent_text: consent ? CONSENT_TEXT : null } };
}

// ── Storage (Supabase; memory without it, for local dev and tests) ─────────────────────────────────────────
const g = globalThis as unknown as { __roccoLeads?: Lead[] };
const mem = () => (g.__roccoLeads ??= []);
export const leadsPersistent = () => { const { url, key } = supabaseEnv(); return !!(url && key); };
export const resetLeadsForTests = () => { g.__roccoLeads = []; };

async function sb(path: string, init: RequestInit): Promise<{ ok: boolean; json: unknown } | null> {
  const { url, key } = supabaseEnv();
  if (!url || !key) return null;
  const base = url.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const auth: Record<string, string> = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...auth, "Content-Type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
    const t = await res.text();
    return { ok: res.ok, json: t ? JSON.parse(t) : null };
  } catch { return null; }
}
const q = encodeURIComponent;

/**
 * Save a lead. The same email asking for the same magnet again keeps the first row (and its first-touch source);
 * ticking the consent box later turns consent on, but leaving it unticked never turns consent off.
 */
export async function saveLead(lead: Lead): Promise<{ ok: boolean; duplicate: boolean }> {
  try {
    if (!leadsPersistent()) {
      const old = mem().find((l) => l.email === lead.email && l.lead_magnet === lead.lead_magnet);
      if (old) { if (lead.consent_marketing) Object.assign(old, { consent_marketing: true, consent_text: lead.consent_text, unsubscribed_at: null }); return { ok: true, duplicate: true }; }
      mem().push({ ...lead, id: mem().length + 1, created_at: new Date().toISOString(), unsubscribed_at: null });
      return { ok: true, duplicate: false };
    }
    const r = await sb("marketing_leads?on_conflict=email,lead_magnet", { method: "POST", body: JSON.stringify(lead), headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
    if (!r?.ok) return { ok: false, duplicate: false };
    const duplicate = Array.isArray(r.json) && r.json.length === 0;
    if (duplicate && lead.consent_marketing) await sb(`marketing_leads?email=eq.${q(lead.email)}&lead_magnet=eq.${q(lead.lead_magnet)}`, { method: "PATCH", body: JSON.stringify({ consent_marketing: true, consent_text: lead.consent_text, unsubscribed_at: null }) });
    return { ok: true, duplicate };
  } catch { return { ok: false, duplicate: false }; }
}

/** Stop marketing email for this address, on every lead magnet. Returns how many rows changed. */
export async function unsubscribeEmail(email: string): Promise<number> {
  const at = new Date().toISOString();
  if (!leadsPersistent()) {
    const rows = mem().filter((l) => l.email === email);
    rows.forEach((l) => { l.unsubscribed_at = at; l.consent_marketing = false; });
    return rows.length;
  }
  const r = await sb(`marketing_leads?email=eq.${q(email)}`, { method: "PATCH", body: JSON.stringify({ unsubscribed_at: at, consent_marketing: false }), headers: { Prefer: "return=representation" } });
  return r?.ok && Array.isArray(r.json) ? r.json.length : 0;
}

export async function listLeads(limit = 2000): Promise<{ leads: Lead[]; ok: boolean }> {
  if (!leadsPersistent()) return { leads: [...mem()].reverse().slice(0, limit), ok: true };
  const r = await sb(`marketing_leads?order=created_at.desc&limit=${Math.min(5000, limit)}`, { method: "GET" });
  return r?.ok && Array.isArray(r.json) ? { leads: r.json as Lead[], ok: true } : { leads: [], ok: false };
}

export interface LeadGroup { lead_magnet: string; source: string; leads: number; consented: number; unsubscribed: number }
export function groupLeads(leads: Lead[]): LeadGroup[] {
  const by = new Map<string, LeadGroup>();
  for (const l of leads) {
    const source = l.utm_source || l.referrer || "direct";
    const k = `${l.lead_magnet}|${source}`;
    const row = by.get(k) ?? { lead_magnet: l.lead_magnet, source, leads: 0, consented: 0, unsubscribed: 0 };
    row.leads++;
    if (l.consent_marketing && !l.unsubscribed_at) row.consented++;
    if (l.unsubscribed_at) row.unsubscribed++;
    by.set(k, row);
  }
  return [...by.values()].sort((a, b) => a.lead_magnet.localeCompare(b.lead_magnet) || b.leads - a.leads);
}

// ── Unsubscribe links ──────────────────────────────────────────────────────────────────────────────────────
/** A link that works without a login: the email plus a keyed signature, so nobody can unsubscribe someone else by guessing. */
function unsubSecret(): string | null {
  const e = process.env;
  const s = e.ROCCO_UNSUB_SECRET || e.ROCCO_VAULT_KEY || e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_SECRET_KEY || e.SUPABASE_SERVICE_KEY || e.SUPABASE_KEY || e.CRON_SECRET;
  return s ? `rocco-unsub-v1:${s}` : e.NODE_ENV !== "production" ? "rocco-unsub-v1:dev-only" : null;
}
const sign = (email: string, secret: string) => createHmac("sha256", secret).update(email).digest("base64url");

export function unsubscribeToken(email: string): string | null {
  const s = unsubSecret();
  const e = email.trim().toLowerCase();
  return s ? `${Buffer.from(e).toString("base64url")}.${sign(e, s)}` : null;
}
/** The email a token was made for, or null if the token is not ours. */
export function readUnsubscribeToken(token: string | null | undefined): string | null {
  const s = unsubSecret();
  if (!s || !token) return null;
  const [e64, sig] = token.split(".");
  if (!e64 || !sig) return null;
  let email = "";
  try { email = Buffer.from(e64, "base64url").toString("utf8"); } catch { return null; }
  return EMAIL_RE.test(email) && secretOk(sig, sign(email, s)) ? email : null;
}
export const maskEmail = (email: string) => email.replace(/^(.).*?(@.*)$/, (_, a: string, b: string) => `${a}•••${b}`);
