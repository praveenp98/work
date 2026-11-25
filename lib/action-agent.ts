import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { brainOn } from "./brain";
import { runAction, waitForAction } from "./datadoe";
import { actionByType, catalogueText, isWrite } from "./doe-actions";
import { ACTIONS_SYSTEM, ACTIONS_VERSION } from "./prompts/actions";

/**
 * "Tell Rocco what to change": Claude Opus picks one DataDoe Action for the seller's request, looks up IDs with read
 * Actions, and fixes the details until DataDoe's free dry run validates. The result is a plan the seller approves on
 * the Actions page (app/api/w/actions); nothing reaches Amazon until then. Pure helpers are tested in
 * lib/action-agent.test.ts; the Claude loop needs ANTHROPIC_API_KEY.
 */
export interface ActionPlan {
  id: string; at: string; by: string; account: string; request: string;
  type: string; details: Record<string, unknown>; summary: string; lines: string[];
  status: "planned" | "running" | "done" | "failed" | "cancelled";
  actionId?: string; result?: string; error?: string; doneAt?: string;
}
export type PlanOutcome = { plan: Omit<ActionPlan, "id" | "at" | "by" | "account" | "request" | "status"> } | { answer: string } | { question: string } | { error: string };

const MAX_TURNS = 10, MAX_LOOKUPS = 4;
let client: Anthropic | null = null;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  { name: "dry_run", description: "Validate an Action for free (never reaches Amazon). Returns VALIDATED or DataDoe's validation messages.", input_schema: { type: "object", properties: { type: { type: "string" }, details: { type: "object" } }, required: ["type", "details"] } },
  { name: "lookup", description: "Run a READ (R) Action live to fetch IDs or current values (campaigns, targets, listings, orders…). Write types are refused.", input_schema: { type: "object", properties: { type: { type: "string" }, details: { type: "object" } }, required: ["type", "details"] } },
  { name: "propose", description: "Final step for a change: the validated Action for the seller to approve.", input_schema: { type: "object", properties: { type: { type: "string" }, details: { type: "object" }, summary: { type: "string" }, lines: { type: "array", items: { type: "string" } } }, required: ["type", "details", "summary", "lines"] } },
  { name: "answer", description: "Final step for a question or a refusal: a short plain-English answer.", input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "ask", description: "Final step when you need one detail from the seller.", input_schema: { type: "object", properties: { question: { type: "string" } }, required: ["question"] } },
];

/** DataDoe's reply to a dry run, as short text for the model. */
export function dryRunText(r: { ok: boolean; status?: string; error?: string }): string {
  if (r.ok && /VALID/i.test(r.status ?? "")) return "VALIDATED";
  return `NOT VALID: ${(r.error ?? r.status ?? "unknown").slice(0, 900)}`;
}

/** The final plan must be a known write type and pass a dry run here, on the server, whatever the model said. */
export async function checkPlan(account: string, type: string, details: Record<string, unknown>): Promise<string | null> {
  const a = actionByType(type);
  if (!a) return "Unknown action type.";
  if (a.mode !== "W") return "That's a lookup, not a change.";
  if (!details || typeof details !== "object") return "Missing details.";
  const r = await dryRun(account, type, details);
  return r === "VALIDATED" ? null : r.replace(/^NOT VALID: /, "Amazon's check didn't pass: ");
}

