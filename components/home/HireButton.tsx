"use client";
import { useState } from "react";
import { TrialSheet } from "@/components/dash/TrialSheet";

/** Ask rocco.works for a checkout tagged with this browser's team (only on a real tap) and go there. */
export async function startHire(): Promise<void> {
  const d = (await fetch("/api/hire", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: "{}" }).then((r) => r.json()).catch(() => null)) as { url?: string } | null;
  window.location.href = d?.url || "/pricing";
}

/**
 * The homepage's main action: "Hire Rocco". Opens the trial sheet (price, what's included, cancel anytime);
 * starting goes to checkout. `direct` skips the sheet (pricing page).
 */
export function HireButton({ price, label = "Hire Rocco", className = "btn hire-cta", direct }: { price: string; label?: string; className?: string; direct?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); await startHire(); };
  return (
    <>
      <button className={className} disabled={busy} onClick={() => (direct ? go() : setOpen(true))}>{busy ? "Opening checkout…" : label}</button>
      {!direct && <TrialSheet price={price} open={open} onStart={go} onClose={() => setOpen(false)} />}
    </>
  );
}
