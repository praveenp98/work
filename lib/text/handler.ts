import { REPORT_HELP, type ReportKind } from "../analyze";
import { benchmark } from "../rules/benchmarks";
import type { Store } from "../store/types";
import { buildBrief, createWorkspace, DEFAULT_BRAND, ensureLinkCode, expandCodes, FREE_PROPOSALS, latestRuns, queuePending, rememberToken, revealToken } from "../workspace";
import type { Workspace } from "../store/types";
import { maskPhone, normPhone, parseCommand } from "./commands";
import { dailyNumbers } from "./daily";
import { optInLinks } from "./provider";
import { demoMorning } from "../demo";

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
  const l = await optInLinks({ link: code, body: "Hi Rocco 👋 I'm joining my team [opt-in-code]" });
  const url = l?.url ?? l?.imessage;
  return url
    ? { bubbles: ["Send this to a teammate. One tap and they're on your Rocco 👇", url] }
    : { bubbles: [`Have your teammate text me: join ${code}`] };
}

const HELP = [
  "Text me anytime 🦝",
  "• numbers → today's numbers",
  "• brief → what to do today",
  "• YES N1 N2 → approve fixes",
  "• undo B3 → undo a change",
  "• wins → what I've saved you",
  "• invite → add a teammate",
  "• demo → see a sample brand",
  "• link → your Rocco page",
  "• STOP → pause texts",
].join("\n");

const TOPIC_KIND: Record<string, ReportKind[]> = {
  ads: ["sp_search_term"], budgets: ["sp_campaign"], placements: ["sp_placement"], stock: ["inventory"], listings: ["business_report"],
  general: ["sp_search_term", "sp_campaign", "inventory", "business_report"],
};

/** Rocco's reply: one or more iMessage bubbles, optionally followed by his contact card. */
export interface Reply { bubbles: string[]; card?: boolean }

/** Handle one inbound text and return Rocco's reply as a single string (tests, dry runs). */
export async function handleInbound(store: Store, from: string, text: string, now = new Date()): Promise<string> {
  return (await respond(store, from, text, now)).bubbles.join("\n\n");
}

const bubbles = (s: string): Reply => ({ bubbles: [s] });

export async function respond(store: Store, from: string, text: string, now = new Date()): Promise<Reply> {
  const r = await core(store, from, text, now);
  return typeof r === "string" ? bubbles(r) : r;
}

