import Anthropic from "@anthropic-ai/sdk";

/**
 * Rocco's brain for texts: free-text questions and screenshots, answered by Claude from what Rocco knows about
 * this team (their brief, latest numbers, change log). Off until ANTHROPIC_API_KEY is set; callers fall back to
 * the rule-based replies. Prompts live in lib/prompts/text-reply.ts.
 */
import { TEXT_REPLY_SYSTEM } from "./prompts/text-reply";

export const brainOn = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

/**
 * One SMS-length reply. `context` is everything Rocco knows (plain text); `images` are https URLs of
 * screenshots the person texted. Returns null when the brain is off, refuses, or errors (caller falls back).
 */
export async function askRocco(o: { question: string; context: string; images?: string[] }): Promise<string | null> {
  if (!brainOn()) return null;
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...(o.images ?? []).slice(0, 4).map((url) => ({ type: "image" as const, source: { type: "url" as const, url } })),
    { type: "text", text: `What Rocco knows about this team:\n${o.context}\n\nTheir text:\n${o.question || "(they sent a screenshot with no text)"}` },
  ];
  try {
    const res = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // a policy decline is re-run on a fallback model in the same call
      output_config: { effort: "low" }, // short chat replies: low effort is plenty and fast
      system: [{ type: "text", text: TEXT_REPLY_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    return text ? text.slice(0, 1200) : null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.warn("[brain] rate limited");
    else if (e instanceof Anthropic.APIError) console.warn(`[brain] API error ${e.status}`);
    else console.warn("[brain] failed", e);
    return null;
  }
}
