/**
 * Outbound texting. LoopMessage (iMessage) when configured; otherwise a dry-run outbox
 * (logged, kept in memory) so the whole flow works and is testable before signup.
 * NOTE: confirm the LoopMessage endpoint/headers/fields against their docs at signup.
 */
export interface Sent { to: string; text: string; mediaUrl?: string; at: string; dryRun: boolean }

const g = globalThis as unknown as { __roccoOutbox?: Sent[] };
export const outbox = () => (g.__roccoOutbox ??= []);
const remember = (m: Sent) => { const o = outbox(); o.push(m); if (o.length > 200) o.splice(0, o.length - 200); };

export function textingConfigured() {
  return !!(process.env.LOOPMESSAGE_AUTH_KEY && process.env.LOOPMESSAGE_SECRET_KEY && process.env.LOOPMESSAGE_SENDER);
}

export async function sendText(to: string, text: string, opts: { mediaUrl?: string } = {}): Promise<{ ok: boolean; dryRun: boolean; error?: string }> {
  const at = new Date().toISOString();
  if (!textingConfigured()) {
    remember({ to, text, mediaUrl: opts.mediaUrl, at, dryRun: true });
    if (process.env.NODE_ENV !== "test") console.info(`[text dry-run] → ${to}: ${text.slice(0, 120)}`);
    return { ok: true, dryRun: true };
  }
  const res = await fetch("https://server.loopmessage.com/api/v1/message/send/", {
    method: "POST",
    headers: {
      Authorization: process.env.LOOPMESSAGE_AUTH_KEY!,
      "Loop-Secret-Key": process.env.LOOPMESSAGE_SECRET_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient: to, text, sender_name: process.env.LOOPMESSAGE_SENDER, ...(opts.mediaUrl ? { attachments: [opts.mediaUrl] } : {}) }),
  }).catch(() => null);
  if (!res?.ok) return { ok: false, dryRun: false, error: res ? `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` : "network error" };
  remember({ to, text, mediaUrl: opts.mediaUrl, at, dryRun: false });
  return { ok: true, dryRun: false };
}
