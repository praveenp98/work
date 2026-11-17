/**
 * Texting via LoopMessage (iMessage / SMS / RCS / WhatsApp), per https://loopmessage.com/apidocs:
 * - Send: POST https://a.loopmessage.com/api/v1/message/send/  · header Authorization: <API key> (no "Bearer")
 *   body { contact, text, sender?, attachments?: [https urls] }
 * - Opt-in links: POST https://a.loopmessage.com/api/v1/opt-in/generate-url/  body { body: "... [opt-in-code]", sender_type?: "shared", ...custom }
 *   custom fields come back in the inbound webhook as `parameters`.
 * Without LOOPMESSAGE_API_KEY everything runs in dry-run (logged, kept in memory) so the flow stays testable.
 */
export interface Sent { to: string; text: string; mediaUrl?: string; at: string; dryRun: boolean }

const API = "https://a.loopmessage.com/api/v1";
const g = globalThis as unknown as { __roccoOutbox?: Sent[] };
export const outbox = () => (g.__roccoOutbox ??= []);
const remember = (m: Sent) => { const o = outbox(); o.push(m); if (o.length > 200) o.splice(0, o.length - 200); };

export const textingConfigured = () => !!process.env.LOOPMESSAGE_API_KEY;
const auth = () => ({ Authorization: process.env.LOOPMESSAGE_API_KEY!, "Content-Type": "application/json" });

export async function sendText(to: string, text: string, opts: { mediaUrl?: string } = {}): Promise<{ ok: boolean; dryRun: boolean; error?: string; messageId?: string }> {
  const at = new Date().toISOString();
  if (!textingConfigured()) {
    remember({ to, text, mediaUrl: opts.mediaUrl, at, dryRun: true });
    if (process.env.NODE_ENV !== "test") console.info(`[text dry-run] → ${to}: ${text.slice(0, 120)}`);
    return { ok: true, dryRun: true };
  }
  const body: Record<string, unknown> = { contact: to, text };
  if (process.env.LOOPMESSAGE_SENDER) body.sender = process.env.LOOPMESSAGE_SENDER;
  if (opts.mediaUrl) body.attachments = [opts.mediaUrl];
  const res = await fetch(`${API}/message/send/`, { method: "POST", headers: auth(), body: JSON.stringify(body) }).catch(() => null);
  const data = res ? ((await res.json().catch(() => ({}))) as { message_id?: string; success?: boolean; message?: string }) : {};
  if (!res?.ok || data.success === false) {
    const error = res ? `HTTP ${res.status}: ${data.message ?? "send failed"}` : "network error";
    console.error(`[text] send to ${to} failed: ${error}`);
    return { ok: false, dryRun: false, error };
  }
  remember({ to, text, mediaUrl: opts.mediaUrl, at, dryRun: false });
  return { ok: true, dryRun: false, messageId: data.message_id };
}

/**
 * A personal opt-in link: opens Messages with a prefilled first text. `link` (the workspace code) comes back
 * in the webhook's `parameters`, so the phone gets linked automatically. Null in dry-run or on failure.
 */
export async function optInLinks(opts: { link?: string; body?: string } = {}): Promise<{ imessage?: string; sms?: string; whatsapp?: string; url?: string } | null> {
  if (!textingConfigured()) return null;
  const payload: Record<string, unknown> = { body: opts.body ?? "Hi Rocco 👋 [opt-in-code]" };
  if (opts.link) payload.link = opts.link;
  if (process.env.LOOPMESSAGE_SENDER_TYPE === "shared") payload.sender_type = "shared";
  const res = await fetch(`${API}/opt-in/generate-url/`, { method: "POST", headers: auth(), body: JSON.stringify(payload), cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json().catch(() => null)) as { imessage?: string; sms?: string; whatsapp?: string; url?: string } | null;
}

/** Normalize a LoopMessage webhook into what Rocco needs. Returns null for events Rocco ignores (statuses, reactions). */
export function parseInbound(b: Record<string, unknown>): { id: string; contact: string; text: string; linkCode?: string; optIn: boolean } | null {
  const event = String(b.event ?? b.alert_type ?? "");
  if (event !== "message_inbound") return null;
  const contact = String(b.contact ?? b.recipient ?? "").trim();
  if (!contact) return null;
  const params = (b.parameters ?? {}) as Record<string, unknown>;
  const linkCode = typeof params.link === "string" && /^[A-Za-z0-9]{6}$/.test(params.link) ? params.link.toUpperCase() : undefined;
  const text = String(b.text ?? "").slice(0, 2000);
  return { id: String(b.webhook_id ?? b.message_id ?? ""), contact, text, linkCode, optIn: b.type === "opt_in" };
}

/** LoopMessage retries webhooks up to 30×: remember recent ids so Rocco never answers twice (per server instance). */
const seen = new Map<string, number>();
export function firstDelivery(id: string): boolean {
  if (!id) return true;
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > 6 * 3600_000) seen.delete(k);
  if (seen.has(id)) return false;
  seen.set(id, now);
  return true;
}
