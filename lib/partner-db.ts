import { EMAIL_RE } from "./leads";
import { cleanCode, guaranteeEnds, makeCode, PARTNER_SHARE, PARTNER_TYPES, payoutDue, payoutFor, REACH_BANDS, type PartnerType, type PayoutStatus } from "./partners";
import { supabaseEnv } from "./store";
import { trackServer } from "./track-server";

/**
 * Partner program storage (supabase/migrations/006_partners.sql): `partners` and `partner_referrals`.
 * Server-only. Same pattern as lib/leads.ts: Supabase REST with the service key when configured, memory otherwise
 * (local dev, tests, previews with ROCCO_ALLOW_MEMORY_STORE=1). Nothing here ever throws into a page or a payment.
 */
export type PartnerStatus = "pending" | "approved" | "paused";
export interface Partner {
  id?: number;
  code: string | null; // set when Praveen approves
  name: string;
  type: PartnerType;
  email: string;
  website: string | null;
  share: number;
  status: PartnerStatus;
  reach: string | null;
  how: string | null;
  created_at?: string;
  approved_at?: string | null;
}
export interface Referral {
  id?: number;
  partner_code: string;
  workspace_id: string;
  payment_id: string | null;
  plan: "annual" | "monthly";
  amount: number; // USD, what the seller paid
  currency: string | null;
  paid_at: string;
  guarantee_ends_at: string;
  refunded: boolean;
  payout_status: PayoutStatus;
  payout_paid_at: string | null;
  payout_amount: number | null;
  created_at?: string;
}

// ── Application form ───────────────────────────────────────────────────────────────────────────────────────
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "");
export function cleanWebsite(v: unknown): string | null {
  const t = text(v, 200);
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/^https?:$/.test(u.protocol) || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) return null;
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname === "/" ? "" : u.pathname}`.slice(0, 200);
  } catch { return null; }
}

/** Turn an untrusted form body into a pending partner, or say what's wrong (per field). */
export function cleanApplication(body: unknown): { partner: Partner } | { error: string; field: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = text(b.name, 80);
  if (name.length < 2) return { error: "Add your name or your business name.", field: "name" };
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return { error: "That email doesn't look right.", field: "email" };
  const website = cleanWebsite(b.website);
  if (text(b.website, 200) && !website) return { error: "That website doesn't look right. Try something like yoursite.com.", field: "website" };
  const type = PARTNER_TYPES.some((t) => t.id === b.type) ? (b.type as PartnerType) : null;
  if (!type) return { error: "Pick what describes you best.", field: "type" };
  const reach = (REACH_BANDS as readonly string[]).includes(b.reach as string) ? (b.reach as string) : null;
  if (!reach) return { error: "Pick roughly how many US sellers you reach.", field: "reach" };
  const how = text(b.how, 600);
  if (how.length < 10) return { error: "Tell us in a sentence how you'd share Rocco.", field: "how" };
  return { partner: { code: null, name, type, email, website, share: PARTNER_SHARE, status: "pending", reach, how } };
}

// ── Storage ────────────────────────────────────────────────────────────────────────────────────────────────
const g = globalThis as unknown as { __roccoPartners?: Partner[]; __roccoReferrals?: Referral[]; __roccoPartnerCache?: Map<string, { at: number; p: Partner | null }> };
const memP = () => (g.__roccoPartners ??= []);
const memR = () => (g.__roccoReferrals ??= []);
const cache = () => (g.__roccoPartnerCache ??= new Map());
export const partnersPersistent = () => { const { url, key } = supabaseEnv(); return !!(url && key); };
export const resetPartnersForTests = () => { g.__roccoPartners = []; g.__roccoReferrals = []; g.__roccoPartnerCache = new Map(); };

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
const rows = <T>(r: { ok: boolean; json: unknown } | null): T[] => (r?.ok && Array.isArray(r.json) ? (r.json as T[]) : []);

/** Save an application. The same email applying twice keeps the first one. */
export async function savePartnerApplication(p: Partner): Promise<{ ok: boolean; duplicate: boolean }> {
  try {
    if (!partnersPersistent()) {
      if (memP().some((x) => x.email === p.email)) return { ok: true, duplicate: true };
      memP().push({ ...p, id: memP().length + 1, created_at: new Date().toISOString(), approved_at: null });
      return { ok: true, duplicate: false };
    }
    const r = await sb("partners?on_conflict=email", { method: "POST", body: JSON.stringify(p), headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
    if (!r?.ok) return { ok: false, duplicate: false };
    return { ok: true, duplicate: Array.isArray(r.json) && r.json.length === 0 };
  } catch { return { ok: false, duplicate: false }; }
}

export async function listPartners(): Promise<{ partners: Partner[]; ok: boolean }> {
  if (!partnersPersistent()) return { partners: [...memP()].reverse(), ok: true };
  const r = await sb("partners?order=created_at.desc&limit=1000", { method: "GET" });
  return r?.ok && Array.isArray(r.json) ? { partners: r.json as Partner[], ok: true } : { partners: [], ok: false };
}

export async function getPartnerByCode(code: string): Promise<Partner | null> {
  const c = cleanCode(code);
  if (!c) return null;
  if (!partnersPersistent()) return memP().find((p) => p.code === c) ?? null;
  return rows<Partner>(await sb(`partners?code=eq.${q(c)}&limit=1`, { method: "GET" }))[0] ?? null;
}

/** The approved partner behind a code, cached for a minute (the proxy asks on every ?partner= visit). */
export async function approvedPartner(code: string | null | undefined): Promise<Partner | null> {
  const c = cleanCode(code);
  if (!c) return null;
  const hit = cache().get(c);
  if (hit && Date.now() - hit.at < 60_000) return hit.p;
  const p = await getPartnerByCode(c).catch(() => null);
  const ok = p && p.status === "approved" ? p : null;
  cache().set(c, { at: Date.now(), p: ok });
  if (cache().size > 500) cache().clear();
  return ok;
}

/** Approve (giving the partner a code if it has none) or pause. Returns the partner after the change. */
export async function setPartnerStatus(id: number, status: "approved" | "paused"): Promise<Partner | null> {
  const { partners } = await listPartners();
  const p = partners.find((x) => x.id === id);
  if (!p) return null;
  const patch: Partial<Partner> = { status };
  if (status === "approved" && !p.code) { patch.code = makeCode(p.name, partners.map((x) => x.code).filter(Boolean) as string[]); patch.approved_at = new Date().toISOString(); }
  cache().clear();
  if (!partnersPersistent()) { Object.assign(p, patch); return { ...p }; }
  const r = await sb(`partners?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=representation" } });
  return rows<Partner>(r)[0] ?? null;
}

