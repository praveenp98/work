import type { SearchTermRow } from "../parsers/searchTerm";

export interface TermStats {
  campaign: string;
  adGroup: string;
  targeting: string;
  matchType: string;
  searchTerm: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
}

export const acos = (s: { spend: number; sales: number }) => (s.sales > 0 ? s.spend / s.sales : Infinity);
export const cpc = (s: { spend: number; clicks: number }) => (s.clicks > 0 ? s.spend / s.clicks : 0);

function add(into: TermStats, r: SearchTermRow | TermStats) {
  into.impressions += r.impressions;
  into.clicks += r.clicks;
  into.spend += r.spend;
  into.sales += r.sales;
  into.orders += r.orders;
}

/** Sum daily rows into one row per campaign + ad group + targeting + search term. */
export function aggregateTerms(rows: SearchTermRow[]): TermStats[] {
  const map = new Map<string, TermStats>();
  for (const r of rows) {
    const k = [r.campaign, r.adGroup, r.targeting, r.matchType, r.searchTerm.toLowerCase()].join("\u0001");
    let t = map.get(k);
    if (!t) {
      t = { campaign: r.campaign, adGroup: r.adGroup, targeting: r.targeting, matchType: r.matchType, searchTerm: r.searchTerm.toLowerCase(), impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0 };
      map.set(k, t);
    }
    add(t, r);
  }
  return [...map.values()];
}

/** Roll terms up to one row per target (campaign + ad group + targeting + match type). */
export function aggregateTargets(terms: TermStats[]): TermStats[] {
  const map = new Map<string, TermStats>();
  for (const t of terms) {
    const k = [t.campaign, t.adGroup, t.targeting, t.matchType].join("\u0001");
    let a = map.get(k);
    if (!a) {
      a = { ...t, searchTerm: "", impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0 };
      map.set(k, a);
    }
    add(a, t);
  }
  return [...map.values()];
}
