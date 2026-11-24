"use client";
import { useRouter } from "next/navigation";
import { officeAct } from "@/lib/client/office";
import { useState } from "react";
import { track } from "@/lib/analytics";

/** Change log: put a bid or budget back in Amazon (lib/undo.ts). */
export function UndoButton({ token, id, what }: { token: string; id: string; what: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (!confirm(`Undo in Amazon: ${what}?`)) return;
    setBusy(true); setErr("");
    const d = await fetch("/api/w/undo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, id }) }).then((r) => r.json()).catch(() => ({ ok: false, error: "No connection. Try again." }));
    setBusy(false);
    if (d.ok) { track("change_undone", { auto: false }); officeAct("dock", `Undid ${what} in Amazon`); router.refresh(); } else setErr(d.error ?? "Try again.");
  }
  return (
    <span className="undo">
      <button className="linkbtn" disabled={busy} onClick={go}>{busy ? "Undoing in Amazon…" : "↩ Undo"}</button>
      {err && <span className="err" role="alert"> {err}</span>}
    </span>
  );
}
