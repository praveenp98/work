import type { AnalyzeOutput, ReportKind } from "./analyze";
import { accountScore } from "./rules/score";
import type { Finding } from "./rules/types";
import { PLAN } from "./pricing";
import { buildWrapped, PERIODS, type Wrapped } from "./wrapped";

/**
 * The 10 free lead-magnet tools (/free/<slug>). Reports are read in the visitor's browser (lib/analyze, the same
 * engine Rocco runs every morning); each tool turns them into one result: a score or headline, stats, findings
 * (first 3 free, the rest after an email) and a share line. Pure and tested (lib/magnets.test.ts).
 * Honesty rules: numbers come from the uploaded reports; benchmark ranges are labelled "typical", never "sellers
 * like you"; period comparisons say "moved", never "caused".
 */
export type Reports = Partial<Record<ReportKind, AnalyzeOutput>>;
export interface Inputs { now: Reports; before?: Reports; form: Record<string, string>; advice?: CheckedAdvice[] }
export type Tone = "bad" | "warn" | "good" | "info";
export interface Item { title: string; detail: string; tone: Tone; value?: number }
export interface Result {
  score?: number; grade?: string; scoreLabel?: string;
  headline: string; sub?: string;
  stats: { k: string; v: string }[];
  items: Item[];
  share: string; // no private numbers unless the tool says so
  /** Ask the server for a savage roast of these facts (roast tool only). */
  roastFacts?: string;
  /** Rule-based punchlines, used when the AI roast is unavailable. */
  roastLines?: string[];
  /** Seller Wrapped story. */
  wrapped?: Wrapped;
}
export interface Field { key: string; label: string; type: "number" | "text" | "select" | "checks" | "textarea"; placeholder?: string; options?: string[]; help?: string; optional?: boolean }
export interface Magnet {
  slug: string; n: string; name: string; tagline: string; promise: string; pose: "hero" | "judge" | "party" | "wave";
  needs: ReportKind[]; optional: ReportKind[]; periods?: boolean; fields?: Field[];
  /** At least one of these reports is required (in each period when `periods`). */
  needsOneOf?: ReportKind[];
  /** A short note shown above the tool (e.g. the agency note). */
  note?: string;
  /** What each report is, in seller words, and where to download it. */
  faq: { q: string; a: string }[];
  run: (i: Inputs) => Result;
}

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number) => `${Math.round(n * 10) / 10}%`;
const num = (v: unknown) => { const x = Number(String(v ?? "").replace(/[$,%\s]/g, "")); return Number.isFinite(x) ? x : NaN; };
const stat = (r: Reports, k: ReportKind, key: string) => num(r[k]?.analysis.stats[key]);
const tone = (f: Finding): Tone => (f.severity === "high" ? "bad" : f.severity === "medium" ? "warn" : f.severity === "win" ? "good" : "info");
const asItem = (f: Finding): Item => ({ title: f.title, detail: f.line ? `${f.detail} ${f.line}` : f.detail, tone: tone(f), value: f.valueMonthly || undefined });
const all = (r: Reports) => Object.values(r).filter((x): x is AnalyzeOutput => !!x);
const byMoney = (a: Item, b: Item) => (b.value ?? 0) - (a.value ?? 0) || order(a.tone) - order(b.tone);
const order = (t: Tone) => ({ bad: 0, warn: 1, info: 2, good: 3 })[t];

/** Typical ranges (published seller-tool and agency guidance; vary a lot by category and price). Labelled as such. */
export const TYPICAL = {
  tacos: { lo: 5, hi: 15, label: "TACoS" },
  acos: { lo: 20, hi: 35, label: "ACoS" },
  conversion: { lo: 8, hi: 15, label: "Conversion (unit session %)" },
  waste: { lo: 0, hi: 10, label: "Ad spend on searches with clicks and no orders" },
};

// ---------------------------------------------------------------- 1. Health check
function healthCheck(i: Inputs): Result {
  const a = all(i.now);
  const s = accountScore(a.map((x) => x.analysis));
  const sales = stat(i.now, "business_report", "sales"), spend = stat(i.now, "sp_search_term", "spend");
  const tacos = sales > 0 && spend > 0 ? (spend / sales) * 100 : NaN;
  const conv = stat(i.now, "business_report", "conversionPct"), acos = stat(i.now, "sp_search_term", "acosPct"), leak = stat(i.now, "sp_search_term", "leakMonthly");
  const margin = num(i.form.margin);
  const items: Item[] = [];
  if (Number.isFinite(tacos)) items.push({ title: `TACoS ${pct(tacos)}`, detail: `Ad spend as a share of all sales. Typical range: ${TYPICAL.tacos.lo}–${TYPICAL.tacos.hi}% (varies by category).`, tone: tacos > 20 ? "bad" : tacos > TYPICAL.tacos.hi ? "warn" : "good" });
  if (Number.isFinite(acos) && Number.isFinite(margin) && margin > 0) items.push({ title: acos > margin ? `Ads lose money: ACoS ${pct(acos)} vs your break-even ${pct(margin)}` : `Ads are under break-even: ACoS ${pct(acos)} vs ${pct(margin)}`, detail: acos > margin ? "Every ad sale costs more than the margin it brings in. Cut the waste first, then bids." : "Your ads pay for themselves on average. The gains are in the waste below.", tone: acos > margin ? "bad" : "good" });
  if (Number.isFinite(conv)) items.push({ title: `Conversion ${pct(conv)}`, detail: `Typical range: ${TYPICAL.conversion.lo}–${TYPICAL.conversion.hi}% for many categories. Below that, fix the listing before buying more traffic.`, tone: conv < TYPICAL.conversion.lo ? "warn" : "good" });
  items.push(...a.flatMap((x) => x.analysis.findings).map(asItem));
  items.sort(byMoney);
  const vitals = items.filter((x) => x.tone === "bad").length;
  return {
    score: s.score, grade: s.grade, scoreLabel: "Health score",
    headline: s.score >= 75 ? "Mostly healthy, with a few leaks worth fixing." : s.score >= 50 ? "Stable, but money is leaking in places you can fix this week." : "Needs attention: several problems are costing you every day.",
    sub: s.atStakeMonthly > 0 ? `About ${$(s.atStakeMonthly)}/month at stake across ${vitals} urgent finding${vitals === 1 ? "" : "s"}.` : undefined,
    stats: [
      Number.isFinite(sales) && { k: "Sales", v: $(sales) }, Number.isFinite(spend) && { k: "Ad spend", v: $(spend) },
      Number.isFinite(tacos) && { k: "TACoS", v: pct(tacos) }, Number.isFinite(acos) && { k: "ACoS", v: pct(acos) },
      Number.isFinite(conv) && { k: "Conversion", v: pct(conv) }, Number.isFinite(leak) && leak > 0 && { k: "Wasted / month", v: $(leak) },
    ].filter(Boolean) as Result["stats"],
    items,
    share: `My Amazon account scored ${s.score}/100 (${s.grade}) on Rocco's free health check. Yours?`,
  };
}

