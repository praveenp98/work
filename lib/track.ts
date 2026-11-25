/**
 * Tiny first-party event helper for the browser. No third-party script, no third-party cookie.
 *
 *   import { track } from "@/lib/track";
 *   track("lead_captured", { magnet: "ppc-checklist" });
 *
 * Or with no code at all: put data-track="call_click" (and optionally data-track-magnet / data-track-tool) on a
 * link or button and components/FunnelEvents.tsx sends it on click.
 *
 * What is sent: the event name, the page path (no query string), the visit's first-touch source (UTM tags and
 * referrer host, remembered for 30 days in this browser's localStorage and in one first-party cookie, "rocco_ft",
 * which lead forms read on the server) and a random id from localStorage.
 * With Do Not Track or Global Privacy Control on, no id is created or sent.
 */
export type ClientEvent = "page_view" | "lead_captured" | "tool_result" | "call_click" | "hire_click" | "signup_started" | "checkout_started" | "link_click" | "audit_started";
type Props = { magnet?: string; tool?: string; plan?: string; link?: string };
interface FirstTouch { source?: string; medium?: string; campaign?: string; content?: string; term?: string; ref?: string; at: number }

const AID = "rocco_aid", FT = "rocco_ft", THIRTY_DAYS = 30 * 86_400_000;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } };

const optedOut = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return n.doNotTrack === "1" || n.msDoNotTrack === "1" || n.globalPrivacyControl === true;
};

function anonId(): string | undefined {
  if (optedOut()) return undefined;
  let id = read(AID);
  if (!id) { id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).slice(0, 36); write(AID, id); }
  return id;
}

/** First touch wins for 30 days. A later visit with new UTM tags only replaces it after that. */
function firstTouch(): FirstTouch {
  let saved: FirstTouch | null = null;
  try { saved = JSON.parse(read(FT) ?? "null"); } catch { saved = null; }
  if (saved && Date.now() - saved.at < THIRTY_DAYS) return saved;
  const q = new URLSearchParams(location.search);
  let ref: string | undefined;
  try { const h = document.referrer ? new URL(document.referrer).host : ""; if (h && h !== location.host) ref = h; } catch { /* no referrer */ }
  const ft: FirstTouch = { source: q.get("utm_source") ?? undefined, medium: q.get("utm_medium") ?? undefined, campaign: q.get("utm_campaign") ?? undefined, content: q.get("utm_content") ?? undefined, term: q.get("utm_term") ?? undefined, ref, at: Date.now() };
  write(FT, JSON.stringify(ft));
  // The same first touch as a first-party cookie, so the server can attach the source to a lead (POST /api/leads).
  try { document.cookie = `${FT}=${encodeURIComponent(JSON.stringify(ft))}; Max-Age=${THIRTY_DAYS / 1000}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`; } catch { /* cookies off: fine */ }
  return ft;
}

export function track(event: ClientEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  try {
    const ft = firstTouch();
    const body = JSON.stringify({ event, path: location.pathname, utm: { source: ft.source, medium: ft.medium, campaign: ft.campaign, content: ft.content, term: ft.term }, ref_host: ft.ref, aid: anonId(), props });
    // keepalive lets the request finish even when the click navigates away (Google sign-in, checkout).
    void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true, credentials: "same-origin" }).catch(() => {});
  } catch { /* analytics must never break the page */ }
}
