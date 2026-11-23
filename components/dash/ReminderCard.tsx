"use client";
import { track } from "@/lib/analytics";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";

/**
 * How Rocco pings the team (after payment). Three questions, one screen:
 *  1. Where: iMessage / WhatsApp (LoopMessage) or Slack.
 *  2. How often: every morning there's work, or Mondays. No work = no message.
 *  3. What the message says: a one-line nudge to come look (default: people approve what they've seen and
 *     understood, and that happens on the site), the top 3 jobs, or approve-by-text (unlocks after they've
 *     reviewed their jobs on the site once).
 */
type Style = "nudge" | "top3" | "approve";
type R = { cadence: "daily" | "weekly" | "off"; channel?: "imessage" | "whatsapp" | "slack"; approveByText: boolean; style?: Style };
const CH = { imessage: "iMessage", whatsapp: "WhatsApp", slack: "Slack" } as const;
const STYLES: { id: Style; t: string; d: string; preview: string }[] = [
  { id: "nudge", t: "A nudge to come look", d: "One line: what's waiting and the biggest job. Recommended.", preview: "☀️ 4 jobs today, worth ~$1,240/mo. Biggest: block 6 searches wasting money. Review (2 min): rocco.works/…" },
  { id: "top3", t: "Today's top 3 jobs", d: "A headline for each, then the link.", preview: "☀️ 4 jobs today (~$1,240/mo):\n• Block 6 searches wasting money\n• New exact campaign: 3 proven searches\n• Raise 2 budgets on winners\nReview: rocco.works/…" },
  { id: "approve", t: "Approve by text", d: "The jobs with codes: reply YES and I make them in Amazon.", preview: "☀️ 4 jobs today:\n• N1+N2: Block 6 wasted searches\n• G3: Raise 2 budgets\nReply YES N1 N2 G3 and I make them in Amazon." },
];

export interface Sample { value: string; jobs: { title: string; codes: string[] }[] }

/** The message as it would go out today, built from this team's real jobs. */
function realPreview(style: Style, s: Sample): string {
  const n = s.jobs.length;
  const head = `☀️ ${n} job${n === 1 ? "" : "s"} today${s.value ? `, worth ~${s.value}/mo` : ""}`;
  const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  if (style === "top3") return `${head}:\n${s.jobs.slice(0, 3).map((j) => `• ${j.title}`).join("\n")}\nReview: rocco.works/…`;
  if (style === "approve") {
    const one = s.jobs.filter((j) => j.codes.length).slice(0, 3);
    if (!one.length) return `${head}. None can be approved by text today (they're steps for you). Review: rocco.works/…`;
    return `${head}:\n${one.map((j) => `• ${j.codes.slice(0, 3).join("+")}: ${j.title}`).join("\n")}\nReply YES ${one.flatMap((j) => j.codes.slice(0, 3)).join(" ")} and I make them in Amazon.`;
  }
  return `${head}. Biggest: ${low(s.jobs[0].title)}. Review (2 min): rocco.works/…`;
}

