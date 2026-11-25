"use client";
import { useState } from "react";

/** Owner-only "Delete my Rocco", typed confirmation; signs out and goes home when done. */
export function DeleteRocco({ token, blocked }: { token: string; blocked: string | null }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    const r = await fetch("/api/w/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, op: "delete", confirm: text }) }).then((x) => x.json()).catch(() => ({ ok: false, error: "Network hiccup. Try again." }));
    if (!r.ok) { setErr(r.error ?? "Couldn't delete it."); setBusy(false); return; }
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => null);
    location.href = "/?deleted=1";
  }
  if (!open) return <button className="btn ghost small danger-btn" onClick={() => setOpen(true)}>Delete my Rocco…</button>;
  return (
    <div className="acc-del">
      <p><b>This closes your Rocco for good.</b> Rocco stops checking your Amazon accounts and stops texting your team, your teammates lose access, and your private link stops working. Changes already made in Amazon stay as they are. We erase the stored data within 30 days.</p>
      {blocked ? <p className="err">{blocked}</p> : (
        <>
          <label>Type <b>DELETE</b> to confirm <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" /></label>
          <div className="acc-row">
            <button className="btn small danger-btn" disabled={busy || text.trim().toUpperCase() !== "DELETE"} onClick={go}>{busy ? "Deleting…" : "Delete my Rocco"}</button>
            <button className="linkbtn" onClick={() => setOpen(false)}>Keep it</button>
          </div>
        </>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
