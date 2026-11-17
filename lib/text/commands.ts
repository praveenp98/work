/** Understands what a teammate texted Rocco. Plain rules, no LLM needed. */
export type Command =
  | { kind: "link"; code: string }
  | { kind: "approve"; codes: string[] }
  | { kind: "undo"; codes: string[] }
  | { kind: "brief" }
  | { kind: "numbers" }
  | { kind: "wins" }
  | { kind: "help" }
  | { kind: "stop" }
  | { kind: "start" }
  | { kind: "ask"; topic: "ads" | "budgets" | "placements" | "stock" | "listings" | "general"; text: string };

const CODE = /\b([A-Z]\d{1,3}(?:\s*-\s*[A-Z]?\d{1,3})?)\b/gi;
const codesIn = (t: string) => [...t.matchAll(CODE)].map((m) => m[1].replace(/\s+/g, "").toUpperCase());

export function parseCommand(raw: string): Command {
  const t = raw.trim();
  const lc = t.toLowerCase();
  const link = t.match(/\blink\s+([A-Za-z0-9]{6})\b/i) ?? t.match(/\b([A-HJ-NP-Z2-9]{6})\b/);
  if (/\blink\b/i.test(t) && link) return { kind: "link", code: link[1].toUpperCase() };
  if (/^(stop|unsubscribe|cancel|quit|end)\b/.test(lc)) return { kind: "stop" };
  if (/^(start|unstop|resume)\b/.test(lc)) return { kind: "start" };
  const codes = codesIn(t);
  if (codes.length && /\b(undo|revert|roll ?back)\b/.test(lc)) return { kind: "undo", codes };
  if (codes.length && /\b(yes|yep|ok|okay|approve[ds]?|go|do it|ship it|👍)/i.test(t)) return { kind: "approve", codes };
  if (codes.length && /^[\sA-Z0-9,\-]+$/i.test(t) && !/[a-z]{3,}/i.test(t.replace(/\band\b/gi, ""))) return { kind: "approve", codes };
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
  const d = p.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.length === 10 ? `+1${d}` : `+${d}`;
};
export const maskPhone = (p: string) => `•••${p.slice(-4)}`;
