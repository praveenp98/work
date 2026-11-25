import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { brainOn } from "./brain";
import { runAction, waitForAction, findId } from "./datadoe";
import { explain, type Listing } from "./listings";
import { APLUS_SYSTEM, APLUS_VERSION } from "./prompts/aplus";
import type { TermLite } from "./rules/terms";

/**
 * A+ content, "Rocco drafts, you approve": text-only Standard modules (text block, product description, tech specs)
 * written from the seller's own listing facts and the searches that sell. The seller edits every word, Amazon
 * validates it (AMAZON_APLUS_CONTENT_VALIDATE), then Rocco submits it (ADD with the ASIN, then PUBLISH) and Amazon
 * reviews it (usually up to 7 days). Only for products that have no A+ yet, and only English-language stores (v1).
 */
export interface AplusDraft { headline: string; intro: string[]; description: string; specs: { label: string; value: string }[] }
export interface AplusRecord {
  id: string; account: string; asin: string; sku: string; at: string; by: string;
  draft: AplusDraft; status: "draft" | "submitted" | "failed";
  contentKey?: string; error?: string;
}

const LOCALE: Record<string, string> = { US: "en-US", CA: "en-CA", UK: "en-GB", GB: "en-GB", IE: "en-GB", IN: "en-IN", AU: "en-AU", SG: "en-SG", AE: "en-AE" };
export const aplusLocale = (country: string) => LOCALE[country.toUpperCase()];
export const canAplus = (country?: string) => !!country && !!aplusLocale(country);

const Draft = z.object({
  headline: z.string(), intro: z.array(z.string()).max(3), description: z.string(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).max(10),
});

/** Words and claims Amazon rejects in A+ (checked on Rocco's draft AND on the seller's edits before submitting). */
const BANNED = /\b(free shipping|money[- ]back|guarantee[ds]?|warrant(y|ies)|best[- ]?seller|#\s?1|top[- ]rated|sale|discount|% off|cheapest|limited time|buy now|cure[sd]?|fda[- ]approved|5[- ]star|reviews?)\b|https?:\/\/|www\.|@[a-z0-9-]+\.|\$\s?\d/i;
export function aplusProblems(d: AplusDraft): string[] {
  const p: string[] = [];
  const all = [d.headline, ...d.intro, d.description, ...d.specs.flatMap((s) => [s.label, s.value])];
  const bad = all.find((t) => BANNED.test(t));
  if (bad) p.push(`Amazon rejects A+ text with prices, guarantees, reviews, "best seller" or health claims: "${bad.match(BANNED)?.[0]}".`);
  if (!d.headline.trim() || d.headline.length > 150) p.push("The headline should be 1–150 characters (80 reads best).");
  if (!d.intro.some((x) => x.trim())) p.push("Write at least one intro paragraph.");
  if (d.description.length > 2000 || d.intro.some((x) => x.length > 1000)) p.push("A paragraph is too long. Keep each under 1,000 characters.");
  return p;
}

let client: Anthropic | null = null;
/** Claude's first draft from the listing's own facts. Null when the brain is off or the draft breaks the rules. */
export async function draftAplus(l: Listing, terms: TermLite[]): Promise<AplusDraft | null> {
  if (!brainOn()) return null;
  const selling = terms.filter((t) => t.o > 0).sort((a, b) => b.sa - a.sa).slice(0, 12).map((t) => t.t);
  const input = [`Title: ${l.title}`, `Bullets:\n${l.bullets.map((b) => `- ${b}`).join("\n")}`, l.description ? `Description: ${l.description.slice(0, 2000)}` : "", `Searches that already sell: ${selling.join("; ") || "(none yet)"}`].filter(Boolean).join("\n\n");
  try {
    const res = await (client ??= new Anthropic()).beta.messages.parse({
      model: "claude-opus-5-5", max_tokens: 4000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(Draft) },
      system: [{ type: "text", text: APLUS_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: input }],
    });
    console.info(`[ai] ${APLUS_VERSION} in=${res.usage?.input_tokens ?? 0} out=${res.usage?.output_tokens ?? 0}`);
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    const d = { ...res.parsed_output, intro: res.parsed_output.intro.slice(0, 2), specs: res.parsed_output.specs.slice(0, 8) };
    return aplusProblems(d).length ? { ...d, ...scrub(d) } : d;
  } catch (e) {
    console.warn(`[${APLUS_VERSION}] failed`, e instanceof Error ? e.message : e);
    return null;
  }
}
/** Drop any sentence that trips Amazon's rules rather than shipping it. */
function scrub(d: AplusDraft): AplusDraft {
  const clean = (t: string) => t.split(/(?<=[.!?])\s+/).filter((s) => !BANNED.test(s)).join(" ");
  return { headline: BANNED.test(d.headline) ? "" : d.headline, intro: d.intro.map(clean), description: clean(d.description), specs: d.specs.filter((s) => !BANNED.test(`${s.label} ${s.value}`)) };
}