// ---------------------------------------------------------------- 2. Roast
function roast(i: Inputs): Result {
  const st = i.now.sp_search_term?.roast;
  const a = all(i.now);
  const items = a.flatMap((x) => x.analysis.findings).map(asItem).sort(byMoney);
  const eaten = st?.eaten.slice(0, 5).map((e) => `"${e.term}" (${$(e.spend)})`).join(", ");
  const facts = [
    st && `Search terms: ${st.totals.terms}, ad spend ${$(st.totals.spend)}, ad sales ${$(st.totals.sales)}, ACoS ${pct(st.totals.acos * 100)}, ${pct(st.leakPct * 100)} of spend on searches that never sold (${$(st.leakMonthly)}/month, ${$(st.leakYearly)}/year).`,
    eaten && `Biggest money burners: ${eaten}.`,
    st?.win && `Best search: "${st.win.term}" (${$(st.win.sales)} sales at ${pct(st.win.acos * 100)} ACoS).`,
    ...items.slice(0, 6).map((x) => `${x.title}: ${x.detail}`),
  ].filter(Boolean).join("\n");
  return {
    grade: st?.grade ?? accountScore(a.map((x) => x.analysis)).grade, scoreLabel: "Roast grade",
    headline: st ? `${pct(st.leakPct * 100)} of your ad spend went to searches that never sold.` : "Rocco went through your reports. It's not pretty.",
    sub: st ? `That's ${$(st.leakYearly)} a year, lit on fire.` : undefined,
    stats: st ? [{ k: "Ad spend", v: $(st.totals.spend) }, { k: "ACoS", v: pct(st.totals.acos * 100) }, { k: "Burned / year", v: $(st.leakYearly) }, { k: "Searches", v: st.totals.terms.toLocaleString("en-US") }] : [],
    items,
    share: `Rocco roasted my Amazon ads and gave me a ${st?.grade ?? "?"}. Brutal. Get yours roasted:`,
    roastFacts: facts,
    roastLines: [
      st && `${pct(st.leakPct * 100)} of your ad budget bought clicks from people who never bought. Amazon thanks you for your donation.`,
      st?.eaten[0] && `"${st.eaten[0].term}" took ${$(st.eaten[0].spend)} and gave back nothing. That's not a keyword, that's a subscription.`,
      ...a.flatMap((x) => x.analysis.findings).filter((f) => f.line).map((f) => f.line!).slice(0, 4),
      st?.win && `Credit where due: "${st.win.term}" made ${$(st.win.sales)}. One adult in the room.`,
    ].filter(Boolean) as string[],
  };
}

