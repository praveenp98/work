import type { JobKind } from "./jobs";

/**
 * The seller's year: Amazon events (Prime Day, Black Friday/Cyber Monday, Prime Big Deal Days, Great Indian
 * Festival…), gifting days, Q4 storage rates and the January reset, per marketplace, with what to change on the
 * account before, during and after each. Dates are computed for any year (Thanksgiving, Easter, Mother's Day…);
 * events Amazon announces each year (Prime Day, Prime Big Deal Days, festival sales) are marked "expected" with
 * a typical window until Amazon confirms. Pure and tested (lib/season.test.ts). Used by the dashboard
 * (components/dash/SeasonCard.tsx), the morning brief, the calendar feed and /amazon-seller-calendar.
 */
export type Market = "US" | "UK" | "DE" | "CA" | "IN" | "AU" | "JP" | "AE";
export const MARKETS: { code: Market; slug: string; name: string; flag: string }[] = [
  { code: "US", slug: "us", name: "United States", flag: "🇺🇸" }, { code: "UK", slug: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", slug: "de", name: "Germany & EU", flag: "🇩🇪" }, { code: "CA", slug: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "IN", slug: "in", name: "India", flag: "🇮🇳" }, { code: "AU", slug: "au", name: "Australia", flag: "🇦🇺" },
  { code: "JP", slug: "jp", name: "Japan", flag: "🇯🇵" }, { code: "AE", slug: "ae", name: "UAE", flag: "🇦🇪" },
];
/** Amazon country codes → the calendar we use (EU marketplaces follow Germany's; GB = UK). */
export function marketOf(country?: string): Market {
  const c = (country ?? "US").toUpperCase();
  if (c === "GB") return "UK";
  if (["FR", "IT", "ES", "NL", "PL", "SE", "BE", "IE", "AT", "TR"].includes(c)) return "DE";
  if (["SA", "EG"].includes(c)) return "AE";
  if (c === "MX" || c === "BR") return "US";
  if (c === "SG") return "AU";
  return (MARKETS.some((m) => m.code === c) ? c : "US") as Market;
}

export type Kind = "peak" | "gifting" | "reset" | "fees" | "returns";
export interface Action { id: string; text: string; why: string; job?: JobKind[]; auto?: boolean; href?: string }
export interface Phase { key: string; label: string; from: number; to: number; actions: Action[] }
export interface SeasonEvent { id: string; name: string; kind: Kind; markets: Market[]; start: string; end: string; expected?: boolean; note?: string }
export interface Moment { event: SeasonEvent; phase: Phase; daysToStart: number; daysToEnd: number; actions: Action[] }

// ---------------------------------------------------------------- dates
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const add = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
/** n-th weekday (0=Sun) of a month; n = -1 for the last. */
function nth(y: number, m: number, wd: number, n: number): Date {
  if (n < 0) { const last = utc(y, m + 1, 0); return add(last, -((last.getUTCDay() - wd + 7) % 7)); }
  const first = utc(y, m, 1);
  return add(first, ((wd - first.getUTCDay() + 7) % 7) + (n - 1) * 7);
}
/** Western Easter Sunday (Anonymous Gregorian algorithm). */
export function easter(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(y, month, day);
}
export const thanksgiving = (y: number) => nth(y, 11, 4, 4);
export const blackFriday = (y: number) => add(thanksgiving(y), 1);
export const cyberMonday = (y: number) => add(thanksgiving(y), 4);
/** Lunar dates published in advance (approximate for Islamic dates: they depend on the moon sighting). */
const DIWALI: Record<number, string> = { 2025: "2025-10-20", 2026: "2026-11-08", 2027: "2027-10-29", 2028: "2028-10-17" };
const EID_FITR: Record<number, string> = { 2026: "2026-03-20", 2027: "2027-03-10", 2028: "2028-02-27" };
const RAMADAN: Record<number, string> = { 2026: "2026-02-18", 2027: "2027-02-08", 2028: "2028-01-28" };

// ---------------------------------------------------------------- actions (what to change on the account)
const A = {
  stock: { id: "stock", text: "Get 6+ weeks of stock on your best sellers into Amazon's warehouses", why: "Inbound slows before big events, and a stock-out on the big day costs sales and ranking for weeks.", job: ["restock"] },
  deals: { id: "deals", text: "Set up your coupon or deal now", why: "Amazon closes deal submissions weeks before an event; coupons need time to go live. Check the margin with the coupon calculator first.", href: "/tools/coupon-calculator" },
  waste: { id: "waste", text: "Block the searches that waste money before traffic spikes", why: "Peak days multiply clicks. Waste you leave in now gets 3–5× more expensive on the day.", job: ["negatives"] },
  harvest: { id: "harvest", text: "Give proven searches their own exact campaigns", why: "Exact campaigns let you fund winners on the big day without funding everything else.", job: ["new_campaign"] },
  budgets: { id: "budgets", text: "Raise budgets on proven winners, in steps", why: "Traffic rises, so winners run out of budget early. Raise the ones that sell profitably, ≤20% a step; leave the rest.", job: ["budget_up"] },
  listing: { id: "listing", text: "Add event and gift words to your listings where they're true", why: "Shoppers search \"gift for…\", \"deal\", \"Christmas…\". Backend search terms are the safe place to add them.", href: "products" },
  pacing: { id: "pacing", text: "Midday budget alerts on", why: "On peak days I check spend at midday and text you before a winner runs dry.", auto: true },
  freeze: { id: "freeze", text: "No big restructures during the event", why: "Rebuilding campaigns resets what Amazon has learned right when it matters most. Small, measured moves only." },
  buybox: { id: "buybox", text: "Keep the Buy Box and stock in check", why: "Out of stock or losing the Buy Box means your ads pay for someone else's sale.", job: ["buybox", "restock", "stock_ads"] },
  cooldown: { id: "cooldown", text: "Bring bids and budgets back toward normal", why: "Clicks stay pricey for a few days while sales fall back. I'll line up the pull-backs.", job: ["budget_down", "bids_down"] },
  review: { id: "review", text: "See what actually worked during the event", why: "Compare the event to the weeks before. Keep what earned its money, drop what didn't.", href: "/free/what-actually-worked-amazon" },
  giftPrep: { id: "giftPrep", text: "Check stock on gift-worthy products", why: "Gift demand arrives 2–3 weeks early and stops at the last delivery day.", job: ["restock"] },
  giftBudget: { id: "giftBudget", text: "Fund gift searches that already sell", why: "Raise budgets on winners for gift searches; don't start broad new campaigns this late.", job: ["budget_up"] },
  cutoff: { id: "cutoff", text: "Lower bids on gift searches after the last delivery day", why: "Once Prime can't deliver in time, gift clicks rarely buy. Check Amazon's delivery cutoff for your marketplace.", job: ["bids_down"] },
  q1: { id: "q1", text: "Test new keywords while clicks are cheaper", why: "After the holidays, competition and cost per click usually drop. Good weeks to find new winners.", job: ["new_campaign"] },
  returns: { id: "returns", text: "Watch returns and return reasons", why: "Holiday purchases come back in January. A spike in one reason (size, damage) points to a listing or packaging fix.", href: "products" },
  resetBudget: { id: "resetBudget", text: "Reset budgets to January demand", why: "Keeping December budgets in January buys clicks at a loss.", job: ["budget_down"] },
  slow: { id: "slow", text: "Clear or discount slow-moving stock before storage rates rise", why: "Monthly storage costs more from October to December. Slow sellers eat that cost.", job: ["stock_ads"] },
  lean: { id: "lean", text: "Keep only what sells in Amazon's warehouses", why: "Peak storage rates are on. Send winners, hold back slow movers." },
} satisfies Record<string, Action>;

const PHASES: Record<Kind, Phase[]> = {
  peak: [
    { key: "prepare", label: "Prepare", from: -35, to: -15, actions: [A.stock, A.deals, A.waste, A.harvest] },
    { key: "ramp", label: "Ramp up", from: -14, to: -1, actions: [A.waste, A.budgets, A.listing, A.pacing] },
    { key: "live", label: "Live now", from: 0, to: 0, actions: [A.pacing, A.buybox, A.freeze, A.budgets] },
    { key: "after", label: "Cool down", from: 1, to: 7, actions: [A.cooldown, A.review, A.buybox] },
  ],
  gifting: [
    { key: "prepare", label: "Prepare", from: -35, to: -15, actions: [A.giftPrep, A.listing, A.waste] },
    { key: "ramp", label: "Gift rush", from: -14, to: -3, actions: [A.giftBudget, A.pacing, A.buybox] },
    { key: "last", label: "Last orders", from: -2, to: 0, actions: [A.cutoff, A.buybox] },
    { key: "after", label: "After", from: 1, to: 5, actions: [A.cooldown, A.review] },
  ],
  reset: [{ key: "reset", label: "Reset", from: 0, to: 20, actions: [A.resetBudget, A.returns, A.q1] }],
  fees: [
    { key: "before", label: "Before rates rise", from: -30, to: -1, actions: [A.slow, A.stock] },
    { key: "on", label: "Peak storage rates", from: 0, to: 0, actions: [A.lean] },
  ],
  returns: [{ key: "on", label: "Returns window", from: 0, to: 0, actions: [A.returns] }],
};
export const phasesOf = (k: Kind) => PHASES[k];

// ---------------------------------------------------------------- events per year
const ALL: Market[] = ["US", "UK", "DE", "CA", "IN", "AU", "JP", "AE"];
const WEST: Market[] = ["US", "UK", "DE", "CA", "AU"];
export function eventsFor(y: number): SeasonEvent[] {
  const ev = (id: string, name: string, kind: Kind, markets: Market[], start: Date, end = start, extra: Partial<SeasonEvent> = {}): SeasonEvent => ({ id: `${id}-${ymd(start)}`, name, kind, markets, start: ymd(start), end: ymd(end), ...extra });
  const out: SeasonEvent[] = [
    ev("newyear", "New Year reset", "reset", ALL, utc(y, 1, 2)),
    ev("returns", "Holiday returns window", "returns", ["US", "UK", "DE", "CA"], utc(y, 1, 1), utc(y, 1, 31), { note: "Amazon's extended holiday returns run to the end of January." }),
    ev("valentines", "Valentine's Day", "gifting", ALL, utc(y, 2, 14)),
    ev("mothering", "Mother's Day (UK)", "gifting", ["UK"], add(easter(y), -21)),
    ev("mothers-ae", "Mother's Day (UAE)", "gifting", ["AE"], utc(y, 3, 21)),
    ev("easter", "Easter", "gifting", ["US", "UK", "DE", "CA", "AU"], easter(y)),
    ev("mothers", "Mother's Day", "gifting", ["US", "DE", "CA", "AU", "JP", "IN"], nth(y, 5, 0, 2)),
    ev("vatertag", "Father's Day (Germany)", "gifting", ["DE"], add(easter(y), 39)),
    ev("fathers", "Father's Day", "gifting", ["US", "UK", "CA", "JP", "IN"], nth(y, 6, 0, 3)),
    ev("eofy", "End of financial year sales", "peak", ["AU"], utc(y, 6, 20), utc(y, 6, 30)),
    ev("primeday", "Prime Day", "peak", ["US", "UK", "DE", "CA", "IN", "AU", "JP", "AE"], utc(y, 7, 8), utc(y, 7, 11), { expected: true, note: "Usually in July; Amazon announces the exact dates a few weeks ahead." }),
    ev("bts", "Back to school", "gifting", ["US", "CA"], utc(y, 8, 15)),
    ev("fathers-au", "Father's Day (Australia)", "gifting", ["AU"], nth(y, 9, 0, 1)),
    ev("pbdd", "Prime Big Deal Days", "peak", ["US", "UK", "DE", "CA", "AU", "JP"], utc(y, 10, 7), utc(y, 10, 8), { expected: true, note: "Usually in early-to-mid October; Amazon announces the dates in September." }),
    ev("storage", "Q4 storage rates", "fees", ["US", "UK", "DE", "CA"], utc(y, 10, 1), utc(y, 12, 31), { note: "Monthly storage fees are higher October–December. Check your marketplace's current rates." }),
    ev("halloween", "Halloween", "gifting", ["US", "CA", "UK"], utc(y, 10, 31)),
    ev("singles", "11.11 sale", "peak", ["AE"], utc(y, 11, 11), utc(y, 11, 11), { expected: true }),
    ev("bfcm", "Black Friday & Cyber Monday", "peak", ["US", "UK", "DE", "CA", "AU"], blackFriday(y), cyberMonday(y)),
    ev("bf-jp", "Black Friday", "peak", ["JP"], blackFriday(y), blackFriday(y), { note: "Amazon.co.jp runs a multi-day Black Friday sale; check the announced dates." }),
    ev("whitefriday", "White Friday", "peak", ["AE"], blackFriday(y), blackFriday(y), { expected: true, note: "Amazon.ae's late-November sale; dates are announced each year." }),
    ev("christmas", "Christmas", "gifting", ["US", "UK", "DE", "CA", "AU", "JP"], utc(y, 12, 25)),
    ev("boxing", "Boxing Day sales", "peak", ["UK", "CA", "AU"], utc(y, 12, 26), utc(y, 12, 26)),
    ev("hatsuuri", "New Year sale (Hatsuuri)", "peak", ["JP"], utc(y, 1, 2), utc(y, 1, 5), { expected: true }),
  ];
  if (DIWALI[y]) {
    const d = new Date(`${DIWALI[y]}T00:00:00Z`);
    out.push(ev("gif", "Great Indian Festival", "peak", ["IN"], add(d, -28), add(d, -1), { expected: true, note: "Amazon's festive sale runs in the weeks before Diwali; Amazon announces the dates." }));
    out.push(ev("diwali", "Diwali", "gifting", ["IN"], d));
  }
  if (RAMADAN[y]) out.push(ev("ramadan", "Ramadan", "gifting", ["AE"], new Date(`${RAMADAN[y]}T00:00:00Z`), new Date(`${RAMADAN[y]}T00:00:00Z`), { note: "Approximate: depends on the moon sighting." }));
  if (EID_FITR[y]) out.push(ev("eid", "Eid al-Fitr", "gifting", ["AE"], new Date(`${EID_FITR[y]}T00:00:00Z`), new Date(`${EID_FITR[y]}T00:00:00Z`), { note: "Approximate: depends on the moon sighting." }));
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

/** The phase an event is in on `today` (from/to are days relative to start for "before", relative to end for "after", 0..0 = during). */
export function phaseOn(e: SeasonEvent, today: string): Phase | null {
  const toStart = dayDiff(e.start, today), toEnd = dayDiff(e.end, today);
  for (const p of PHASES[e.kind]) {
    if (p.from < 0 && p.to < 0 && -toStart >= p.from && -toStart <= p.to) return p;
    if (p.from < 0 && p.to === 0 && -toStart >= p.from && toEnd >= 0) return p;
    if (p.from === 0 && p.to === 0 && toStart <= 0 && toEnd >= 0) return p;
    if (p.from === 0 && p.to > 0 && toStart <= 0 && -toStart <= p.to) return p;
    if (p.from > 0 && toEnd < 0 && -toEnd >= p.from && -toEnd <= p.to) return p;
  }
  return null;
}

/** Everything active today for a marketplace, most urgent first (live > ramp > last orders > prepare > after). */
export function momentsOn(market: Market, now = new Date()): Moment[] {
  const today = ymd(now), y = now.getUTCFullYear();
  const RANK: Record<string, number> = { live: 0, on: 5, last: 1, ramp: 2, reset: 3, prepare: 4, before: 4, after: 6 };
  const out: Moment[] = [];
  for (const e of [...eventsFor(y - 1), ...eventsFor(y), ...eventsFor(y + 1)]) {
    if (!e.markets.includes(market)) continue;
    const p = phaseOn(e, today);
    if (!p) continue;
    out.push({ event: e, phase: p, daysToStart: dayDiff(e.start, today), daysToEnd: dayDiff(e.end, today), actions: p.actions });
  }
  const seen = new Set<string>();
  return out
    .sort((a, b) => (RANK[a.phase.key] ?? 9) - (RANK[b.phase.key] ?? 9) || (a.event.kind === "peak" ? -1 : 1) - (b.event.kind === "peak" ? -1 : 1) || a.daysToStart - b.daysToStart)
    .filter((m) => (seen.has(m.event.id) ? false : (seen.add(m.event.id), true)));
}

/** The next events (from today on) for a marketplace, for the public calendar and the feed. */
export function upcoming(market: Market, now = new Date(), days = 380): SeasonEvent[] {
  const today = ymd(now), y = now.getUTCFullYear();
  return [...eventsFor(y), ...eventsFor(y + 1)].filter((e) => e.markets.includes(market) && dayDiff(e.end, today) >= 0 && dayDiff(e.start, today) <= days);
}

/** "in 2 days" / "today" / "ends in 3 days" / "ended 2 days ago". */
export function when(m: Pick<Moment, "daysToStart" | "daysToEnd"> & { phase?: Phase; event?: SeasonEvent }): string {
  // Windows that run after the date (the January reset): say how long is left, not that it "ended".
  if (m.phase && m.phase.from >= 0 && m.phase.to > 0 && m.daysToEnd < 0 && m.phase.from === 0) {
    const left = m.phase.to + m.daysToEnd;
    return left > 0 ? `on now · ${left} day${left > 1 ? "s" : ""} left` : "last day today";
  }
  if (m.daysToStart > 1) return `in ${m.daysToStart} days`;
  if (m.daysToStart === 1) return "tomorrow";
  if (m.daysToEnd > 0) return m.daysToStart === 0 ? "starts today" : `on now · ends in ${m.daysToEnd} day${m.daysToEnd > 1 ? "s" : ""}`;
  if (m.daysToEnd === 0) return m.daysToStart === 0 ? "today" : "last day today";
  return `ended ${-m.daysToEnd} day${m.daysToEnd < -1 ? "s" : ""} ago`;
}

/** One line for the morning brief / text: the most urgent moment and its first action. */
export function seasonLine(market: Market, now = new Date()): string | null {
  const m = momentsOn(market, now).find((x) => x.event.kind !== "returns" && x.event.kind !== "fees") ?? momentsOn(market, now)[0];
  if (!m) return null;
  return `${m.event.name} ${when(m)} (${m.phase.label.toLowerCase()}): ${m.actions[0].text.replace(/\.$/, "")}.`;
}

export const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