const txt = (value: string) => ({ value: value.trim() });
/** The Amazon A+ document (Standard, text-only modules). */
export function aplusDocument(d: AplusDraft, country: string, name: string) {
  const modules: Record<string, unknown>[] = [
    { contentModuleType: "STANDARD_TEXT", standardText: { headline: txt(d.headline), body: { textList: d.intro.filter((x) => x.trim()).map(txt) } } },
  ];
  if (d.description.trim()) modules.push({ contentModuleType: "STANDARD_PRODUCT_DESCRIPTION", standardProductDescription: { body: { textList: [txt(d.description)] } } });
  const specs = d.specs.filter((s) => s.label.trim() && s.value.trim()).slice(0, 8);
  if (specs.length >= 2) modules.push({ contentModuleType: "STANDARD_TECH_SPECS", standardTechSpecs: { headline: txt("Specifications"), specificationList: specs.map((s) => ({ label: txt(s.label.slice(0, 80)), description: txt(s.value.slice(0, 500)) })), tableCount: 1 } });
  return { name: name.slice(0, 100), contentType: "EBC", locale: aplusLocale(country) ?? "en-US", contentModuleList: modules };
}

/** Is there A+ on this ASIN already? (We never replace a seller's existing A+ in v1.) */
export async function hasAplus(accountId: string, asin: string): Promise<boolean | null> {
  const r = await runAction(accountId, "AMAZON_APLUS_CONTENT_PUBLISH_RECORDS_FIND", { asins: [asin] }, { idempotencyKey: `rocco:${accountId}:aplusrec:${asin}:${new Date().toISOString().slice(0, 13)}` });
  if (!r.ok || !r.id) return null;
  const done = await waitForAction(r.id, 12);
  if (!done || /FAIL|ERROR/i.test(done.status)) return null;
  return !!findId(done.result, "contentReferenceKey");
}

/** Validate → create with the ASIN → submit for Amazon's review. Stops at the first problem. */
export async function submitAplus(accountId: string, country: string, asin: string, d: AplusDraft, key: string): Promise<{ ok: boolean; contentKey?: string; error?: string }> {
  const problems = aplusProblems(d);
  if (problems.length) return { ok: false, error: problems[0] };
  const doc = aplusDocument(d, country, `Rocco ${asin} ${new Date().toISOString().slice(0, 10)}`);
  const v = await runAction(accountId, "AMAZON_APLUS_CONTENT_VALIDATE", { items: [{ contentDocument: doc, asins: [asin] }] }, { idempotencyKey: `${key}:validate` });
  if (!v.ok || !v.id) return { ok: false, error: explain(v.error) };
  const vd = await waitForAction(v.id, 15);
  if (vd && (/FAIL|ERROR|REJECT|INVALID/i.test(vd.status) || /"(errors|error)":\s*\[\s*\{/.test(JSON.stringify(vd.result ?? "")))) return { ok: false, error: `Amazon's check found a problem: ${JSON.stringify(vd.result ?? vd.error ?? vd.status).slice(0, 240)}` };
  const add = await runAction(accountId, "AMAZON_APLUS_CONTENT_ADD", { documents: [{ contentDocument: doc, asins: [asin] }] }, { idempotencyKey: `${key}:add` });
  if (!add.ok || !add.id) return { ok: false, error: explain(add.error) };
  const ad = await waitForAction(add.id, 20);
  const contentKey = ad ? findId(ad.result, "contentReferenceKey") : undefined;
  if (!contentKey) return { ok: false, error: ad ? explain(JSON.stringify(ad.error ?? ad.result)) : "Amazon is still creating it. Check again in a few minutes." };
  const pub = await runAction(accountId, "AMAZON_APLUS_CONTENT_PUBLISH", { contentReferenceKeys: [contentKey] }, { idempotencyKey: `${key}:publish` });
  if (!pub.ok) return { ok: false, contentKey, error: explain(pub.error) };
  return { ok: true, contentKey };
}

export const newAplus = (o: Omit<AplusRecord, "id" | "at">): AplusRecord => ({ id: randomUUID().slice(0, 8), at: new Date().toISOString(), ...o });