// ---------------------------------------------------------------- 3. Agency audit (before vs after)
/** Search terms give the full picture (waste, burners); the campaign report (Amazon keeps ~95 days vs ~65 for search terms) gives spend, sales and ACoS only. */
function periodStats(r?: Reports) {
  const s = r?.sp_search_term?.roast;
  if (s) return { spend: s.totals.spend, sales: s.totals.sales, acos: s.totals.acos * 100, leakPct: s.leakPct * 100, leakMonthly: s.leakMonthly, days: s.days, eaten: s.eaten, harvest: s.fixes.harvest.length, terms: true };
  const c = r?.sp_campaign?.campaigns;
  if (!c?.rows.length) return null;
  const spend = c.rows.reduce((t, x) => t + x.spend, 0), sales = c.rows.reduce((t, x) => t + x.sales, 0);
  return { spend, sales, acos: sales > 0 ? (spend / sales) * 100 : 0, leakPct: NaN, leakMonthly: 0, days: c.days, eaten: [] as { term: string; spend: number }[], harvest: 0, terms: false };
}
function agencyAudit(i: Inputs): Result {
  const b = periodStats(i.before), a = periodStats(i.now);
  if (!b || !a) return { headline: "Add a search term or campaign report for each period.", stats: [], items: [], share: "" };
  const fee = num(i.form.fee);
  const items: Item[] = [];
  const dAcos = a.acos - b.acos, dLeak = Number.isFinite(a.leakPct - b.leakPct) ? a.leakPct - b.leakPct : 0;
  const daily = (x: typeof a) => ({ spend: x.spend / Math.max(1, x.days), sales: x.sales / Math.max(1, x.days) });
  const db = daily(b), da = daily(a);
  items.push({ title: `ACoS ${pct(b.acos)} → ${pct(a.acos)}`, detail: dAcos < -2 ? "Ads got more efficient between the two periods." : dAcos > 2 ? "Ads got less efficient between the two periods." : "Roughly flat.", tone: dAcos < -2 ? "good" : dAcos > 2 ? "bad" : "info" });
  items.push({ title: `Ad sales per day ${$(db.sales)} → ${$(da.sales)}`, detail: `Ad spend per day ${$(db.spend)} → ${$(da.spend)}.`, tone: da.sales > db.sales * 1.05 ? "good" : da.sales < db.sales * 0.95 ? "warn" : "info" });
  if (a.terms && b.terms) items.push({ title: `Waste ${pct(b.leakPct)} → ${pct(a.leakPct)} of ad spend`, detail: "Share of ad spend on searches with clicks and no orders.", tone: dLeak < -2 ? "good" : dLeak > 2 ? "bad" : "info" });
  else items.push({ title: "Add search term reports to check wasted spend", detail: "Campaign reports show spend, sales and ACoS. Search term reports (Amazon keeps about 65 days) show which searches burned money and whether they were ever blocked.", tone: "info" });
  const stillRunning = a.eaten.filter((e) => b.eaten.some((x) => x.term === e.term));
  if (stillRunning.length) items.push({ title: `${stillRunning.length} money-burning searches were never blocked`, detail: `Wasting in both periods: ${stillRunning.slice(0, 5).map((e) => `"${e.term}"`).join(", ")}. Blocking these is the most basic job in PPC management.`, tone: "bad", value: Math.round(stillRunning.reduce((t, e) => t + e.spend, 0) * (30 / Math.max(1, a.days))) });
  if (a.harvest > 0) items.push({ title: `${a.harvest} proven searches still aren't in exact campaigns`, detail: "Searches that already sell, left in broad and auto where they cost more. Moving them to exact is routine weekly work.", tone: "warn" });
  if (Number.isFinite(fee) && fee > 0) items.push({ title: `You pay ${$(fee)}/month`, detail: `Rocco is ${$(PLAN.monthlyCents / 100)}/month flat and checks the account every morning.`, tone: "info" });
  const verdict = dAcos < -2 && dLeak <= 0 ? "Measurably better" : dAcos > 2 || dLeak > 2 ? "Measurably worse" : "No clear improvement";
  return {
    headline: `${verdict} between the two periods.`, sub: "Comparing two periods shows what moved, not why. Seasonality and stock also move numbers.",
    score: Math.max(0, Math.min(100, Math.round(60 - dAcos * 2 - dLeak * 2 - stillRunning.length * 2))), scoreLabel: "Agency score",
    stats: [{ k: "ACoS before → after", v: `${pct(b.acos)} → ${pct(a.acos)}` }, ...(a.terms && b.terms ? [{ k: "Waste before → after", v: `${pct(b.leakPct)} → ${pct(a.leakPct)}` }, { k: "Never-blocked burners", v: String(stillRunning.length) }] : [])],
    items, share: `I audited what my Amazon agency actually changed. Verdict: ${verdict.toLowerCase()}. Free tool:`,
  };
}

