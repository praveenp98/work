import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { brainOn } from "./brain";
import { ASPECTS, type Aspect } from "./higgsfield";
import { MARKETPLACE } from "./restock";
import { CREATIVE_SYSTEM, CREATIVE_VERSION } from "./prompts/creative";
import type { Listing } from "./listings";
import type { TermLite } from "./rules/terms";

/**
 * Listing and A+ images on demand: Claude Opus plans each image from the listing (lib/prompts/creative.ts), Higgsfield
 * renders it from the seller's real product photo (lib/higgsfield.ts), the seller picks, and Rocco puts a listing image
 * into its slot through DataDoe (other_product_image_locator_N, Amazon checks it first). A+ images are downloaded and
 * added in A+ Content Manager. Pure helpers tested in lib/creative.test.ts.
 */
export type CreativeKind = "listing" | "aplus";
export interface Concept { slot: string; title: string; why: string; prompt: string; negative: string; aspect: Aspect }
export interface Creative {
  id: string; at: string; by: string; account: string; sku: string; asin?: string; kind: CreativeKind;
  concept: Concept; requestId?: string; status: "rendering" | "ready" | "failed" | "used";
  images: string[]; error?: string; usedSlot?: number; usedUrl?: string; usedAt?: string; expiresAt?: string;
}

const ConceptSchema = z.object({ slot: z.string(), title: z.string(), why: z.string(), prompt: z.string(), negative: z.string(), aspect: z.string() });
const Plan = z.object({ concepts: z.array(ConceptSchema) });

/** Things no image prompt may ask for (Amazon image policy). Checked on every prompt, including seller edits. */
export const BANNED_IMAGE = /\b(amazon('s)? choice|best ?seller|#1|number one|prime badge|5[- ]?stars?|star rating|reviews?|free shipping|\$\s?\d|price|discount|sale\b|watermark|qr code|logo of|nike|apple|disney|marvel)\b/i;

export function promptProblems(p: string): string | null {
  if (p.trim().length < 20) return "Describe the image in a sentence or two.";
  if (p.length > 3000) return "That description is too long.";
  const m = p.match(BANNED_IMAGE);
  return m ? `Amazon doesn't allow "${m[0]}" in product images.` : null;
}

/** Clean what the model returned: valid aspect, safe prompt, sane slot. */
export function cleanConcepts(raw: z.infer<typeof Plan>["concepts"], kind: CreativeKind): Concept[] {
  const out: Concept[] = [];
  for (const c of raw) {
    const aspect = (ASPECTS as readonly string[]).includes(c.aspect) ? (c.aspect as Aspect) : kind === "listing" ? "1:1" : "16:9";
    const prompt = c.prompt.replace(BANNED_IMAGE, "").replace(/\s+/g, " ").trim().slice(0, 1500);
    if (prompt.length < 20) continue;
    const slot = kind === "listing" ? String(Math.min(8, Math.max(2, parseInt(c.slot, 10) || out.length + 2))) : c.slot.slice(0, 20);
    out.push({ slot, title: c.title.slice(0, 60), why: c.why.slice(0, 240), prompt, negative: `${c.negative.slice(0, 600)}, altered product, extra logos, misspelled text, watermark, badges, distorted label`.slice(0, 900), aspect: kind === "listing" ? "1:1" : aspect });
  }
  return out.slice(0, 6);
}

let client: Anthropic | null = null;
/** Opus plans 4–6 images for this listing. Null when the brain is off or the answer can't be used. */
export async function planCreatives(l: Listing, terms: TermLite[], kind: CreativeKind, note?: string): Promise<Concept[] | null> {
  if (!brainOn()) return null;
  const selling = terms.filter((t) => t.o > 0).sort((a, b) => b.sa - a.sa).slice(0, 10).map((t) => t.t);
  const input = [`Kind: ${kind}`, `Title: ${l.title}`, `Bullets:\n${l.bullets.map((b) => `- ${b}`).join("\n")}`, l.description ? `Description: ${l.description.slice(0, 1500)}` : "", `Searches that sell: ${selling.join("; ") || "(none yet)"}`, note ? `Seller's note: ${note.slice(0, 400)}` : ""].filter(Boolean).join("\n\n");
  try {
    const res = await (client ??= new Anthropic()).beta.messages.parse({
      model: "claude-opus-5-5", max_tokens: 6000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Plan) },
      system: [{ type: "text", text: CREATIVE_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: input }],
    });
    console.info(`[ai] ${CREATIVE_VERSION} in=${res.usage?.input_tokens ?? 0} out=${res.usage?.output_tokens ?? 0}`);
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    const c = cleanConcepts(res.parsed_output.concepts, kind);
    return c.length ? c : null;
  } catch (e) {
    console.warn(`[${CREATIVE_VERSION}] failed`, e instanceof Error ? e.message : e);
    return null;
  }
}

/** The DataDoe change that puts an image into listing slot 2–8 (Amazon's other_product_image_locator_1..7). */
export function imageSlotBody(sku: string, productType: string, country: string, slot: number, url: string) {
  const n = Math.min(8, Math.max(2, Math.round(slot))) - 1;
  const marketplace_id = MARKETPLACE[country.toUpperCase()];
  return { type: "AMAZON_LISTINGS_DETAILS_UPDATE" as const, details: { changes: [{ sku, productType, change: { parameterName: `other_product_image_locator_${n}`, operation: "REPLACE", value: [{ media_location: url, ...(marketplace_id ? { marketplace_id } : {}) }] } }] } };
}

export function newCreative(o: Omit<Creative, "id" | "at" | "status" | "images">): Creative {
  return { ...o, id: randomUUID(), at: new Date().toISOString(), status: "rendering", images: [], expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() };
}

export { listingImages } from "./listings";