async function dryRun(account: string, type: string, details: Record<string, unknown>): Promise<string> {
  if (!actionByType(type)) return "NOT VALID: unknown type; use one from the list.";
  const res = await fetch(`${(process.env.DATADOE_API_URL || "https://api.datadoe.com/api/v1").replace(/\/$/, "")}/actions`, {
    method: "POST", headers: { "datadoe-api-key": process.env.DATADOE_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({ type, sellerOrVendorId: account, details, dryRun: true }), cache: "no-store",
  }).catch(() => null);
  if (!res) return "NOT VALID: DataDoe didn't answer; try again.";
  const body = (await res.json().catch(() => ({}))) as { status?: string; message?: unknown; validation?: { valid?: boolean; issues?: { message?: string }[] } };
  if (res.ok && body.validation?.valid !== false && /VALID/i.test(String(body.status))) return "VALIDATED";
  const msgs = body.validation?.issues?.map((i) => i.message).filter(Boolean) ?? (Array.isArray(body.message) ? body.message : [body.message ?? body.status]);
  return `NOT VALID: ${JSON.stringify(msgs).slice(0, 900)}`;
}

async function lookup(account: string, type: string, details: Record<string, unknown>): Promise<string> {
  if (isWrite(type) || !actionByType(type)) return "Refused: lookup only runs read (R) types.";
  const r = await runAction(account, type, details, { idempotencyKey: `rocco-lookup-${randomUUID()}` });
  if (!r.ok) return `Lookup failed: ${(r.error ?? "").slice(0, 600)}`;
  if (!r.id) return "Lookup started but returned no id.";
  const done = await waitForAction(r.id, 20);
  if (!done) return "Lookup is still running at Amazon; ask the seller to try again in a minute.";
  return JSON.stringify(done.result ?? done.error ?? done.status).slice(0, 7000);
}

export async function planAction(request: string, ctx: { account: string; accountLabel: string; accountType?: "SELLER" | "VENDOR" }): Promise<PlanOutcome> {
  if (!brainOn()) return { error: "Rocco's AI isn't switched on yet." };
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: request.slice(0, 2000) }];
  let lookups = 0;
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const res = await (client ??= new Anthropic()).beta.messages.create({
        model: "claude-opus-5-5", max_tokens: 6000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: ACTIONS_SYSTEM(catalogueText(ctx.accountType), ctx.accountLabel), cache_control: { type: "ephemeral" } }],
        tools: TOOLS, tool_choice: { type: "any" }, messages,
      } as Anthropic.Beta.MessageCreateParamsNonStreaming);
      console.info(`[ai] ${ACTIONS_VERSION} turn=${turn} in=${res.usage?.input_tokens ?? 0} out=${res.usage?.output_tokens ?? 0}`);
      if (res.stop_reason === "refusal") return { answer: "I can't help with that one." };
      messages.push({ role: "assistant", content: res.content });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type !== "tool_use") continue;
        const input = (block.input ?? {}) as { type?: string; details?: Record<string, unknown>; summary?: string; lines?: string[]; text?: string; question?: string };
        if (block.name === "answer") return { answer: String(input.text ?? "").slice(0, 2000) };
        if (block.name === "ask") return { question: String(input.question ?? "").slice(0, 400) };
        if (block.name === "propose") {
          const err = await checkPlan(ctx.account, String(input.type), input.details ?? {});
          if (err) { results.push({ type: "tool_result", tool_use_id: block.id, content: `Rejected: ${err}. Fix it and propose again.`, is_error: true }); continue; }
          return { plan: { type: String(input.type), details: input.details ?? {}, summary: String(input.summary ?? "").slice(0, 400), lines: (input.lines ?? []).map((l) => String(l).slice(0, 200)).slice(0, 8) } };
        }
        const content = block.name === "dry_run" ? await dryRun(ctx.account, String(input.type), input.details ?? {})
          : block.name === "lookup" ? (++lookups > MAX_LOOKUPS ? "Lookup limit reached: work with what you have or ask the seller." : await lookup(ctx.account, String(input.type), input.details ?? {}))
          : "Unknown tool.";
        results.push({ type: "tool_result", tool_use_id: block.id, content });
      }
      if (!results.length) return { error: "Rocco couldn't work out a change for that. Try saying it differently." };
      messages.push({ role: "user", content: results });
    }
    return { error: "That took too many steps. Try a smaller, more specific request." };
  } catch (e) {
    console.warn(`[${ACTIONS_VERSION}] failed`, e instanceof Error ? e.message : e);
    return { error: "Rocco's AI didn't answer. Try again in a minute." };
  }
}

export function newPlan(p: Omit<ActionPlan, "id" | "at" | "status">): ActionPlan {
  return { ...p, id: randomUUID(), at: new Date().toISOString(), status: "planned" };
}

/** Plans expire after 30 minutes so an old preview can't be approved against a changed account. */
export const planFresh = (p: ActionPlan, now = Date.now()) => p.status === "planned" && now - Date.parse(p.at) < 30 * 60_000;

/** Human text for a finished Action's result. */
export function resultText(done: { status: string; result?: unknown; error?: unknown } | null): string {
  if (!done) return "Sent to Amazon; still processing. Check the change log in a few minutes.";
  if (/FAIL|ERROR|REJECT/i.test(done.status)) return `Amazon said no: ${JSON.stringify(done.error ?? done.result).slice(0, 300)}`;
  return "Done in Amazon ✓";
}
