"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingText } from "@/components/LoadingText";

const STEPS = ["Asking Amazon for this account's change history…", "Matching changes to your campaigns…", "Counting what was changed by hand and by rules…", "Writing my read of how the account was run…"];

/** One-time "Before Rocco" read for an account connected before it ran on its own. */
export function HistoryButton({ token, account }: { token: string; account: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/w/history", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, account }) }).then((x) => x.json()).catch(() => ({ ok: false, error: "No connection. Check your internet and try again." }));
    if (r.ok) router.refresh(); else { setErr(r.error || "Something went wrong. Try again in a minute."); setBusy(false); }
  };
  if (busy) return <LoadingText steps={STEPS} every={4000} />;
  return (
    <div>
      <button type="button" className="btn" onClick={go}>Read my account&apos;s history →</button>
      {err && <p className="log-err" role="alert">{err}</p>}
    </div>
  );
}
