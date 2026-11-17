import { aggregateTerms } from "./aggregate";
import type { SearchTermRow } from "../parsers/searchTerm";
import { r2 } from "./types";

/** Compact per-search-term record kept in memory between reports. */
export interface TermLite { t: string; s: number; sa: number; o: number; c: number }

/** Top search terms by spend plus every converting term (capped), merged across campaigns. */
export function termSnapshot(rows: SearchTermRow[], limit = 300): TermLite[] {
  const m = new Map<string, TermLite>();
  for (const x of aggregateTerms(rows)) {
    const e = m.get(x.searchTerm) ?? { t: x.searchTerm, s: 0, sa: 0, o: 0, c: 0 };
    e.s += x.spend; e.sa += x.sales; e.o += x.orders; e.c += x.clicks;
    m.set(x.searchTerm, e);
  }
  const all = [...m.values()].map((e) => ({ ...e, s: r2(e.s), sa: r2(e.sa) }));
  const bySpend = [...all].sort((a, b) => b.s - a.s).slice(0, limit);
  const winners = all.filter((e) => e.o > 0).sort((a, b) => b.sa - a.sa).slice(0, limit);
  const out = new Map<string, TermLite>();
  for (const e of [...bySpend, ...winners]) out.set(e.t, e);
  return [...out.values()];
}

export interface TermDiff {
  newBurners: TermLite[]; // new terms spending money with no orders
  newWinners: TermLite[]; // new terms with 2+ orders
  stoppedBurning: TermLite[]; // burners last time that no longer spend
}

/** What changed in the search terms since the previous report. */
export function diffTerms(prev: TermLite[], cur: TermLite[], minSpend = 5): TermDiff {
  const before = new Map(prev.map((p) => [p.t, p]));
  const now = new Map(cur.map((c) => [c.t, c]));
  return {
    newBurners: cur.filter((c) => !before.has(c.t) && c.o === 0 && c.s >= minSpend && c.c >= 5).sort((a, b) => b.s - a.s),
    newWinners: cur.filter((c) => !before.has(c.t) && c.o >= 2).sort((a, b) => b.sa - a.sa),
    stoppedBurning: prev.filter((p) => p.o === 0 && p.s >= minSpend && (!now.has(p.t) || now.get(p.t)!.s < p.s * 0.1)),
  };
}

const STOP = new Set(["for", "and", "the", "with", "set", "pack", "of", "a", "an", "in", "on", "to", "by", "large", "small", "best", "new", "my", "your", "men", "women", "kids"]);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ies|es|s)$/, "");

export interface ListingGap { term: string; sales: number; orders: number; missing: string[]; where: "title" | "backend" }

/**
 * Converting search terms whose key words don't appear in the listing.
 * Words missing from title+bullets+backend → add to backend keywords (or title if it's a top term).
 */
export function listingGaps(terms: TermLite[], listing: { title: string; bullets?: string; backend?: string }, limit = 15): ListingGap[] {
  const have = new Set(words([listing.title, listing.bullets ?? "", listing.backend ?? ""].join(" ")).map(stem));
  const titleHave = new Set(words(listing.title).map(stem));
  const out: ListingGap[] = [];
  const winners = terms.filter((t) => t.o > 0 && !/^b0[a-z0-9]{8}$/i.test(t.t)).sort((a, b) => b.sa - a.sa);
  winners.forEach((t, i) => {
    const w = words(t.t);
    const missing = [...new Set(w.filter((x) => !have.has(stem(x))))];
    if (missing.length) out.push({ term: t.t, sales: t.sa, orders: t.o, missing, where: i < 5 ? "title" : "backend" });
    else if (i < 5 && w.some((x) => !titleHave.has(stem(x)))) out.push({ term: t.t, sales: t.sa, orders: t.o, missing: w.filter((x) => !titleHave.has(stem(x))), where: "title" });
  });
  return out.slice(0, limit);
}