export async function listReferrals(): Promise<{ referrals: Referral[]; ok: boolean }> {
  if (!partnersPersistent()) return { referrals: [...memR()].reverse(), ok: true };
  const r = await sb("partner_referrals?order=paid_at.desc&limit=2000", { method: "GET" });
  return r?.ok && Array.isArray(r.json) ? { referrals: r.json as Referral[], ok: true } : { referrals: [], ok: false };
}

export interface Sale { partner: string; workspaceId: string; paymentId?: string | null; plan: "annual" | "monthly"; amountUsd: number; currency?: string | null; paidAt: string }

/**
 * A team that came from a partner paid (called from lib/billing.ts on a succeeded payment). One row per team: the
 * first payment. Replays and renewals are ignored. Only codes that belong to a partner are recorded.
 */
export async function recordReferral(s: Sale): Promise<"recorded" | "duplicate" | "unknown_partner" | "failed"> {
  try {
    const code = cleanCode(s.partner);
    const p = code ? await getPartnerByCode(code) : null;
    if (!code || !p || p.status === "pending") return "unknown_partner";
    const row: Referral = {
      partner_code: code, workspace_id: s.workspaceId, payment_id: s.paymentId ?? null, plan: s.plan, amount: Math.round(s.amountUsd * 100) / 100, currency: s.currency ?? null,
      paid_at: s.paidAt, guarantee_ends_at: guaranteeEnds(s.paidAt), refunded: false, payout_status: "due", payout_paid_at: null, payout_amount: null,
    };
    let fresh = false;
    if (!partnersPersistent()) {
      if (!memR().some((r) => r.workspace_id === row.workspace_id)) { memR().push({ ...row, id: memR().length + 1, created_at: new Date().toISOString() }); fresh = true; }
    } else {
      const r = await sb("partner_referrals?on_conflict=workspace_id", { method: "POST", body: JSON.stringify(row), headers: { Prefer: "resolution=ignore-duplicates,return=representation" } });
      if (!r?.ok) return "failed";
      fresh = Array.isArray(r.json) && r.json.length > 0;
    }
    if (!fresh) return "duplicate";
    trackServer(s.workspaceId, "partner_sale", { code, plan: s.plan, usd: row.amount });
    return "recorded";
  } catch { return "failed"; }
}

/** The seller refunded or disputed: no payout (a payout already sent stays "paid" and shows as refunded in admin). */
export async function markReferralRefunded(workspaceId: string, paymentId?: string | null): Promise<void> {
  try {
    if (!partnersPersistent()) {
      for (const r of memR()) if (r.workspace_id === workspaceId && (!paymentId || !r.payment_id || r.payment_id === paymentId)) { r.refunded = true; if (r.payout_status === "due") r.payout_status = "void"; }
      return;
    }
    const f = `workspace_id=eq.${q(workspaceId)}${paymentId ? `&or=(payment_id.is.null,payment_id.eq.${q(paymentId)})` : ""}`;
    await sb(`partner_referrals?${f}`, { method: "PATCH", body: JSON.stringify({ refunded: true }), headers: { Prefer: "return=minimal" } });
    await sb(`partner_referrals?${f}&payout_status=eq.due`, { method: "PATCH", body: JSON.stringify({ payout_status: "void" }), headers: { Prefer: "return=minimal" } });
  } catch { /* never breaks billing */ }
}

/** Praveen paid a partner by hand: record what and when. Only a payout that is due can be marked paid. */
export async function markPayoutPaid(id: number, amount: number, paidOn: string, now = new Date()): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) return { ok: false, error: "amount" };
  const day = /^\d{4}-\d{2}-\d{2}$/.test(paidOn) ? new Date(`${paidOn}T12:00:00Z`) : null;
  if (!day || Number.isNaN(day.getTime())) return { ok: false, error: "date" };
  const { referrals } = await listReferrals();
  const r = referrals.find((x) => x.id === id);
  if (!r || !payoutDue(r, now)) return { ok: false, error: "not_due" };
  const patch = { payout_status: "paid" as const, payout_amount: Math.round(amount * 100) / 100, payout_paid_at: day.toISOString() };
  if (!partnersPersistent()) { Object.assign(memR().find((x) => x.id === id)!, patch); return { ok: true }; }
  const res = await sb(`partner_referrals?id=eq.${id}&payout_status=eq.due`, { method: "PATCH", body: JSON.stringify(patch), headers: { Prefer: "return=minimal" } });
  return { ok: !!res?.ok };
}

/** What the payout should be for a referral (the partner's own share, else the program default). */
export const suggestedPayout = (r: Referral, partners: Partner[]) => payoutFor(r.amount, partners.find((p) => p.code === r.partner_code)?.share ?? PARTNER_SHARE);
