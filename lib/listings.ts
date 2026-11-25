import { randomUUID } from "node:crypto";
import { runAction, waitForAction } from "./datadoe";
import { MARKETPLACE } from "./restock";
import type { TermLite } from "./rules/terms";

/**
 * Listing edits Rocco can make in Amazon (DataDoe Actions, enabled by the owner):
 *  - Keyword fixes: add the words from searches that already sell to the backend search terms (shoppers never see
 *    these), and suggest them for the title and bullets where the seller edits the final text.
 *  - Listing issue fixes: Amazon's own issues on a listing (missing or invalid attributes) with a box to fix each.
 * Every write: DataDoe dry run → Amazon validation preview (AMAZON_LISTINGS_*_VERIFY) → the change → old values
 * saved so Undo puts them back. Pure helpers are tested in lib/listings.test.ts.
 */

const LANG: Record<string, string> = {
  US: "en_US", CA: "en_CA", MX: "es_MX", BR: "pt_BR", UK: "en_GB", GB: "en_GB", IE: "en_IE", DE: "de_DE", FR: "fr_FR", IT: "it_IT", ES: "es_ES",
  NL: "nl_NL", SE: "sv_SE", PL: "pl_PL", BE: "fr_BE", TR: "tr_TR", IN: "en_IN", JP: "ja_JP", AU: "en_AU", SG: "en_SG", AE: "en_AE", SA: "ar_AE", EG: "ar_AE", ZA: "en_ZA",
};
export const languageTag = (country: string) => LANG[country.toUpperCase()] ?? "en_US";
export const BACKEND_BYTES = 249; // Amazon indexes up to 250 bytes of backend search terms; stay under

export interface Listing {
  sku: string; asin?: string; productType?: string; brand?: string; title: string; bullets: string[]; keywords: string; description?: string;
  issues: ListingIssue[]; status: string[];
  /** Current product images on Amazon (main first), when DataDoe returns them. */
  images?: string[];
}
export interface ListingIssue { code: string; message: string; severity: "ERROR" | "WARNING" | "INFO"; attributes: string[] }

export interface ListingEdit {
  id: string; account: string; sku: string; asin?: string; at: string; by: string;
  field: "keywords" | "title" | "bullets" | "attribute";
  attribute?: string; productType?: string;
  before: string | string[]; after: string | string[];
  status: "applied" | "pending" | "failed" | "undone";
  actionId?: string; error?: string; followUpAt: string;
  /** Sessions and conversion around the change (filled by the result check). */
  result?: { checkedAt: string; summary: string };
}

// ---------- reading a listing ----------
const str = (v: unknown): string => (typeof v === "string" ? v : Array.isArray(v) ? v.map(str).filter(Boolean).join(" ") : v && typeof v === "object" && "value" in (v as object) ? str((v as { value: unknown }).value) : "");
function firstWith(x: unknown, pred: (o: Record<string, unknown>) => boolean): Record<string, unknown> | undefined {
  if (!x || typeof x !== "object") return undefined;
  if (!Array.isArray(x) && pred(x as Record<string, unknown>)) return x as Record<string, unknown>;
  for (const v of Object.values(x as Record<string, unknown>)) { const f = firstWith(v, pred); if (f) return f; }
  return undefined;
}
function allWith(x: unknown, pred: (o: Record<string, unknown>) => boolean, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!x || typeof x !== "object") return out;
  if (!Array.isArray(x) && pred(x as Record<string, unknown>)) out.push(x as Record<string, unknown>);
  for (const v of Object.values(x as Record<string, unknown>)) allWith(v, pred, out);
  return out;
}

/** Amazon listing attributes look like { item_name: [{ value, marketplace_id }] }, nested somewhere in the result. */
function attrAll(item: unknown, name: string): string[] {
  const holder = firstWith(item, (o) => Array.isArray(o[name]));
  return holder ? (holder[name] as unknown[]).map(str).filter(Boolean) : [];
}
const attr = (item: unknown, name: string) => attrAll(item, name)[0] ?? "";