export function ReminderCard({ token, initial, seen, slackOn, title = "Nudge me when there's work", sample }: { token: string; initial: R | null; seen: boolean; slackOn: boolean; title?: string; sample?: Sample }) {
  const [r, setR] = useState<R>(() => ({ ...(initial ?? { cadence: "daily", channel: "imessage", approveByText: false }), style: initial?.style ?? (initial?.approveByText ? "approve" : "nudge") }));
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const style = r.style === "approve" && !seen ? "nudge" : (r.style ?? "nudge");

  async function save() {
    setBusy(true); setMsg(""); track("reminders_saved", { channel: r.cadence === "off" ? "none" : r.channel, cadence: r.cadence, style });
    const d = (await fetch("/api/w/reminders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, ...r, style, approveByText: style === "approve" }) }).then((x) => x.json()).catch(() => null)) as { ok?: boolean; error?: string; reminders?: R } | null;
    if (!d?.ok) { setBusy(false); setMsg(d?.error ?? "Couldn't save that. Try again."); return; }
    if (d.reminders) setR({ ...d.reminders, style });
    if (r.cadence === "off" || !r.channel) { setBusy(false); setEditing(false); return; }
    if (r.channel === "slack") { window.location.href = `/api/slack/install?t=${encodeURIComponent(token)}`; return; }
    const l = (await fetch("/api/text/start", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: JSON.stringify({ t: token, channel: r.channel }) }).then((x) => x.json()).catch(() => null)) as { url?: string } | null;
    if (l?.url) { window.location.href = l.url; return; }
    setBusy(false); setEditing(false);
    setMsg(`Saved. ${CH[r.channel]} messages aren't switched on yet on my side: I'll start the moment they are.`);
  }

  if (!editing) {
    const label = STYLES.find((s) => s.id === style)?.t.toLowerCase();
    return (
      <section className="rd-card rm-mini">
        <p>🔔 {r.cadence === "off" ? "No reminders" : `${r.cadence === "daily" ? "Mornings with work" : "Mondays"} on ${CH[r.channel ?? "imessage"]} · ${label}`}</p>
        <button className="linkbtn" onClick={() => setEditing(true)}>Change</button>
        {msg && <p className="fine">{msg}</p>}
      </section>
    );
  }
  return (
    <section className="rd-card rm">
      <h3>{title}</h3>
      <p className="rm-q">Where?</p>
      <div className="rm-row" role="radiogroup" aria-label="Where">
        {(["imessage", "whatsapp", ...(slackOn ? ["slack"] : [])] as const).map((c) => (
          <button key={c} role="radio" aria-checked={r.cadence !== "off" && r.channel === c} className={`rm-chip${r.cadence !== "off" && r.channel === c ? " on" : ""}`} onClick={() => setR({ ...r, channel: c as R["channel"], cadence: r.cadence === "off" ? "daily" : r.cadence })}>{c === "imessage" ? "💬 " : c === "whatsapp" ? "🟢 " : "#️⃣ "}{CH[c as keyof typeof CH]}</button>
        ))}
        <button role="radio" aria-checked={r.cadence === "off"} className={`rm-chip${r.cadence === "off" ? " on" : ""}`} onClick={() => setR({ ...r, cadence: "off" })}>No messages</button>
      </div>
      {r.cadence !== "off" && (
        <>
          <p className="rm-q">How often?</p>
          <div className="rm-row" role="radiogroup" aria-label="How often">
            {([["daily", "Mornings with work"], ["weekly", "Mondays"]] as const).map(([v, l]) => (
              <button key={v} role="radio" aria-checked={r.cadence === v} className={`rm-chip${r.cadence === v ? " on" : ""}`} onClick={() => setR({ ...r, cadence: v })}>{l}</button>
            ))}
          </div>
          <p className="rm-q">What should the message say?</p>
          <div className="rm-styles" role="radiogroup" aria-label="Message">
            {STYLES.map((s) => {
              const locked = s.id === "approve" && !seen;
              return (
                <button key={s.id} role="radio" aria-checked={style === s.id} disabled={locked} className={`rm-style${style === s.id ? " on" : ""}${locked ? " locked" : ""}`} onClick={() => setR({ ...r, style: s.id })}>
                  <b>{s.t}</b>
                  <small>{locked ? "Unlocks after you've reviewed today's work here once." : s.d}</small>
                </button>
              );
            })}
          </div>
          <p className="rm-preview" aria-label="Preview">{sample?.jobs.length ? realPreview(style, sample) : STYLES.find((s) => s.id === style)!.preview}</p>
          {!sample?.jobs.length && <p className="fine" style={{ margin: "-6px 0 0" }}>Example. Yours will use your real jobs.</p>}
          <p className="fine" style={{ margin: 0 }}>No work that day, no message. Stop anytime: reply STOP or change it here.</p>
        </>
      )}
      <button className="btn small" disabled={busy} onClick={save}>{busy ? "Saving…" : r.cadence === "off" ? "Save" : r.channel === "slack" ? "Save & add to Slack" : `Save & connect ${CH[r.channel ?? "imessage"]}`}</button>
      {busy && r.cadence !== "off" && <LoadingText steps={["Saving how you like to be pinged…", r.channel === "slack" ? "Opening Slack…" : `Creating your private ${CH[r.channel ?? "imessage"]} link…`, "Send the first message and you're set"]} every={1400} />}
      {msg && <p className="err">{msg}</p>}
    </section>
  );
}
