/** Understands what a teammate texted Rocco. Plain rules, no LLM needed. */
export type Command =
  | { kind: "link"; code: string }
  | { kind: "approve"; codes: string[] }
  | { kind: "undo"; codes: string[] }
  | { kind: "made"; codes: string[] }
  | { kind: "brief" }
  | { kind: "numbers" }
  | { kind: "wins" }
  | { kind: "help" }
  | { kind: "dashboard" }
  | { kind: "invite" }
  | { kind: "demo" }
  | { kind: "activate"; key: string }
  | { kind: "stop" }
  | { kind: "cancel_sub" }
  | { kind: "start" }
  | { kind: "ask"; topic: "ads" | "budgets" | "placements" | "stock" | "listings" | "general"; text: string };

const CODE = /\b([A-Z]\d{1,3}(?:\s*-\s*[A-Z]?\d{1,3})?)\b/gi;
const codesIn = (t: string) => [...t.matchAll(CODE)].map((m) => m[1].replace(/\s+/g, "").toUpperCase());

export function parseCommand(raw: string): Command {
  const t = raw.trim();
  const lc = t.toLowerCase();
  const act = t.match(/^(?:activate|license|key)\s*:?\s*([A-Za-z0-9-]{8,80})\s*$/i);
  if (act) return { kind: "activate", key: act[1] };
  const link = t.match(/\b(?:link|join)\s+([A-Za-z0-9]{6})\b/i);
  if (link) return { kind: "link", code: link[1].toUpperCase() };
  if (/^cancel( (my )?(trial|subscription|plan))?\s*[.!]?$/.test(lc)) return { kind: "cancel_sub" };
  if (/^(stop|unsubscribe|quit|end)\b/.test(lc)) return { kind: "stop" };
  if (/^(start|unstop|resume)\b/.test(lc)) return { kind: "start" };
  const codes = codesIn(t);
  if (codes.length && /\b(undo|revert|roll ?back)\b/.test(lc)) return { kind: "undo", codes };
  if (codes.length && /\b(done|made|did it|applied|changed)\b/.test(lc)) return { kind: "made", codes };
  if (codes.length && /\b(yes|yep|ok|okay|approve[ds]?|go|do it|ship it|👍)/i.test(t)) return { kind: "approve", codes };
  if (codes.length && /^[\sA-Z0-9,\-]+$/i.test(t) && !/[a-z]{3,}/i.test(t.replace(/\band\b/gi, ""))) return { kind: "approve", codes };
  if (/^(dashboard|setup|connect|login|log in|my links?|links?|my page)\b/.test(lc)) return { kind: "dashboard" };
  if (/^(invite|add (a )?teammate|team|share)\b/.test(lc)) return { kind: "invite" };
  if (/^(demo|sample|show me|example)\b/.test(lc)) return { kind: "demo" };
  if (/^(help|\?|commands|menu|hi|hey|hello)\b/.test(lc)) return { kind: "help" };
  if (/\b(numbers|stats|daily|today'?s numbers|kpis?)\b/.test(lc)) return { kind: "numbers" };
  if (/\b(wins?|saved|savings|results?)\b/.test(lc)) return { kind: "wins" };
  if (/\b(brief|morning|what('?s| is) up|todo|to-do|what should i do)\b/.test(lc)) return { kind: "brief" };
  const topic = /\b(stock|inventory|restock|run(ning)? out)\b/.test(lc) ? "stock"
    : /\b(budget|out of budget)\b/.test(lc) ? "budgets"
    : /\b(placement|top of search)\b/.test(lc) ? "placements"
    : /\b(listing|convert|conversion|buy ?box|tacos|sessions)\b/.test(lc) ? "listings"
    : /\b(ad|ads|acos|spend|ppc|keyword|search term|leak|bid)/.test(lc) ? "ads"
    : "general";
  return { kind: "ask", topic, text: t };
}

/** Normalize a phone number from a provider payload: keep + and digits. */
export const normPhone = (p: string) => {
  if (p.startsWith("slack:")) return p; // Slack teammate id, not a phone
  const d = p.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.length === 10 ? `+1${d}` : `+${d}`;
};
export const maskPhone = (p: string) => `•••${p.slice(-4)}`;
