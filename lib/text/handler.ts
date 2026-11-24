import { applyMany } from "../apply";
import { LIMIT_MSG, spend } from "../security";
import { datadoeOn } from "../datadoe";
import { SITE } from "../site";
import { REPORT_HELP, type ReportKind } from "../analyze";
import { benchmark } from "../rules/benchmarks";
import type { Store } from "../store/types";
import { applyChanges, buildBrief, clearPending, createWorkspace, DEFAULT_BRAND, ensureLinkCode, expandCodes, FREE_PROPOSALS, latestRuns, queuePending, rememberToken, revealToken, runAnalysis } from "../workspace";
import type { Workspace } from "../store/types";
import { maskPhone, normPhone, parseCommand } from "./commands";
import { dailyNumbers } from "./daily";
import { paywall, type Moment } from "../paywall";
import { getPriceState, validateLicenseKey } from "../payments";
import { demoMorning } from "../demo";
import { hasAccess, accessOf } from "../access";
import { cancelSubscription } from "../payments";
import { hireUrl } from "../paywall";
import { askRocco, brainOn } from "../brain";
import { formatBrief } from "../mcp/format";
import Papa from "papaparse";
import { savedPhrase } from "../savings";
import { applyLink } from "../apply-link";
import { howTo } from "../howto";

const SITE_URL = "https://rocco.works";
/** One personal link: opens the one-step-at-a-time start page (plug in Amazon) or the dashboard once data flows. */
const homeUrl = (t: string | null) => (t ? `${SITE_URL}/w/${t}` : `${SITE_URL}/setup`);