async function core(store: Store, from: string, text: string, now: Date): Promise<string | Reply> {
  const phone = normPhone(from);
  const cmd = parseCommand(text);

  if (cmd.kind === "link") {
    const ws = await store.findWorkspaceByLinkCode(cmd.code);
    if (!ws) return `Hmm, ${cmd.code} isn't a team code I know. Ask your teammate to text me “invite” and send you the link.`;
    const existing = await store.getPhone(phone);
    await store.savePhone({ phone, workspaceId: ws.id, optedOut: false, createdAt: existing?.createdAt ?? now.toISOString(), lastSeenAt: now.toISOString() });
    const team = (await store.listPhones({ workspaceId: ws.id })).length;
    return bubbles(`You're in 🦝 You're on your team's Rocco${team > 1 ? ` (${team} teammates now)` : ""}. I'll text the numbers every morning. Text “help” anytime.`);
  }

  let p = await store.getPhone(phone);
  if (!p) {
    if (cmd.kind === "stop") return "Okay, I won't text you. Text me anytime if you change your mind.";
    // First text from a new number: they get their own Rocco right away (Boardy-style: no wall, one question).
    const { token, ws } = await createWorkspace(store);
    await rememberToken(store, ws, token);
    await ensureLinkCode(store, ws);
    await store.savePhone({ phone, workspaceId: ws.id, optedOut: false, createdAt: now.toISOString(), lastSeenAt: now.toISOString(), stage: "intro" });
    return {
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

  if (p.stage === "intro" && cmd.kind === "ask") {
    ws.about = text.trim().slice(0, 500);
    await store.saveWorkspace(ws);
    const name = firstName(text);
    const demo = await demoMorning(now);
    return {
      bubbles: [
        `${name ? `Nice to meet you, ${name}` : "Love it"} 🦝 Here's what your mornings look like with me. This is a sample brand:`,
        demo.text,
        "Ready for your own numbers? Plug in Amazon here, one step at a time 👇",
        homeUrl(revealToken(ws)),
      ],
    };
  }


  switch (cmd.kind) {
    case "stop": return bubbles("Paused. I won't text you unless you text me. Text START to resume.");
    case "start": return bubbles("Back on 🦝 Morning numbers resume tomorrow.");
    case "help": return bubbles(HELP);
    case "dashboard": return { bubbles: ["Your Rocco page 👇 (private to your team)", homeUrl(revealToken(ws))] };
    case "invite": return inviteReply(store, ws);
    case "demo": {
      const d = await demoMorning(now);
      return { bubbles: [d.text, `Try it: reply YES ${d.codes.slice(0, 2).join(" ")} (demo, nothing changes).`] };
    }
    case "numbers": {
      const b = await buildBrief(store, ws, now);
      if (!b.perBrand.some((x) => x.trends.length)) return { bubbles: ["No Amazon numbers yet 🦝 Plug Amazon in here (3 min), and I'll text them every morning 👇", homeUrl(revealToken(ws)), "Want a preview? Text “demo”."] };
      const snap = b.perBrand[0]?.trends.find((t) => t.kind === "sp_search_term")?.latest;
      const bench = snap ? benchmark("sp_search_term", snap.stats, await store.peerStats("sp_search_term", ws.id)) : null;
      return bubbles(dailyNumbers(b, { now, bench: bench?.lines, pending: ws.pending }));
    }
    case "brief": {
      const b = await buildBrief(store, ws, now);
      const pb = b.perBrand[0];
      const L = ["📝 Today:"];
      if (b.due.length) L.push(`• ${b.due.length} change${b.due.length === 1 ? "" : "s"} ready to grade. Say “did last week's changes work?” in Claude/ChatGPT.`);
      const open = pb ? [...pb.open].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3) : [];
      for (const o of open) L.push(`• ${o.code}: ${o.reason.slice(0, 90)}`);
      if (open.length) L.push(`Reply YES ${open.map((o) => o.code).join(" ")} to approve.`);
      if (pb?.stale.length) L.push(`• Not checked in 7+ days: ${pb.stale.map((k) => REPORT_HELP[k].name.replace("Sponsored Products ", "")).join(", ")}.`);
      if (L.length === 1) L.push("• All clear. Say “Rocco, morning check” in Claude/ChatGPT for fresh numbers.");
      return bubbles(L.join("\n"));
    }
    case "wins": {
      const b = await buildBrief(store, ws, now);
      if (!b.totals.applied) return "No changes logged yet. Approve a few fixes and I'll start keeping score 🏆";
      const top = b.recentResults.filter((a) => a.status === "worked").slice(0, 3).map((a) => `• ${a.code}: ${a.result!.summary.slice(0, 100)}`);
      return bubbles([`🏆 ${b.totals.worked}/${b.totals.applied} changes worked${b.saved ? `, about $${Math.round(b.saved).toLocaleString("en-US")} saved` : ""}.`, ...top].join("\n"));
    }
    case "approve":
    case "undo": {
      const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
      const wanted = expandCodes(cmd.codes);
      if (cmd.kind === "undo") {
        await queuePending(store, ws, { type: "undo", codes: wanted, brand, at: now.toISOString(), by: maskPhone(phone) });
        return bubbles(`Queued undo for ${wanted.join(", ")} ↩️ Your AI will reverse it next time someone opens Rocco in Claude/ChatGPT.`);
      }
      const runs = await latestRuns(store, ws, brand);
      if (!runs.length) return { bubbles: [`That's the move ✅ On your account I'd queue ${wanted.join(", ")}, your AI applies it through Amazon's connector, and I check next week if it worked.`, "Plug in Amazon to do it for real 👇", homeUrl(revealToken(ws))] };
      const allowed = new Map<string, boolean>();
      for (const r of runs) r.proposals.forEach((pp, i) => allowed.set(pp.code, ws.licensed || i < FREE_PROPOSALS));
      const ok = wanted.filter((c) => allowed.get(c));
      const locked = wanted.filter((c) => allowed.get(c) === false);
      const unknown = wanted.filter((c) => !allowed.has(c));
      if (ok.length) await queuePending(store, ws, { type: "apply", codes: ok, brand, at: now.toISOString(), by: maskPhone(phone) });
      const L: string[] = [];
      if (ok.length) L.push(`Approved ✅ ${ok.join(", ")}. Your AI applies ${ok.length === 1 ? "it" : "them"} through Amazon's connector next time anyone on the team opens Rocco, then I'll track the results.`);
      if (locked.length) L.push(`🔒 ${locked.join(", ")} need you to hire me ($99 once): rocco.works/pricing`);
      if (unknown.length) L.push(`🤔 Don't recognize ${unknown.join(", ")}. Text “brief” for today's codes.`);
      return bubbles(L.join("\n"));
    }
    case "ask": {
      const kinds = TOPIC_KIND[cmd.topic];
      const snaps = (await Promise.all(kinds.map((k) => store.listSnapshots(ws.id, { kind: k, limit: 1 })))).flat();
      if (!snaps.length) return `I don't have ${cmd.topic === "general" ? "any" : cmd.topic} numbers yet. In Claude/ChatGPT say “Rocco, morning check” and I'll know everything by tomorrow.`;
      const L: string[] = [];
      for (const s of snaps.slice(0, 2)) {
        L.push(`${s.headline} (as of ${s.createdAt.slice(0, 10)})`);
        for (const f of (s.extra?.findings ?? []).filter((x) => x.severity !== "win").slice(0, 2)) L.push(`• ${f.title}`);
      }
      L.push("Want the fixes? Text “brief”. For deeper digging, ask me in Claude/ChatGPT.");
      return bubbles(L.join("\n"));
    }
  }
}
