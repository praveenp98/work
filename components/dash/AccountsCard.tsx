"use client";
import { useState } from "react";

/**
 * Amazon accounts on this plan: which are connected, how many slots are used (3 included, +$49/mo each extra),
 * add one, or remove one (owner). Removing keeps the history; the slot frees after 30 days unless it was connected
 * in the last 24 hours (wrong account).
 */
interface Acc { id: string; name: string; country: string }
interface Slots { used: number; limit: number; canAdd: boolean; held: number; nextFree?: string }

export function AccountsCard({ token, accounts: a0, slots: s0, owner, extraUrl }: { token: string; accounts: Acc[]; slots: Slots; owner: boolean; extraUrl: string | null }) {
  const [accounts, setAccounts] = useState(a0);
  const [slots, setSlots] = useState(s0);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const post = (body: object) => fetch("/api/w/amazon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, ...body }) }).then((r) => r.json()).catch(() => null);

  async function add() {
    setBusy("add"); setMsg(null);
    const d = await post({});
    if (d?.url) { window.location.href = d.url; return; }
    setBusy(""); setMsg({ ok: false, text: d?.error ?? "Couldn't open Amazon. Try again." });
  }
  async function remove(a: Acc) {
    if (!window.confirm(`Remove ${a.name} (${a.country}) from Rocco? I stop reading it and stop suggesting fixes. Its change log stays. Accounts removed more than a day after connecting keep their slot for 30 days.`)) return;
    setBusy(a.id); setMsg(null);
    const d = await post({ remove: a.id });
    setBusy("");
    if (!d?.ok) { setMsg({ ok: false, text: d?.error ?? "Couldn't remove it. Try again." }); return; }
    setAccounts((x) => x.filter((y) => y.id !== a.id));
    if (d.slots) setSlots(d.slots);
    setMsg({ ok: true, text: d.note });
  }

  return (
    <section className="rd-card tm">
      <h3>Amazon accounts</h3>
      <p className="fine" style={{ margin: 0 }}>{slots.used} of {slots.limit} in use{slots.held ? ` (${slots.held} freeing up${slots.nextFree ? ` ${new Date(slots.nextFree).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""})` : ""}. Each marketplace counts as one.</p>
      <ul className="tm-list">
        {accounts.map((a) => (
          <li key={a.id}>
            <span className="tm-av" aria-hidden>🛒</span>
            <div className="tm-who"><b>{a.name}</b><small>{a.country}</small></div>
            {owner ? <button className="linkbtn danger" disabled={!!busy} onClick={() => remove(a)}>{busy === a.id ? "Removing…" : "Remove"}</button> : <span />}
          </li>
        ))}
      </ul>
      {slots.canAdd
        ? <button className="btn small" disabled={!!busy} onClick={add}>{busy === "add" ? "Opening Amazon…" : "+ Connect another account"}</button>
        : extraUrl
          ? <a className="btn small" href={extraUrl}>Add an account · $49/mo</a>
          : <p className="fine">All {slots.limit} accounts in use. Need more? Email <a href="mailto:hello@rocco.works">hello@rocco.works</a>.</p>}
      {msg && <p className={msg.ok ? "tm-ok" : "tm-err"} role="status">{msg.text}</p>}
    </section>
  );
}