/** "I'm Praveen, we sell..." → "Praveen". */
function firstName(t: string): string | null {
  const m = t.match(/\b(?:i'?m|i am|this is|it'?s|name'?s|my name is)\s+([A-Z][a-z]{1,20})\b/i) ?? t.match(/^\s*([A-Z][a-z]{1,20})\s*(?:here|[,.!-])/);
  const n = m?.[1];
  return n && !/^(a|an|the|we|selling|from|on|in|just|looking|trying|not)$/i.test(n) ? n[0].toUpperCase() + n.slice(1).toLowerCase() : null;
}

/** A teammate invite: a link that opens Messages with a ready first text, so they join with one tap. */
async function inviteReply(store: Store, ws: Workspace): Promise<Reply> {
  const code = await ensureLinkCode(store, ws);
  // Our own invite page: link previews never touch a LoopMessage opt-in link (each one can cost a contact).
  return { bubbles: ["Send this to a teammate. One tap and they're on your Rocco 👇", `https://rocco.works/j/${code}`] };
}

/**
 * The paywall at the right moment, as two bubbles (pitch + checkout link alone, so it previews).
 * Picks the strongest moment that's due: a fix that just proved itself beats "I found money".
 */
async function nudge(store: Store, ws: Workspace, b: Awaited<ReturnType<typeof buildBrief>>, now: Date, only?: Moment): Promise<string[]> {
  if (hasAccess(ws)) return [];
  const price = await getPriceState().catch(() => null);
  const win = b.recentResults.find((a) => a.status === "worked");
  const tries: [Moment, { key?: string; saved?: number }][] = only ? [[only, {}]] : [["worked", { key: win?.id, saved: win?.result?.savedEstimate }], ["found", {}]];
  for (const [m, extra] of tries) {
    if (m === "worked" && !win) continue;
    const p = paywall(ws, b, m, { now, price, ...extra });
    if (p) { await store.saveWorkspace(ws); return [p.text, p.url]; }
  }
  return [];
}

const HELP = [
  "Text me anytime 🦝",
  "• numbers → today's numbers",
  "• brief → what to do today",
  "• YES N1 N2 → approve fixes",
  "• undo B3 → undo a change",
  "• wins → what worked (measured vs estimated)",
  "• invite → add a teammate",
  "• demo → see a sample brand",
  "• link → your Rocco page",
  "• STOP → pause texts",
].join("\n");

const TOPIC_KIND: Record<string, ReportKind[]> = {
  ads: ["sp_search_term"], budgets: ["sp_campaign"], placements: ["sp_placement"], stock: ["inventory"], listings: ["listing_health", "business_report"],
  general: ["sp_search_term", "sp_campaign", "inventory", "business_report"],
};

/** Rocco's reply: one or more iMessage bubbles, optionally followed by his contact card. */
export interface Reply { bubbles: string[]; card?: boolean }

/** Handle one inbound text and return Rocco's reply as a single string (tests, dry runs). */
export async function handleInbound(store: Store, from: string, text: string, now = new Date()): Promise<string> {
  return (await respond(store, from, text, now)).bubbles.join("\n\n");
}

const bubbles = (s: string): Reply => ({ bubbles: [s] });

export async function respond(store: Store, from: string, text: string, now = new Date(), opts: { attachments?: string[] } = {}): Promise<Reply> {
  const r = await core(store, from, text, now, opts.attachments ?? []);
  return typeof r === "string" ? bubbles(r) : r;
}

/** Everything Rocco knows about a team, as plain text for the brain. */
async function teamContext(store: Store, ws: Workspace, now: Date): Promise<string> {
  const b = await buildBrief(store, ws, now);
  const L = [ws.about ? `They said: ${ws.about}` : "", hasAccess(ws) ? "Plan: active (all fixes unlocked)." : "Plan: none yet (needs hiring: $2,790/year or $279/month, 7-day money-back guarantee).", formatBrief(b)];
  const snaps = await store.listSnapshots(ws.id, { limit: 8 });
  for (const s of snaps) {
    const f = (s.extra?.findings ?? []).slice(0, 4).map((x) => `  • ${x.title}`).join("\n");
    L.push(`${s.kind} (${s.createdAt.slice(0, 10)}): ${s.headline}${f ? `\n${f}` : ""}`);
  }
  if (ws.pending?.length) L.push(`Approved by text, waiting to be applied: ${ws.pending.flatMap((p) => p.codes).join(", ")}`);
  return L.filter(Boolean).join("\n").slice(0, 12000);
}

const isTable = (u: string) => /\.(csv|tsv|txt)(\?|$)/i.test(u);

/** A report file (CSV/TSV) texted to Rocco: run it through the same engine as Claude does. Works without the brain. */
async function readReport(store: Store, ws: Workspace, url: string, now: Date): Promise<Reply> {
  const res = await fetch(url).catch(() => null);
  const body = res?.ok ? await res.text().catch(() => "") : "";
  if (!body || body.length > 5_000_000) return { bubbles: ["I couldn't open that file. Try sending it again, or plug in Amazon and I'll pull it myself 👇", homeUrl(revealToken(ws))] };
  try {
    const table = Papa.parse<unknown[]>(body, { skipEmptyLines: true }).data;
    const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
    const { out } = await runAnalysis(store, ws, brand, table);
    const b = await buildBrief(store, ws, now);
    const open = [...(b.perBrand.find((x) => x.brand === brand)?.open ?? [])].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3);
    const L = [`📥 Got your ${REPORT_HELP[out.kind].name}. ${out.analysis.headline}`];
    for (const o of open) L.push(`• ${o.code}: ${o.reason.slice(0, 90)}`);
    if (open.length) L.push(`Reply YES ${open.map((o) => o.code).join(" ")} to approve.`);
    return { bubbles: [L.join("\n"), ...(await nudge(store, ws, b, now))] };
  } catch (e) {
    return { bubbles: [e instanceof Error ? e.message : "I couldn't read that report."] };
  }
}

async function core(store: Store, from: string, text: string, now: Date, attachments: string[] = []): Promise<string | Reply> {
  const phone = normPhone(from);
  const cmd = parseCommand(text);

  if (cmd.kind === "link") {
    const ws = await store.findWorkspaceByLinkCode(cmd.code);
    if (!ws) return `Hmm, ${cmd.code} isn't a team code I know. Ask your teammate to text me “invite” and send you the link.`;
    const existing = await store.getPhone(phone);
    await store.savePhone({ phone, workspaceId: ws.id, optedOut: false, createdAt: existing?.createdAt ?? now.toISOString(), lastSeenAt: now.toISOString() });
    const team = (await store.listPhones({ workspaceId: ws.id })).length;
    const hi = `You're in 🦝 You're on your team's Rocco${team > 1 ? ` (${team} teammates now)` : ""}. I'll text the numbers every morning. Text “help” anytime.`;
    // Paywall moment: the team is growing. Told to the person who joined, once per workspace.
    const pay = team >= 2 ? await nudge(store, ws, await buildBrief(store, ws, now), now, "team") : [];
    return { bubbles: [hi, ...pay] };
  }

  let p = await store.getPhone(phone);
  if (!p) {
    if (cmd.kind === "stop") return "Okay, I won't text you. Text me anytime if you change your mind.";
    // First text from a new number: they get their own Rocco right away (Boardy-style: no wall, one question).
    const { token, ws } = await createWorkspace(store);
    await rememberToken(store, ws, token);
    await ensureLinkCode(store, ws);
    const value = attachments.length > 0; // they opened with a report or screenshot: answer it, skip the intro
    p = { phone, workspaceId: ws.id, optedOut: false, createdAt: now.toISOString(), lastSeenAt: now.toISOString(), ...(value ? {} : { stage: "intro" as const }) };
    await store.savePhone(p);
    if (!value) return {
      bubbles: [
        "Hey, I'm Rocco 🦝 I run Amazon with your team: ads, sales and stock, right here in iMessage.",
        "Who am I talking to, and what do you sell on Amazon?",
      ],
      card: true,
    };
  }
  const ws = await store.getWorkspaceById(p.workspaceId);
  if (!ws) return "I lost track of your team. Ask a teammate to text me “invite” and send you the link.";
  await store.savePhone({ ...p, stage: undefined, lastSeenAt: now.toISOString(), optedOut: cmd.kind === "stop" ? true : cmd.kind === "start" ? false : p.optedOut });

  if (attachments.length && ws) {
    if (!hasAccess(ws, now)) return { bubbles: ["I read reports and screenshots for teams that hired me 🦝 Hire me here (7-day money-back guarantee):", hireUrl(ws)] };
    if (!(await spend(store, ws, "ask"))) return LIMIT_MSG.ask;
    const file = attachments.find(isTable);
    if (file) return readReport(store, ws, file, now);
    const answer = await askRocco({ question: text, context: await teamContext(store, ws, now), images: attachments });
    if (answer) return { bubbles: [answer, ...(revealToken(ws) && !(await buildBrief(store, ws, now)).perBrand.some((x) => x.trends.length) ? ["For exact fixes, plug in Amazon 👇", homeUrl(revealToken(ws))] : [])] };
    return { bubbles: ["Got it 🦝 I can't read screenshots yet. Text me the report as a CSV (Seller Central or Ads → Reports → Download) and I'll find the fixes, or plug in Amazon 👇", homeUrl(revealToken(ws))] };
  }

  if (p.stage === "intro" && cmd.kind === "ask") {
    ws.about = text.trim().slice(0, 500);
    await store.saveWorkspace(ws);
    const name = firstName(text);
    const demo = await demoMorning(now);
    return {
      bubbles: [
        `${name ? `Nice to meet you, ${name}` : "Love it"} 🦝 Here's what your mornings look like with me. This is a sample brand:`,
        demo.text,
        "Let's turn me on for your Amazon: hire me, then connect Seller Central + Ads once (2 min). I'll text you when there's work 👇",
        homeUrl(revealToken(ws)),
      ],
    };
  }


  // No free plan: without a trial or paid plan, Rocco shows a teaser and the trial link, nothing else.
  if (!hasAccess(ws, now) && ["numbers", "brief", "wins", "approve", "undo", "ask"].includes(cmd.kind)) {
    const b = await buildBrief(store, ws, now);
    const n = b.perBrand.reduce((t, x) => t + x.hidden, 0);
    const v = b.perBrand.reduce((t, x) => t + (x.hiddenValue ?? 0), 0);
    const lead = n ? `💰 I found ~$${Math.round(v).toLocaleString("en-US")}/mo across ${n} fixes in your account.` : "I'm ready when you are 🦝";
    return { bubbles: [`${lead} Hire me to see and approve them: $2,790 a year (2 months free) or $279 a month, 7-day money-back guarantee.`, hireUrl(ws)] };
  }

  switch (cmd.kind) {
    case "stop": return bubbles("Paused. I won't text you unless you text me. Text START to resume.");
    case "start": return bubbles("Back on 🦝 Morning numbers resume tomorrow.");
    case "help": return bubbles(HELP);
    case "dashboard": return { bubbles: ["Your Rocco page 👇 (private to your team)", homeUrl(revealToken(ws))] };
    case "invite": return inviteReply(store, ws);
    case "cancel_sub": {
      // Not by text: any linked phone (a teammate, a removed person) could cancel the owner's plan.
      void cancelSubscription; void accessOf;
      if (!ws.subscriptionId) return "There's no subscription to cancel on this Rocco.";
      return "To cancel, use the link in your Dodo receipt email, or email human@rocco.works from the email you paid with. It's done the same day.";
    }
    case "activate": {
      // License keys are retired (one key could unlock unlimited teams). Access comes only from a payment for this team.
      void cmd.key; void validateLicenseKey;
      if (hasAccess(ws, now)) return "Your plan is active 🦝 Text “brief” and let's get to work.";
      return { bubbles: ["License keys don't unlock Rocco anymore. Hire me for this team here (7-day money-back guarantee). Bought a key before? Email human@rocco.works and we'll move you over.", hireUrl(ws)] };
    }
    case "demo": {
      const d = await demoMorning(now);
      return { bubbles: [d.text, `Try it: reply YES ${d.codes.slice(0, 2).join(" ")} (demo, nothing changes).`] };
    }
    case "numbers": {
      const b = await buildBrief(store, ws, now);
      if (!b.perBrand.some((x) => x.trends.length)) return { bubbles: ["No Amazon numbers yet 🦝 Plug Amazon in here (3 min), and I'll text them every morning 👇", homeUrl(revealToken(ws)), "Want a preview? Text “demo”."] };
      const snap = b.perBrand[0]?.trends.find((t) => t.kind === "sp_search_term")?.latest;
      const bench = snap ? benchmark("sp_search_term", snap.stats, await store.peerStats("sp_search_term", ws.id)) : null;
      return { bubbles: [dailyNumbers(b, { now, bench: bench?.lines, pending: ws.pending }), ...(await nudge(store, ws, b, now))] };
    }
    case "brief": {
      const b = await buildBrief(store, ws, now);
      const pb = b.perBrand[0];
      const L = ["📝 Today:"];
      if (b.due.length) L.push(`• ${b.due.length} change${b.due.length === 1 ? "" : "s"} graded on your Rocco: ${homeUrl(revealToken(ws))}`);
      const open = pb ? [...pb.open].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3) : [];
      for (const o of open) L.push(`• ${o.code}: ${o.reason.slice(0, 90)}`);
      if (open.length) L.push(`Reply YES ${open.map((o) => o.code).join(" ")} to approve.`);
      if (pb?.stale.length) L.push(`• Not checked in 7+ days: ${pb.stale.map((k) => REPORT_HELP[k].name.replace("Sponsored Products ", "")).join(", ")}.`);
      if (L.length === 1) L.push("• All clear. Nothing needs you today.");
      return { bubbles: [L.join("\n"), ...(await nudge(store, ws, b, now))] };
    }
    case "wins": {
      const b = await buildBrief(store, ws, now);
      if (!b.totals.applied) return "No changes logged yet. Approve a few fixes and I'll start keeping score 🏆";
      const top = b.recentResults.filter((a) => a.status === "worked").slice(0, 3).map((a) => `• ${a.code}: ${a.result!.summary.slice(0, 100)}`);
      return bubbles([`🏆 ${b.totals.worked}/${b.totals.applied} changes worked${b.saved ? `: ${savedPhrase({ measured: b.savedMeasured, estimated: b.savedEstimated })}` : ""}.`, ...top].join("\n"));
    }
    case "approve":
    case "undo": {
      const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
      const wanted = expandCodes(cmd.codes);
      if (cmd.kind === "undo") {
        await queuePending(store, ws, { type: "undo", codes: wanted, brand, at: now.toISOString(), by: maskPhone(phone) });
        return bubbles(`Queued undo for ${wanted.join(", ")} ↩️ It's reversed in Amazon once your account is connected; details on your Rocco.`);
      }
      const runs = await latestRuns(store, ws, brand);
      if (!runs.length) return { bubbles: [`That's the move ✅ On your account I'd make ${wanted.join(", ")} in Amazon for you and check next week if it worked.`, "Plug in Amazon to do it for real 👇", homeUrl(revealToken(ws))] };
      const allowed = new Map<string, boolean>();
      for (const r of runs) r.proposals.forEach((pp, i) => allowed.set(pp.code, hasAccess(ws) || i < FREE_PROPOSALS));
      const ok = wanted.filter((c) => allowed.get(c));
      const locked = wanted.filter((c) => allowed.get(c) === false);
      const unknown = wanted.filter((c) => !allowed.has(c));
      // Amazon connected directly: a YES by text makes the change, but only if they turned approve-by-text on
      // (after seeing their fixes on the dashboard). Otherwise: the dashboard, where every fix is shown first.
      const account = ws.amazon?.accounts?.[0];
      if (ok.length && datadoeOn() && account) {
        if (!hasAccess(ws)) return { bubbles: [`Making changes in Amazon is part of your plan. Hire me here: ${homeUrl(revealToken(ws))}`] };
        if (!ws.reminders?.approveByText) return { bubbles: [`Approving by text is off, so you see every fix before it changes anything. Approve here: ${homeUrl(revealToken(ws))}`, "(You can switch on approve-by-text there, under reminders.)"] };
        const all = runs.flatMap((r) => r.proposals.map((pp) => ({ pp, brand: r.brand })));
        const props = ok.map((c) => all.find((x) => x.pp.code === c)!).filter(Boolean);
        if (!(await spend(store, ws, "writes", props.length))) return { bubbles: [LIMIT_MSG.writes] };
        const results = await applyMany(account.id, props.map((x) => x.pp), `rocco:${ws.id}:text:${now.toISOString().slice(0, 13)}:${ok.join(",")}`.slice(0, 100));
        const done = results.filter((r) => r.status === "applied").map((r) => r.code);
        if (done.length) await applyChanges(store, ws, done, { brand, note: `made by Rocco in Amazon, approved by text (${maskPhone(phone)})` });
        const notDone = results.filter((r) => r.status !== "applied");
        return { bubbles: [[done.length ? `Done in Amazon ✅ ${done.join(", ")}. I'll check the results in a week.` : "", notDone.length ? `Couldn't make ${notDone.map((r) => r.code).join(", ")}: ${"reason" in notDone[0] ? notDone[0].reason : ""} Details: ${homeUrl(revealToken(ws))}` : "", unknown.length ? `🤔 Don't recognize ${unknown.join(", ")}.` : ""].filter(Boolean).join("\n")] };
      }
      if (ok.length) await queuePending(store, ws, { type: "apply", codes: ok, brand, at: now.toISOString(), by: maskPhone(phone) });
      const L: string[] = [];
      if (ok.length) L.push(`Approved ✅ ${ok.join(", ")}. I'll make ${ok.length === 1 ? "it" : "them"} in Amazon once your account is connected, and track the results.`);
      if (unknown.length) L.push(`🤔 Don't recognize ${unknown.join(", ")}. Text “brief” for today's codes.`);
      const pay = locked.length ? await nudge(store, ws, await buildBrief(store, ws, now), now, "locked") : [];
      if (pay.length) pay[0] = pay[0].replace("That one's", `${locked.join(", ")} ${locked.length > 1 ? "are" : "is"}`);
      if (ok.length && ws.mode === "reports") {
        const props = runs.flatMap((r) => r.proposals).filter((pp) => ok.includes(pp.code));
        const steps = props.map((pp) => `${pp.code}: ${howTo(pp)}`).join("\n\n");
        return { bubbles: [`Approved ✅ ${ok.join(", ")}. Make ${ok.length === 1 ? "it" : "them"} in the Ads console:`, steps.slice(0, 1500), `Text DONE ${ok.join(" ")} when it's made and I'll check the results next week.`, ...pay] };
      }
      return { bubbles: [...(L.length ? [L.join("\n")] : []), ...(ok.length ? [applyLink(ok)] : []), ...pay] };
    }
    case "made": {
      const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
      try {
        const res = await applyChanges(store, ws, expandCodes(cmd.codes), { brand, note: `made by hand, texted by ${maskPhone(phone)}`, freeLimit: hasAccess(ws) ? undefined : FREE_PROPOSALS });
        await clearPending(store, ws, "apply", cmd.codes);
        if (!res.actions.length) return res.locked.length ? `🔒 ${res.locked.join(", ")} need an active Rocco. Text “dashboard” to hire me.` : "Already logged 👍";
        return `Logged ✅ ${res.actions.map((a) => a.code).join(", ")}. I'll check the results when your next reports land (about a week).`;
      } catch {
        return "I don't have fixes with those codes yet. Text “brief” for today's.";
      }
    }
    case "ask": {
      if (brainOn()) {
        if (!(await spend(store, ws, "ask"))) return LIMIT_MSG.ask; // same 40/day as the dashboard (text + Slack)
        const answer = await askRocco({ question: text, context: await teamContext(store, ws, now) });
        if (answer) return answer;
      }
      const kinds = TOPIC_KIND[cmd.topic];
      const snaps = (await Promise.all(kinds.map((k) => store.listSnapshots(ws.id, { kind: k, limit: 1 })))).flat();
      if (!snaps.length) return `I don't have ${cmd.topic === "general" ? "any" : cmd.topic} numbers yet. Connect your Amazon on your Rocco page and I'll know everything by tomorrow.`;
      const L: string[] = [];
      for (const s of snaps.slice(0, 2)) {
        L.push(`${s.headline} (as of ${s.createdAt.slice(0, 10)})`);
        for (const f of (s.extra?.findings ?? []).filter((x) => x.severity !== "win").slice(0, 2)) L.push(`• ${f.title}`);
      }
      L.push("Want the fixes? Text “brief”. For deeper digging, open your Rocco and tap Ask.");
      return bubbles(L.join("\n"));
    }
  }
}
