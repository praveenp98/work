"use client";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";

type R = { cadence: "daily" | "weekly" | "off"; channel?: "imessage" | "whatsapp" | "slack"; approveByText: boolean };
const CH = { imessage: "iMessage", whatsapp: "WhatsApp", slack: "Slack" } as const;

/**
 * After payment: how Rocco nudges the team. Daily or weekly, on iMessage / WhatsApp (LoopMessage) or Slack.
 * "Approve right in the message" unlocks once they've looked at their jobs here at least once.
 */
export function ReminderCard({ token, initial, seen, slackOn }: { token: string; initial: R | null; seen: boolean; slackOn: boolean }) {
  const [r, setR] = useState<R>(initial ?? { cadence: "daily", channel: "imessage", approveByText: false });
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true); setMsg("");
    const d = (await fetch("/api/w/reminders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, ...r }) }).then((x) => x.json()).catch(() => null)) as { ok?: boolean; error?: string; reminders?: R } | null;
    if (!d?.ok) { setBusy(false); setMsg(d?.error ?? "Couldn't save that. Try again."); return; }
    if (r.cadence === "off" || !r.channel) { setBusy(false); setEditing(false); return; }
    if (r.channel === "slack") { window.location.href = `/api/slack/install?t=${encodeURIComponent(token)}`; return; }
    const l = (await fetch("/api/text/start", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: JSON.stringify({ t: token, channel: r.channel }) }).then((x) => x.json()).catch(() => null)) as { url?: string } | null;
    if (l?.url) { window.location.href = l.url; return; }
    setBusy(false); setEditing(false);
    setMsg(`Saved. ${CH[r.channel]} messages aren't switched on yet on my side: I'll start the moment they are.`);
  }

  if (!editing) {
    return (
      <section className="rd-card rm-mini">
        <p>🔔 {r.cadence === "off" ? "No reminders" : `${r.cadence === "daily" ? "Every morning" : "Mondays"} on ${CH[r.channel ?? "imessage"]}`}{r.cadence !== "off" && r.approveByText ? " · approve by text" : ""}</p>
        <button className="linkbtn" onClick={() => setEditing(true)}>Change</button>
        {msg && <p className="fine">{msg}</p>}
      </section>
    );
  }
  return (
    <section className="rd-card rm">
      <h3>Nudge me when there&apos;s work</h3>
      <div className="rm-row" role="radiogroup" aria-label="How often">
        {([["daily", "Every morning"], ["weekly", "Mondays"], ["off", "No reminders"]] as const).map(([v, l]) => (
          <button key={v} role="radio" aria-checked={r.cadence === v} className={`rm-chip${r.cadence === v ? " on" : ""}`} onClick={() => setR({ ...r, cadence: v })}>{l}</button>
        ))}
      </div>
      {r.cadence !== "off" && (
        <>
          <div className="rm-row" role="radiogroup" aria-label="Where">
            {(["imessage", "whatsapp", ...(slackOn ? ["slack"] : [])] as const).map((c) => (
              <button key={c} role="radio" aria-checked={r.channel === c} className={`rm-chip${r.channel === c ? " on" : ""}`} onClick={() => setR({ ...r, channel: c as R["channel"] })}>{c === "imessage" ? "💬 " : c === "whatsapp" ? "🟢 " : "#️⃣ "}{CH[c as keyof typeof CH]}</button>
            ))}
          </div>
          <label className={`rm-approve${seen ? "" : " rm-locked"}`}>
            <input type="checkbox" disabled={!seen} checked={r.approveByText && seen} onChange={(e) => setR({ ...r, approveByText: e.target.checked })} />
            <span><b>Let me approve fixes right in the message</b><small>{seen ? "Reply YES and I make the change in Amazon. Every change is still logged and undoable." : "Unlocks after you've gone through today's work here once."}</small></span>
          </label>
        </>
      )}
      <button className="btn small" disabled={busy} onClick={save}>{busy ? "Saving…" : r.cadence === "off" ? "Save" : r.channel === "slack" ? "Save & add to Slack" : `Save & connect ${CH[r.channel ?? "imessage"]}`}</button>
      {busy && r.cadence !== "off" && <LoadingText steps={["Saving how you like to be nudged…", r.channel === "slack" ? "Opening Slack…" : `Creating your private ${CH[r.channel ?? "imessage"]} link…`, "Send the first message and you're set"]} every={1400} />}
      {msg && <p className="err">{msg}</p>}
    </section>
  );
}