/** DataDoe's AMAZON_LISTINGS_FIND result → the listing for one SKU (defensive: the model is Amazon's, nested). */
export function parseListing(result: unknown, sku: string): Listing | null {
  const item = firstWith(result, (o) => String(o.sku ?? "") === sku) ?? firstWith(result, (o) => "content" in o);
  if (!item) return null;
  const c = (item.content ?? {}) as Record<string, unknown>;
  const bullets = Array.isArray(c.bullets) ? (c.bullets as unknown[]).map(str).filter(Boolean) : Array.isArray(c.bulletPoints) ? (c.bulletPoints as unknown[]).map(str).filter(Boolean) : [];
  const summary = firstWith(item, (o) => "productType" in o || "asin" in o) ?? {};
  const issues = allWith(item.issues ?? item, (o) => "message" in o && ("code" in o || "severity" in o)).map((i): ListingIssue => ({
    code: String(i.code ?? ""), message: String(i.message ?? "").slice(0, 400),
    severity: /ERROR/i.test(String(i.severity)) ? "ERROR" : /WARN/i.test(String(i.severity)) ? "WARNING" : "INFO",
    attributes: Array.isArray(i.attributeNames) ? (i.attributeNames as unknown[]).map(String) : [],
  }));
  const status = allWith(item, (o) => Array.isArray(o.status)).flatMap((o) => (o.status as unknown[]).map(String));
  return {
    sku, asin: String(item.asin ?? summary.asin ?? "") || undefined, productType: String(item.productType ?? summary.productType ?? "") || undefined,
    title: str(c.itemName ?? c.title ?? c.name ?? c.item_name) || attr(item, "item_name"), bullets: bullets.length ? bullets : attrAll(item, "bullet_point"),
    keywords: str(c.genericKeyword ?? c.keywords ?? c.generic_keyword) || attr(item, "generic_keyword"), description: str(c.productDescription ?? c.description) || undefined,
    brand: attr(item, "brand") || undefined,
    issues: dedupe(issues), status: [...new Set(status)], images: listingImages(item),
  };
}
/** Amazon image URLs anywhere in a listing result (main image first, as Amazon lists it). */
export function listingImages(result: unknown): string[] {
  const out: string[] = [];
  const walk = (x: unknown) => {
    if (typeof x === "string") { if (/^https:\/\/[^\s"]+\.(jpe?g|png|webp)(\?.*)?$/i.test(x) && /media-amazon|images-amazon|ssl-images/.test(x)) out.push(x); return; }
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(result);
  return [...new Set(out)].slice(0, 9);
}
const dedupe = (xs: ListingIssue[]) => [...new Map(xs.map((x) => [`${x.code}|${x.message}`, x])).values()];

/** Hidden from shoppers = not BUYABLE or not DISCOVERABLE in its marketplace (Amazon's statuses). */
export const isSuppressed = (l: Listing) => (l.status.length > 0 && !l.status.includes("DISCOVERABLE")) || l.issues.some((i) => i.severity === "ERROR");

// ---------- keyword fixes ----------
const STOP = new Set("a an and the for with of to in on by or from at as is it this that your you my our new best top free cheap sale amazon".split(" "));
const tokens = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w) && !/^b0[a-z0-9]{8}$/.test(w));
const stem = (w: string) => w.replace(/(ies|es|s)$/, "");
const bytes = (s: string) => new TextEncoder().encode(s).length;

export interface KeywordPlan {
  /** New backend keywords (old ones kept first), under 250 bytes. */
  keywords: string; added: string[];
  /** Set by the products route: orders left out because their ad group advertises several products; false = can't link searches to products yet. */
  shared?: { orders: number; terms: number }; linked?: boolean;
  /** Words from top-selling searches that aren't in the title / bullets: suggestions, the seller writes the text. */
  forTitle: string[]; forBullets: string[];
  /** The searches behind it, for the reason line. */
  evidence: { term: string; orders: number; sales: number }[];
}

/**
 * Words from searches that already sell (orders > 0) that the listing doesn't contain anywhere. Never adds: words
 * in `never` (competitor brands the seller lists, plus anything protected), the listing's own brand, ASINs, stop words,
 * or duplicates.
 */
export function keywordPlan(l: Pick<Listing, "title" | "bullets" | "keywords"> & { brand?: string }, terms: TermLite[], never: string[] = []): KeywordPlan {
  // Your own brand is already indexed from the brand field, so it never needs a backend slot.
  const block = new Set([...never, l.brand ?? ""].flatMap(tokens).map(stem));
  const inTitle = new Set(tokens(l.title).map(stem));
  const inBullets = new Set(tokens(l.bullets.join(" ")).map(stem));
  const inKw = new Set(tokens(l.keywords).map(stem));
  const winners = terms.filter((t) => t.o > 0).sort((a, b) => b.sa - a.sa).slice(0, 40);
  const added: string[] = [], forTitle: string[] = [], forBullets: string[] = [], evidence: KeywordPlan["evidence"] = [];
  let kw = l.keywords.trim();
  winners.forEach((t, i) => {
    let used = false;
    for (const w of tokens(t.t)) {
      const s = stem(w);
      if (block.has(s)) continue;
      if (i < 5 && !inTitle.has(s) && !forTitle.includes(w)) { forTitle.push(w); used = true; }
      if (!inBullets.has(s) && !inTitle.has(s) && !forBullets.includes(w) && forBullets.length < 8) { forBullets.push(w); used = true; }
      if (inTitle.has(s) || inBullets.has(s) || inKw.has(s)) continue;
      const next = kw ? `${kw} ${w}` : w;
      if (bytes(next) > BACKEND_BYTES) continue;
      kw = next; inKw.add(s); added.push(w); used = true;
    }
    if (used && evidence.length < 6) evidence.push({ term: t.t, orders: t.o, sales: Math.round(t.sa) });
  });
  return { keywords: kw, added, forTitle: forTitle.slice(0, 6), forBullets: forBullets.slice(0, 8), evidence };
}

/** Plain checks before a title/bullet edit leaves Rocco (Amazon validates the rest in its preview). */
export function checkCopy(field: "title" | "bullets", v: string | string[]): string | null {
  if (field === "title") {
    const t = String(v).trim();
    if (t.length < 10) return "That title looks too short.";
    if (t.length > 200) return "Titles over 200 characters get suppressed in most categories. Shorten it.";
    if (/(.)\1{3,}/.test(t) || /[!$?{}^¬¦~#<>*]/.test(t)) return "Amazon rejects titles with special characters like ! $ ? { } # < > * or repeated letters.";
    if (/\b(best seller|free shipping|sale|% off|#1)\b/i.test(t)) return "Promotional words (best seller, free shipping, sale, % off) aren't allowed in titles.";
    return null;
  }
  const b = (v as string[]).map((x) => x.trim()).filter(Boolean);
  if (!b.length) return "Keep at least one bullet.";
  if (b.length > 5) return "Amazon shows up to 5 bullets.";
  if (b.some((x) => x.length > 1000)) return "Each bullet must be under 1,000 characters (around 250 reads best).";
  if (b.some((x) => /\b(guarantee|warranty|money back|free shipping)\b/i.test(x))) return "Avoid guarantees, warranties and shipping promises in bullets: Amazon can remove them.";
  return null;
}

// ---------- talking to Amazon (DataDoe Actions) ----------
export async function fetchListings(accountId: string, skus: string[]): Promise<{ listings: Listing[]; error?: string }> {
  const ids = [...new Set(skus.filter(Boolean))].slice(0, 50);
  if (!ids.length) return { listings: [] };
  const r = await runAction(accountId, "AMAZON_LISTINGS_FIND", { listingIdentifiers: ids.map((identifier) => ({ identifierType: "SKU", identifier })) }, { idempotencyKey: `rocco:${accountId}:lfind:${Date.now().toString(36)}` });
  if (!r.ok || !r.id) return { listings: [], error: explain(r.error) };
  const done = await waitForAction(r.id, 20);
  if (!done) return { listings: [], error: "Amazon is slow to answer. Try again in a minute." };
  if (/FAIL|ERROR|REJECT/i.test(done.status)) return { listings: [], error: explain(JSON.stringify(done.error ?? done.result)) };
  return { listings: ids.map((s) => parseListing(done.result, s)).filter((x): x is Listing => !!x) };
}

/** Amazon's validation issues from a VERIFY result (errors block the write; warnings are shown). */
export function verifyIssues(result: unknown): ListingIssue[] {
  return dedupe(allWith(result, (o) => "message" in o && ("code" in o || "severity" in o)).map((i) => ({
    code: String(i.code ?? ""), message: String(i.message ?? "").slice(0, 300),
    severity: /ERROR/i.test(String(i.severity)) ? "ERROR" as const : /WARN/i.test(String(i.severity)) ? "WARNING" as const : "INFO" as const,
    attributes: Array.isArray(i.attributeNames) ? (i.attributeNames as unknown[]).map(String) : [],
  })));
}

type Write = { type: "AMAZON_LISTINGS_UPDATE" | "AMAZON_LISTINGS_DETAILS_UPDATE"; details: Record<string, unknown> };

/** Dry run → Amazon preview → write. Returns Amazon's warnings, or why it stopped. Never writes past an error. */
export async function verifiedWrite(accountId: string, w: Write, key: string): Promise<{ ok: boolean; pending?: boolean; actionId?: string; error?: string; warnings: string[] }> {
  const dry = await runAction(accountId, w.type, w.details, { dryRun: true });
  if (!dry.ok) return { ok: false, error: explain(dry.error), warnings: [] };
  const pv = await runAction(accountId, `${w.type}_VERIFY`, w.details, { idempotencyKey: `${key}:verify` });
  let warnings: string[] = [];
  if (pv.ok && pv.id) {
    const done = await waitForAction(pv.id, 15);
    if (done) {
      const issues = verifyIssues(done.result ?? done.error);
      const errors = issues.filter((i) => i.severity === "ERROR");
      if (errors.length || /FAIL|ERROR|REJECT|INVALID/i.test(done.status)) return { ok: false, error: `Amazon's check said no: ${(errors[0]?.message ?? done.status).slice(0, 240)}`, warnings: [] };
      warnings = issues.filter((i) => i.severity === "WARNING").map((i) => i.message);
    }
  } else if (!pv.ok) return { ok: false, error: explain(pv.error), warnings: [] };
  const live = await runAction(accountId, w.type, w.details, { idempotencyKey: key });
  if (!live.ok || !live.id) return { ok: false, error: explain(live.error), warnings };
  const done = await waitForAction(live.id, 20);
  if (!done) return { ok: true, pending: true, actionId: live.id, warnings };
  if (/FAIL|ERROR|REJECT/i.test(done.status)) return { ok: false, actionId: live.id, error: explain(JSON.stringify(done.error ?? done.result)), warnings };
  return { ok: true, actionId: live.id, warnings };
}

/** The basic listing update for one field. */
export function updateBody(sku: string, country: string, field: "keywords" | "title" | "bullets", value: string | string[]): Write {
  const change: Record<string, unknown> = { sku, language_tag: languageTag(country) };
  if (field === "keywords") change.genericKeyword = String(value).slice(0, 256);
  if (field === "title") change.name = String(value).slice(0, 200);
  if (field === "bullets") change.bulletPoints = (value as string[]).slice(0, 5).map((b) => b.slice(0, 1000));
  return { type: "AMAZON_LISTINGS_UPDATE", details: { changes: [change] } };
}

/** A single-attribute fix for a listing issue (text attributes: value + marketplace + language). */
export function attributeBody(sku: string, productType: string, country: string, attribute: string, value: string): Write {
  const marketplace_id = MARKETPLACE[country.toUpperCase()];
  return { type: "AMAZON_LISTINGS_DETAILS_UPDATE", details: { changes: [{ sku, productType, change: { parameterName: attribute, operation: "REPLACE", value: [{ value, ...(marketplace_id ? { marketplace_id } : {}), language_tag: languageTag(country) }] } }] } };
}

export function newEdit(o: Omit<ListingEdit, "id" | "at" | "followUpAt" | "status"> & { status?: ListingEdit["status"] }): ListingEdit {
  const at = new Date();
  return { id: randomUUID().slice(0, 8), at: at.toISOString(), followUpAt: new Date(at.getTime() + 14 * 86_400_000).toISOString(), status: o.status ?? "applied", ...o };
}

export function explain(e?: string): string {
  const s = String(e ?? "");
  if (/not enabled|disabled/i.test(s)) return "Listing changes are switched off in DataDoe. Owner: DataDoe → Settings → Actions → turn on the Listings actions.";
  if (/read.?only|access level|permission/i.test(s)) return "This Amazon account is connected read-only. Reconnect it with read & write access.";
  if (/brand|registry/i.test(s)) return "Amazon only lets the brand owner change this. Is the brand registered to this account?";
  return s ? `Amazon didn't accept it: ${s.slice(0, 200)}` : "Something went wrong. Nothing was changed.";
}
