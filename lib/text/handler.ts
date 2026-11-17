import { REPORT_HELP, type ReportKind } from "../analyze";
import { benchmark } from "../rules/benchmarks";
import type { Store } from "../store/types";
import { buildBrief, DEFAULT_BRAND, expandCodes, FREE_PROPOSALS, latestRuns, queuePending } from "../workspace";
import { maskPhone, normPhone, parseCommand } from "./commands";
import { dailyNumbers } from "./daily";

const SETUP = "rocco.works/setup";
const HELP = [
  "Text me anytime 🦝",
  "• numbers → today's numbers",
  "• brief → what to do today",
  "• YES N1 N2 → approve fixes",
  "• undo B3 → queue an undo",
  "• wins → what I've saved you",
  "• ask anything: “how's stock?”, “why is ACoS up?”",
  "• STOP → pause texts",
].join("\n");

const TOPIC_KIND: Record<string, ReportKind[]> = {
  ads: ["sp_search_term"], budgets: ["sp_campaign"], placements: ["sp_placement"], stock: ["inventory"], listings: ["business_report"],
  general: ["sp_search_term", "sp_campaign", "inventory", "business_report"],
};

/** Handle one inbound text and return Rocco's reply. */
export async function handleInbound(store: Store, from: string, text: string, now = new Date()): Promise<string> {
  const phone = normPhone(from);
  const cmd = parseCommand(text);

  if (cmd.kind === "link") {
    const ws = await store.findWorkspaceByLinkCode(cmd.code);
    if (!ws) return `Hmm, ${cmd.code} isn't a Rocco code I know. Your code is on your Rocco dashboard (${SETUP} → your workspace).`;
    const existing = await store.getPhone(phone);
    await store.savePhone({ phone, workspaceId: ws.id, optedOut: false, createdAt: existing?.createdAt ?? now.toISOString(), lastSeenAt: now.toISOString() });
    const team = (await store.listPhones({ workspaceId: ws.id })).length;
    return `You're in 🦝 Linked to your team's Rocco${team > 1 ? ` (${team} teammates on this line)` : ""}. I'll text your numbers every morning.\n\n${HELP}`;
  }

  const p = await store.getPhone(phone);
  if (!p) {
    return "Hey, I'm Rocco 🦝 your team's AI Amazon teammate. I text you the numbers every morning and you approve fixes with a reply.\n\nAlready set up? Text “link” + your 6-letter code from your Rocco dashboard.\nNew? Start here (3 min): " + SETUP;
  }
  const ws = await store.getWorkspaceById(p.workspaceId);
  if (!ws) return "I lost track of your workspace. Text “link” + your code from your Rocco dashboard.";
  await store.savePhone({ ...p, lastSeenAt: now.toISOString(), optedOut: cmd.kind === "stop" ? true : cmd.kind === "start" ? false : p.optedOut });

  switch (cmd.kind) {
    case "stop": return "Paused. I won't text you unless you text me. Text START to resume.";
    case "start": return "Back on 🦝 Morning numbers resume tomorrow.";
    case "help": return HELP;
    case "numbers": {
      const b = await buildBrief(store, ws, now);
      const snap = b.perBrand[0]?.trends.find((t) => t.kind === "sp_search_term")?.latest;
      const bench = snap ? benchmark("sp_search_term", snap.stats, await store.peerStats("sp_search_term", ws.id)) : null;
      return dailyNumbers(b, { now, bench: bench?.lines, pending: ws.pending });
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
      return L.join("\n");
    }
    case "wins": {
      const b = await buildBrief(store, ws, now);
      if (!b.totals.applied) return "No changes logged yet. Approve a few fixes and I'll start keeping score 🏆";
      const top = b.recentResults.filter((a) => a.status === "worked").slice(0, 3).map((a) => `• ${a.code}: ${a.result!.summary.slice(0, 100)}`);
      return [`🏆 ${b.totals.worked}/${b.totals.applied} changes worked${b.saved ? `, about $${Math.round(b.saved).toLocaleString("en-US")} saved` : ""}.`, ...top].join("\n");
    }
    case "approve":
    case "undo": {
      const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
      const wanted = expandCodes(cmd.codes);
      if (cmd.kind === "undo") {
        await queuePending(store, ws, { type: "undo", codes: wanted, brand, at: now.toISOString(), by: maskPhone(phone) });
        return `Queued undo for ${wanted.join(", ")} ↩️ Your AI will reverse it next time someone opens Rocco in Claude/ChatGPT.`;
      }
      const runs = await latestRuns(store, ws, brand);
      const allowed = new Map<string, boolean>();
      for (const r of runs) r.proposals.forEach((pp, i) => allowed.set(pp.code, ws.licensed || i < FREE_PROPOSALS));
      const ok = wanted.filter((c) => allowed.get(c));
      const locked = wanted.filter((c) => allowed.get(c) === false);
      const unknown = wanted.filter((c) => !allowed.has(c));
      if (ok.length) await queuePending(store, ws, { type: "apply", codes: ok, brand, at: now.toISOString(), by: maskPhone(phone) });
      const L: string[] = [];
      if (ok.length) L.push(`Approved ✅ ${ok.join(", ")}. Your AI applies ${ok.length === 1 ? "it" : "them"} through Amazon's connector next time anyone on the team opens Rocco, then I'll track the results.`);
      if (locked.length) L.push(`🔒 ${locked.join(", ")} need Founding Lifetime: rocco.works/pricing`);
      if (unknown.length) L.push(`🤔 Don't recognize ${unknown.join(", ")}. Text “brief” for today's codes.`);
      return L.join("\n");
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
      return L.join("\n");
    }
  }
}
