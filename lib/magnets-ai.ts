import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { brainOn } from "./brain";
import { parseAdviceRules, type Advice } from "./magnets";
export { parseAdviceRules };
import { ADVICE_SYSTEM, ADVICE_VERSION, ROAST_SYSTEM, ROAST_VERSION } from "./prompts/magnets";

/** Claude calls behind the free tools: a savage roast of summary facts, and pulling concrete moves out of pasted advice. */
let client: Anthropic | null = null;
const Roast = z.object({ lines: z.array(z.string()), fix: z.string() });
const AdviceList = z.object({ items: z.array(z.object({ kind: z.enum(["negative", "bid_up", "bid_down", "budget_up", "budget_down", "pause", "harvest", "restructure", "other"]), target: z.string(), amountPct: z.number().optional(), text: z.string() })) });

async function call<T extends z.ZodTypeAny>(label: string, system: string, input: string, schema: T, max: number): Promise<z.infer<T> | null> {
  if (!brainOn()) return null;
  try {
    const res = await (client ??= new Anthropic()).beta.messages.parse({
      model: "claude-opus-5-5", max_tokens: max, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(schema) },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: input }],
    });
    console.info(`[ai] ${label} in=${res.usage?.input_tokens ?? 0} out=${res.usage?.output_tokens ?? 0}`);
    if (res.stop_reason === "refusal" || !res.parsed_output) return null;
    return res.parsed_output as z.infer<T>;
  } catch (e) {
    console.warn(`[${label}] failed`, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function roastText(facts: string): Promise<{ lines: string[]; fix: string } | null> {
  const r = await call(ROAST_VERSION, ROAST_SYSTEM, `Facts from the seller's reports:\n${facts.slice(0, 4000)}`, Roast, 1500);
  return r ? { lines: r.lines.slice(0, 7).map((x) => x.slice(0, 400)), fix: r.fix.slice(0, 400) } : null;
}

export async function extractAdvice(text: string): Promise<Advice[] | null> {
  const r = await call(ADVICE_VERSION, ADVICE_SYSTEM, text.slice(0, 8000), AdviceList, 3000);
  return r ? r.items.slice(0, 25).map((x) => ({ ...x, target: x.target.slice(0, 200), text: x.text.slice(0, 200) })) : null;
}