// ---------------------------------------------------------------- 4. Second opinion on AI ad advice
export interface Advice { kind: "negative" | "bid_up" | "bid_down" | "budget_up" | "budget_down" | "pause" | "harvest" | "restructure" | "other"; target: string; amountPct?: number; text: string }
export interface CheckedAdvice extends Advice { verdict: "agree" | "caution" | "disagree" | "unknown"; why: string }
export function checkAdvice(advice: Advice[], r: Reports, breakevenPct?: number): CheckedAdvice[] {
  const rows = r.sp_search_term?.report?.rows ?? [];
  const leaks = new Set((r.sp_search_term?.roast?.eaten ?? []).map((e) => e.term.toLowerCase()));
  const sum = (t: string) => {
    const m = rows.filter((x) => x.searchTerm.toLowerCase() === t.toLowerCase() || (x.targeting ?? "").toLowerCase() === t.toLowerCase());
    return m.length ? m.reduce((a, x) => ({ spend: a.spend + x.spend, sales: a.sales + x.sales, orders: a.orders + x.orders, clicks: a.clicks + x.clicks }), { spend: 0, sales: 0, orders: 0, clicks: 0 }) : null;
  };
  return advice.slice(0, 25).map((a): CheckedAdvice => {
    const d = a.target ? sum(a.target) : null;
    const acos = d && d.sales > 0 ? (d.spend / d.sales) * 100 : null;
    if (a.kind === "negative") {
      if (!d) return { ...a, verdict: "unknown", why: "Not in your search term report, so I can't check it." };
      if (d.orders > 0) return { ...a, verdict: "disagree", why: `This search sold: ${d.orders} order${d.orders > 1 ? "s" : ""}, ${$(d.sales)} in sales. Blocking it cuts sales.` };
      if (d.clicks < 10) return { ...a, verdict: "caution", why: `Only ${d.clicks} clicks so far. Too early to call it waste; wait for ~10+ clicks.` };
      return { ...a, verdict: "agree", why: `${d.clicks} clicks, ${$(d.spend)} spent, no orders.${leaks.has(a.target.toLowerCase()) ? " Rocco flags it too." : ""}` };
    }
    if (a.kind === "bid_up" || a.kind === "budget_up") {
      if ((a.amountPct ?? 0) > 20) return { ...a, verdict: "caution", why: `A ${a.amountPct}% jump at once. Move in steps of 20% or less and check a week later.` };
      if (acos !== null && breakevenPct && acos > breakevenPct) return { ...a, verdict: "disagree", why: `ACoS here is ${pct(acos)}, above your break-even ${pct(breakevenPct)}. Spending more loses more.` };
      return { ...a, verdict: d ? "agree" : "unknown", why: d ? (acos !== null ? `ACoS ${pct(acos)} with ${d.orders} orders: room to grow.` : "No sales yet: raise carefully.") : "Not in your report, so I can't check the numbers." };
    }
    if (a.kind === "bid_down" || a.kind === "budget_down") {
      if (acos !== null && breakevenPct && acos < breakevenPct * 0.7) return { ...a, verdict: "caution", why: `ACoS is ${pct(acos)}, well under break-even. Cutting may lose profitable sales.` };
      return { ...a, verdict: d ? "agree" : "unknown", why: d ? `ACoS ${acos !== null ? pct(acos) : "n/a"} on ${$(d.spend)} spend.` : "Not in your report." };
    }
    if (a.kind === "restructure") return { ...a, verdict: "caution", why: "Big restructures reset what Amazon has learned and often drop sales for weeks. Do it one campaign at a time." };
    if (a.kind === "pause") return { ...a, verdict: d && d.orders > 0 ? "caution" : "agree", why: d && d.orders > 0 ? `It sold ${d.orders} times. Pausing loses those sales; lower the bid instead.` : "No sales found for it." };
    if (a.kind === "harvest") return { ...a, verdict: d && d.orders >= 2 ? "agree" : "caution", why: d && d.orders >= 2 ? `${d.orders} orders: a proven search, worth its own exact match.` : "Needs at least 2 orders before it's proven." };
    return { ...a, verdict: "unknown", why: "General advice: nothing in the reports to check it against." };
  });
}
/** No-AI fallback: one recommendation per line/sentence, recognised by its verb; quoted text is the target. */
export function parseAdviceRules(text: string): Advice[] {
  const out: Advice[] = [];
  for (const raw of text.split(/\n+|(?<=[.!?])\s+/)) {
    const s = raw.replace(/^[\s\-*•\d.)]+/, "").trim();
    if (s.length < 6) continue;
    const l = s.toLowerCase();
    const amount = Number(l.match(/(\d{1,3})\s*%/)?.[1]);
    const kind: Advice["kind"] | null =
      /negative|block|exclude/.test(l) ? "negative" :
      /pause|turn off|stop/.test(l) ? "pause" :
      /restructur|rebuild|single.keyword|skag|reorgani/.test(l) ? "restructure" :
      /exact|harvest|graduat/.test(l) ? "harvest" :
      /budget/.test(l) ? (/(cut|lower|reduc|decreas)/.test(l) ? "budget_down" : "budget_up") :
      /bid/.test(l) ? (/(cut|lower|reduc|decreas)/.test(l) ? "bid_down" : "bid_up") : null;
    if (!kind) continue;
    const quoted = [...s.matchAll(/(?:^|[\s(])["'“‘]([^"“”‘’]{1,80}?)["'”’](?=[\s.,;:!?)]|$)/g)].map((m) => m[1]);
    for (const target of quoted.length ? quoted : [""]) out.push({ kind, target, ...(Number.isFinite(amount) ? { amountPct: amount } : {}), text: s.slice(0, 200) });
  }
  return out.slice(0, 25);
}
function adviceCheck(i: Inputs): Result {
  const c = i.advice ?? [];
  if (!c.length) return { headline: "No concrete moves found in that text.", sub: "Paste specific recommendations, like: block \"free cutting board\", raise the bid on \"bamboo cutting board\" by 15%.", stats: [], items: [], share: "" };
  const n = (v: CheckedAdvice["verdict"]) => c.filter((x) => x.verdict === v).length;
  const T: Record<CheckedAdvice["verdict"], Tone> = { agree: "good", caution: "warn", disagree: "bad", unknown: "info" };
  const L: Record<CheckedAdvice["verdict"], string> = { agree: "✅ Rocco agrees", caution: "⚠️ Careful", disagree: "❌ Don't", unknown: "❔ Can't check" };
  const checked = c.length - n("unknown");
  const score = checked ? Math.round(((n("agree") + n("caution") * 0.5) / checked) * 100) : 0;
  return {
    score, scoreLabel: "Advice score",
    headline: n("disagree") ? `${n("disagree")} of ${c.length} recommendations would cost you money.` : `No harmful moves found in ${c.length} recommendations.`,
    sub: `${n("agree")} agree · ${n("caution")} careful · ${n("disagree")} don't · ${n("unknown")} can't check from your data`,
    stats: [{ k: "Recommendations", v: String(c.length) }, { k: "Would cost you", v: String(n("disagree")) }],
    items: [...c].sort((a, b) => order(T[a.verdict]) - order(T[b.verdict])).map((x) => ({ title: `${L[x.verdict]}: ${x.text}`, detail: x.why, tone: T[x.verdict] })),
    share: `I got a second opinion on my AI's Amazon ads advice, checked against my real data. ${n("disagree")} of ${c.length} moves would have cost me money.`,
  };
}

// ---------------------------------------------------------------- 5. Seller Wrapped (lib/wrapped.ts)
function wrapped(i: Inputs): Result {
  const st = i.now.sp_search_term;
  const w = buildWrapped({ biz: i.now.business_report?.business ?? [], terms: st?.report?.rows, roast: st?.roast, period: i.form.period || "This year so far", hide: i.form.hide !== "no" });
  if (!w) return { headline: "Add your Business Report.", stats: [], items: [], share: "" };
  return {
    headline: `You're ${w.persona.name}.`, sub: w.persona.line, stats: [],
    items: w.slides.map((s) => ({ title: `${s.kicker}: ${s.big}`, detail: `${s.line} ${s.sub ?? ""}`.trim(), tone: "info" as Tone })),
    share: `My Amazon Seller Wrapped: I'm ${w.persona.name}.`, wrapped: w,
  };
}

// ---------------------------------------------------------------- 6. Am I overpaying?
function overpaying(i: Inputs): Result {
  const sales = num(i.form.sales) || stat(i.now, "business_report", "sales") * (30 / Math.max(1, stat(i.now, "sp_search_term", "days") || 30));
  const spend = num(i.form.adspend) || stat(i.now, "sp_search_term", "spend") * (30 / Math.max(1, stat(i.now, "sp_search_term", "days") || 30));
  const agency = num(i.form.agency) || 0, software = num(i.form.software) || 0;
  const acos = stat(i.now, "sp_search_term", "acosPct"), conv = stat(i.now, "business_report", "conversionPct"), leak = stat(i.now, "sp_search_term", "leakPct");
  const items: Item[] = [];
  const band = (v: number, b: { lo: number; hi: number; label: string }, lowerIsBetter = true): Item => ({
    title: `${b.label}: ${pct(v)} (typical ${b.lo}–${b.hi}%)`,
    detail: lowerIsBetter ? (v > b.hi ? "Above the typical range: you're likely paying more than you need to." : v < b.lo ? "Below the typical range: you may be under-investing in growth." : "Inside the typical range.") : v < b.lo ? "Below the typical range: fix the listing before buying more clicks." : "In or above the typical range.",
    tone: lowerIsBetter ? (v > b.hi ? "bad" : "good") : v < b.lo ? "warn" : "good",
  });
  if (sales > 0 && spend > 0) items.push(band((spend / sales) * 100, TYPICAL.tacos));
  if (Number.isFinite(acos)) items.push(band(acos, TYPICAL.acos));
  if (Number.isFinite(leak)) items.push(band(leak, TYPICAL.waste));
  if (Number.isFinite(conv)) items.push(band(conv, TYPICAL.conversion, false));
  const mgmt = agency + software;
  if (mgmt > 0) {
    const share = sales > 0 ? (mgmt / sales) * 100 : NaN;
    items.push({ title: `You pay ${$(mgmt)}/month to manage ads${Number.isFinite(share) ? ` (${pct(share)} of sales)` : ""}`, detail: `Rocco: ${$(PLAN.monthlyCents / 100)}/month flat, any ad spend. That's ${$((mgmt - PLAN.monthlyCents / 100) * 12)} a year difference.`, tone: mgmt > (PLAN.monthlyCents / 100) * 2 ? "bad" : "info" });
  }
  const over = items.filter((x) => x.tone === "bad").length;
  return {
    headline: over ? `You're likely overpaying in ${over} place${over > 1 ? "s" : ""}.` : "Nothing looks out of line.",
    sub: "Compared with typical ranges published by seller tools and agencies. They vary a lot by category and price; treat them as a sense check, not a verdict.",
    stats: [sales > 0 && { k: "Sales / month", v: $(sales) }, spend > 0 && { k: "Ad spend / month", v: $(spend) }, mgmt > 0 && { k: "Management / month", v: $(mgmt) }].filter(Boolean) as Result["stats"],
    items, share: `I checked if I'm overpaying on Amazon. ${over ? `Overpaying in ${over} place${over > 1 ? "s" : ""}.` : "All in range."} Free check:`,
  };
}

// ---------------------------------------------------------------- 7. Money leak detector
function leaks(i: Inputs): Result {
  const f = all(i.now).flatMap((x) => x.analysis.findings).filter((x) => x.severity !== "win" && x.valueMonthly > 0);
  const items = f.map(asItem).sort(byMoney);
  const monthly = Math.round(f.reduce((t, x) => t + x.valueMonthly, 0));
  return {
    headline: monthly > 0 ? `${$(monthly)} a month leaking out of your account.` : "No measurable leaks in these reports.",
    sub: monthly > 0 ? `${$(monthly * 12)} a year, across ${items.length} leak${items.length === 1 ? "" : "s"} you can fix.` : "Add more reports (campaigns, inventory, business report) to check more places.",
    score: monthly, scoreLabel: "$ / month",
    stats: [{ k: "Per month", v: $(monthly) }, { k: "Per year", v: $(monthly * 12) }, { k: "Leaks found", v: String(items.length) }],
    items, share: `Rocco found ${monthly > 0 ? $(monthly * 12) + " a year" : "the leaks"} leaking from my Amazon account. Check yours:`,
  };
}

// ---------------------------------------------------------------- 8. What actually worked?
function whatWorked(i: Inputs): Result {
  const b = i.before?.sp_campaign?.campaigns, a = i.now.sp_campaign?.campaigns;
  const bs = i.before?.sp_search_term?.report?.rows ?? [], as = i.now.sp_search_term?.report?.rows ?? [];
  const items: Item[] = [];
  const perDay = (rows: { campaign: string; spend: number; sales: number }[], days: number) => {
    const m = new Map<string, { spend: number; sales: number }>();
    for (const r of rows) { const x = m.get(r.campaign) ?? { spend: 0, sales: 0 }; x.spend += r.spend / days; x.sales += r.sales / days; m.set(r.campaign, x); }
    return m;
  };
  const daysOf = (r?: Reports) => Math.max(1, num(r?.sp_search_term?.analysis.stats.days) || num(r?.sp_campaign?.analysis.stats.days) || 30);
  const B = b ? perDay(b.rows, b.days) : perDay(bs.map((r) => ({ campaign: r.campaign, spend: r.spend, sales: r.sales })), daysOf(i.before));
  const A = a ? perDay(a.rows, a.days) : perDay(as.map((r) => ({ campaign: r.campaign, spend: r.spend, sales: r.sales })), daysOf(i.now));
  const moves = [...A.entries()].filter(([k]) => B.has(k)).map(([k, x]) => {
    const y = B.get(k)!; const pa = x.sales > 0 ? x.spend / x.sales : Infinity, pb = y.sales > 0 ? y.spend / y.sales : Infinity;
    return { k, profitDelta: (x.sales - x.spend) - (y.sales - y.spend), acosB: pb, acosA: pa, salesB: y.sales, salesA: x.sales };
  }).filter((m) => Math.abs(m.profitDelta) * 30 > 20).sort((p, q) => q.profitDelta - p.profitDelta);
  const show = (m: (typeof moves)[number]) => `Ad sales ${$(m.salesB * 30)} → ${$(m.salesA * 30)}/mo · ACoS ${Number.isFinite(m.acosB) ? pct(m.acosB * 100) : "n/a"} → ${Number.isFinite(m.acosA) ? pct(m.acosA * 100) : "n/a"}`;
  for (const m of moves.filter((x) => x.profitDelta > 0).slice(0, 5)) items.push({ title: `Worked: ${m.k}`, detail: show(m), tone: "good", value: Math.round(m.profitDelta * 30) });
  for (const m of moves.filter((x) => x.profitDelta < 0).slice(-5).reverse()) items.push({ title: `Got worse: ${m.k}`, detail: show(m), tone: "bad", value: Math.round(-m.profitDelta * 30) });
  const newC = [...A.keys()].filter((k) => !B.has(k)), goneC = [...B.keys()].filter((k) => !A.has(k));
  if (newC.length) items.push({ title: `${newC.length} new campaign${newC.length > 1 ? "s" : ""}`, detail: newC.slice(0, 4).join(" · "), tone: "info" });
  if (goneC.length) items.push({ title: `${goneC.length} campaign${goneC.length > 1 ? "s" : ""} stopped spending`, detail: goneC.slice(0, 4).join(" · "), tone: "info" });
  const up = moves.filter((x) => x.profitDelta > 0).length, down = moves.filter((x) => x.profitDelta < 0).length;
  return {
    headline: moves.length ? `${up} campaign${up === 1 ? "" : "s"} improved, ${down} got worse between the two periods.` : "Add the same report for two periods to see what moved.",
    sub: "Improved = ad sales minus ad spend went up. Two periods show what moved, not why: seasonality, stock and price changes count too.",
    stats: [{ k: "Improved", v: String(up) }, { k: "Got worse", v: String(down) }, { k: "Compared", v: String(moves.length) }],
    items, share: `I checked what actually worked in my Amazon ads: ${up} wins, ${down} misses. Free tool:`,
  };
}

// ---------------------------------------------------------------- 9. Could I fire my agency?
export const AGENCY_TASKS: { k: string; t: string; who: "rocco" | "partly" | "human"; why: string }[] = [
  { k: "negatives", t: "Blocking wasted searches", who: "rocco", why: "Rocco finds them every morning and blocks them in one tap." },
  { k: "bids", t: "Bid changes", who: "rocco", why: "Daily, capped at ±20% a step, never past break-even, measured a week later." },
  { k: "harvest", t: "Moving winning searches to exact campaigns", who: "rocco", why: "Built in Amazon in one tap." },
  { k: "budgets", t: "Budgets and pacing", who: "rocco", why: "Moves budget to profitable campaigns; midday alerts when a winner runs dry." },
  { k: "structure", t: "Campaign structure and naming", who: "rocco", why: "Tidy: one naming system, one portfolio per product." },
  { k: "reporting", t: "Weekly / monthly reports", who: "rocco", why: "Every change logged with its result; a shareable report any time." },
  { k: "stock", t: "Restock and stock-out alerts", who: "rocco", why: "Warns before you run out and creates the shipment plan in Amazon." },
  { k: "listings", t: "Listing keyword updates", who: "partly", why: "Rocco adds selling words to search terms and suggests title edits; you approve the wording." },
  { k: "launches", t: "New product launches", who: "partly", why: "Rocco sets up and watches campaigns; launch strategy is still your call." },
  { k: "creative", t: "Images, video, A+ design", who: "human", why: "Rocco drafts A+ text; photos and design need a person." },
  { k: "dsp", t: "Amazon DSP and off-Amazon ads", who: "human", why: "Not something Rocco runs." },
  { k: "calls", t: "Strategy calls and account reps", who: "human", why: "Rocco answers questions by text any time, but it isn't a person on a call." },
];
function fireAgency(i: Inputs): Result {
  const picked = (i.form.tasks ?? "").split(",").filter(Boolean);
  const tasks = AGENCY_TASKS.filter((t) => picked.includes(t.k));
  const fee = num(i.form.fee) || 0;
  const n = (w: string) => tasks.filter((t) => t.who === w).length;
  const covered = tasks.length ? Math.round(((n("rocco") + n("partly") * 0.5) / tasks.length) * 100) : 0;
  const verdict = !tasks.length ? "Tick what your agency does." : covered >= 80 ? "Yes, most of it can be automated." : covered >= 50 ? "Partly: automate the daily work, keep people for the rest." : "Not yet: your agency does a lot Rocco doesn't.";
  return {
    score: covered, scoreLabel: "% automatable", headline: verdict,
    sub: fee > 0 ? `You pay ${$(fee)}/month. Rocco is ${$(PLAN.monthlyCents / 100)}/month flat: ${$(Math.max(0, fee - PLAN.monthlyCents / 100) * 12)} a year difference.` : undefined,
    stats: [{ k: "Automatable", v: String(n("rocco")) }, { k: "Partly", v: String(n("partly")) }, { k: "Needs a person", v: String(n("human")) }],
    items: tasks.map((t) => ({ title: `${t.who === "rocco" ? "🤖 Rocco does it" : t.who === "partly" ? "🤝 Partly" : "🧑 Keep a person"}: ${t.t}`, detail: t.why, tone: t.who === "rocco" ? "good" : t.who === "partly" ? "warn" : "info" })),
    share: `${covered}% of what my Amazon agency does could be automated. Check yours:`,
  };
}

// ---------------------------------------------------------------- 10. Rocco watches your business
function watch(i: Inputs): Result {
  const f = all(i.now).flatMap((x) => x.analysis.findings).filter((x) => x.severity === "high" || x.severity === "medium").sort((a, b) => b.valueMonthly - a.valueMonthly);
  const when = ["Mon 6:02 AM", "Mon 1:10 PM", "Tue 6:01 AM", "Wed 6:03 AM", "Thu 1:05 PM", "Fri 6:02 AM", "Sat 6:04 AM"];
  return {
    headline: f.length ? `This week I'd have texted you ${f.length} time${f.length > 1 ? "s" : ""}.` : "Quiet week: nothing I'd have bothered you about.",
    sub: "From your reports, as alerts on the schedule I'd keep: morning rounds at 6 AM and a midday budget check.",
    stats: [{ k: "Alerts", v: String(f.length) }, { k: "Money at stake / mo", v: $(f.reduce((t, x) => t + x.valueMonthly, 0)) }],
    items: f.slice(0, 12).map((x, k) => ({ title: `${when[k % when.length]} · ${x.title}`, detail: x.detail, tone: tone(x), value: x.valueMonthly || undefined })),
    share: "Rocco showed me every alert it would have sent me this week. Try it:",
  };
}

// ---------------------------------------------------------------- the catalogue
const DL = { st: "Amazon Ads → Reports → Sponsored Products → Search term → last 30 days → Download.", camp: "Amazon Ads → Reports → Sponsored Products → Campaign.", biz: "Seller Central → Reports → Business Reports → Detail Page Sales and Traffic by Child Item.", inv: "Seller Central → Inventory → FBA Inventory → download." };
const howTo = { q: "Which reports, and where do I get them?", a: `Search terms: ${DL.st} Business report: ${DL.biz} Campaigns: ${DL.camp} Files are read in your browser and never uploaded.` };
const connect = { q: "Can't you just connect to my Amazon account?", a: "Yes: hire Rocco and connect Seller Central and Amazon Ads once (Amazon's own sign-in). Sales and stock usually arrive within hours; Amazon takes up to 48 hours to send ads history the first time. After that Rocco runs this every morning by itself." };

export const MAGNETS: Magnet[] = [
  { slug: "amazon-health-check", n: "01", name: "Amazon Financial Health Check", tagline: "The annual physical, for your Amazon business.", promise: "A 0–100 health score with your vitals: TACoS, ACoS vs break-even, conversion, waste, stock risk.", pose: "hero", needs: ["business_report", "sp_search_term"], optional: ["sp_campaign", "inventory"], fields: [{ key: "margin", label: "Your margin before ads (%)", type: "number", placeholder: "e.g. 35", optional: true, help: "Price minus product cost, fees and shipping. Sets your break-even ACoS." }], faq: [howTo, connect], run: healthCheck },
  { slug: "roast-my-amazon-account", n: "02", name: "Roast My Amazon Account", tagline: "Brutally honest. Painfully accurate.", promise: "Rocco tears through your ads and tells you exactly where the money burns. No mercy, all receipts.", pose: "judge", needs: ["sp_search_term"], optional: ["sp_campaign", "business_report", "inventory"], faq: [howTo, connect, { q: "Is it really savage?", a: "About the numbers, yes. Never about you." }], run: roast },
  { slug: "amazon-agency-audit", n: "03", name: "The Agency Audit", tagline: "What did your agency actually change?", promise: "Compare before and after: did ACoS, waste and sales move, and what did they leave running?", pose: "judge", needs: [], needsOneOf: ["sp_search_term", "sp_campaign"], optional: ["sp_search_term", "sp_campaign"], periods: true, note: "No offence, agencies. This is a question plenty of brand owners ask themselves quietly; Rocco is just asking it out loud. A good agency comes out of this looking great, and agencies are welcome to run it on their own clients and send them the result.", fields: [{ key: "fee", label: "What you pay them per month ($)", type: "number", optional: true }], faq: [{ q: "What do I upload?", a: "The same report for two periods: one before (or early in) the agency, one for the last 30 days. Best: the search term report, which shows wasted searches and whether they were ever blocked; Amazon keeps about 65 days of it. For an older 'before', use the campaign report (Amazon keeps about 95 days) or exports your agency sent you." }, { q: "Can I see exactly what my agency changed?", a: "In the Amazon Ads console, open a campaign and its History tab: it lists bid, budget and status changes. Amazon's API offers the same change history for Sponsored Products and Sponsored Brands (about 90 days back, without who made each change). This free tool compares results instead, because results are what you pay for." }, { q: "Is this anti-agency?", a: "No. Plenty of agencies do great work, and this shows it. Agencies can run it on their own clients first and share the result." }, howTo, connect], run: agencyAudit },
  { slug: "ai-ad-advice-second-opinion", n: "04", name: "Second Opinion on Your AI's Ad Advice", tagline: "Check AI ad advice before it costs you.", promise: "Paste what an AI assistant (or anyone) told you to do with your ads. Rocco checks every move against your real numbers.", pose: "hero", needs: ["sp_search_term"], optional: [], fields: [{ key: "advice", label: "Paste the recommendations", type: "textarea", placeholder: "e.g. Add 'free cutting board' as a negative. Raise the bid on 'bamboo cutting board' by 40%. Restructure into single-keyword campaigns…", help: "Only this text is read by Rocco's AI to pick out the moves. Your reports stay on your device." }, { key: "margin", label: "Your margin before ads (%)", type: "number", optional: true }], faq: [{ q: "Whose advice can I paste?", a: "Any AI assistant's, an agency's, a freelancer's or your own notes. Rocco pulls out each concrete move and checks it against your search term report." }, { q: "Why would AI advice be wrong?", a: "General advice can't see your numbers. 'Block this search' sounds sensible until the report shows it sold 30 times." }, howTo], run: adviceCheck },
  { slug: "amazon-seller-wrapped", n: "05", name: "Amazon Seller Wrapped", tagline: "Your year on Amazon, told as a story.", promise: "Your seller personality, your MVP, your hidden gem, the product leaking shoppers, the zombies, your donation to Amazon and your resolution for next year. A story you can tap through, and a card you can share without showing your numbers.", pose: "party", needs: ["business_report"], optional: ["sp_search_term"], fields: [{ key: "period", label: "Which period is your Business Report?", type: "select", options: Object.keys(PERIODS), help: "Business Report → pick the date range at the top (e.g. Jan 1 to today) → download. Any range works." }, { key: "hide", label: "Hide my sales numbers", type: "select", options: ["yes", "no"], help: "Units and percentages still show. The share link never includes product names or searches either way." }], faq: [{ q: "Which period should I pick?", a: "The longest you have: in Seller Central, Business Reports let you choose any date range (e.g. January 1 to today). Add a search term report (Amazon keeps about 65 days of it) for the ads chapters." }, { q: "What does the share link show?", a: "Only your persona and a few numbers (units, pace, top-product share, conversion; sales only if you choose). Product names and search terms stay on your device." }, howTo], run: wrapped },
  { slug: "am-i-overpaying-amazon", n: "06", name: "Am I Overpaying?", tagline: "Ad costs and management fees, sense-checked.", promise: "Your TACoS, ACoS, waste and management costs against typical ranges, and what you'd save.", pose: "hero", needs: [], optional: ["business_report", "sp_search_term"], fields: [{ key: "sales", label: "Monthly sales ($)", type: "number", optional: true }, { key: "adspend", label: "Monthly ad spend ($)", type: "number", optional: true }, { key: "agency", label: "Agency fee per month ($)", type: "number", optional: true }, { key: "software", label: "PPC software per month ($)", type: "number", optional: true }], faq: [{ q: "Where do the ranges come from?", a: "Typical ranges published by Amazon seller tools and agencies. They vary a lot by category and price, so they're a sense check. As more sellers opt in, Rocco will compare you with real anonymous sellers like you." }, howTo], run: overpaying },
  { slug: "amazon-money-leak-detector", n: "07", name: "The Amazon Money Leak Detector", tagline: "Every avoidable dollar, in one number.", promise: "Wasted searches, losing campaigns, starved winners, stock-outs, Buy Box: each leak priced per month.", pose: "judge", needs: ["sp_search_term"], optional: ["sp_campaign", "business_report", "inventory", "sp_placement"], faq: [howTo, connect], run: leaks },
  { slug: "what-actually-worked-amazon", n: "08", name: "What Actually Worked?", tagline: "Receipts for every change you made.", promise: "Compare two periods: which campaigns got better, which got worse, what's new and what stopped.", pose: "hero", needs: ["sp_campaign"], optional: ["sp_search_term"], periods: true, faq: [{ q: "What do I upload?", a: "The campaign report (and optionally search terms) for two periods, e.g. the month before your changes and the month after." }, howTo, connect], run: whatWorked },
  { slug: "could-i-fire-my-amazon-agency", n: "09", name: "Could I Fire My Agency?", tagline: "What's automatable, what isn't.", promise: "Tick what your agency does. See which jobs software can do today, which need a person, and the cost difference.", pose: "judge", needs: [], optional: ["sp_search_term"], fields: [{ key: "tasks", label: "What does your agency do?", type: "checks", options: AGENCY_TASKS.map((t) => `${t.k}|${t.t}`) }, { key: "fee", label: "What you pay per month ($)", type: "number", optional: true }], note: "No offence, agencies. This is a question plenty of brand owners ask themselves quietly; Rocco is just asking it out loud. A good agency comes out of this looking great, and agencies are welcome to run it on their own clients and send them the result.", faq: [{ q: "Is this just a sales pitch?", a: "It's honest about what Rocco can't do: creative, DSP and calls need people. If your agency mostly does those, keep them." }, { q: "Is this anti-agency?", a: "No. It's a question brand owners already ask; better to answer it honestly. Many sellers end up keeping their agency for strategy and creative and automating the daily work." }], run: fireAgency },
  { slug: "rocco-watches-your-business", n: "10", name: "Rocco Watches Your Business", tagline: "Problems found before you ask.", promise: "Upload this week's reports. See every alert Rocco would have sent you, on the schedule it keeps.", pose: "wave", needs: ["sp_search_term"], optional: ["sp_campaign", "business_report", "inventory"], faq: [connect, howTo], run: watch },
];
export const magnet = (slug: string) => MAGNETS.find((m) => m.slug === slug);
export const FREE_ITEMS = 3;
