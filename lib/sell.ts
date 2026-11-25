/**
 * Beginner guides per Amazon marketplace (/sell-on-amazon and /sell-on-amazon/<slug>).
 * Content lives in content/sell/<slug>.json, researched with sources; lib/sell-data.ts imports every file so the
 * pages, sitemap and llms.txt work without reading the disk at runtime. Validated in lib/sell.test.ts.
 */
export type SellBlock =
  | { p: string }
  | { h3: string }
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][]; note?: string } }
  | { callout: { tone: "new" | "tip" | "warn"; title: string; text: string } };

export interface SellSection { id: string; title: string; blocks: SellBlock[] }
export interface SellSource { id: string; title: string; publisher?: string; url: string; date?: string }
export interface SellGuide {
  slug: string; marketplace: string; country: string; flag: string; currency: string; updated: string;
  title: string; description: string; tldr: string[];
  sections: SellSection[]; faq: { q: string; a: string }[]; sources: SellSource[];
}

/** Guides go live (pages, sitemap, llms.txt, footer) only after the fact-check pass. */
export const SELL_PUBLISHED = false;

/** Order on the hub and in navigation. */
export const SELL_ORDER = ["us", "uk", "de", "ca", "in", "au", "jp", "ae"] as const;

/** Free tools to suggest per section (rendered as a small card after it). */
export const SECTION_TOOLS: Record<string, { href: string; label: string; why: string }> = {
  costs: { href: "/tools/breakeven-acos", label: "Break-even ACoS calculator", why: "Put your own price, cost and fees in to see the most you can spend on ads per sale." },
  ads: { href: "/free/roast-my-amazon-account", label: "Roast My Amazon Account", why: "Once your first ads run 2–4 weeks, drop the search term report in and see where money burns." },
  launch: { href: "/free/amazon-health-check", label: "Amazon Financial Health Check", why: "At day 30, check TACoS, conversion and waste in one score." },
  grow: { href: "/free/amazon-seller-wrapped", label: "Amazon Seller Wrapped", why: "See your best product, hidden gem and leaky bucket from your Business Report." },
};

/** Count words across a guide (for the "N-minute read" label). */
export function wordCount(g: SellGuide): number {
  const t = (s: string) => s.split(/\s+/).filter(Boolean).length;
  let n = g.tldr.reduce((a, x) => a + t(x), 0);
  for (const s of g.sections) for (const b of s.blocks) {
    if ("p" in b) n += t(b.p); else if ("h3" in b) n += t(b.h3); else if ("ul" in b) n += b.ul.reduce((a, x) => a + t(x), 0);
    else if ("ol" in b) n += b.ol.reduce((a, x) => a + t(x), 0); else if ("table" in b) n += b.table.rows.flat().reduce((a, x) => a + t(x), 0);
    else n += t(b.callout.text);
  }
  return n + g.faq.reduce((a, f) => a + t(f.q) + t(f.a), 0);
}

/** Problems that would break the page or mislead: citation markers without a source, empty sections. */
export function guideProblems(g: SellGuide): string[] {
  const p: string[] = [];
  const ids = new Set(g.sources.map((s) => s.id));
  const text = JSON.stringify({ t: g.tldr, s: g.sections });
  for (const m of text.matchAll(/\[(s\d+)\]/g)) if (!ids.has(m[1])) p.push(`missing source ${m[1]}`);
  for (const s of g.sections) if (!s.blocks.length) p.push(`empty section ${s.id}`);
  for (const s of g.sources) if (!/^https?:\/\//.test(s.url)) p.push(`bad url ${s.id}`);
  if (!g.title || !g.description) p.push("missing title/description");
  return [...new Set(p)];
}
