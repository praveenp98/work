"use client";
import { useState } from "react";
import { TrialSheet } from "@/components/dash/TrialSheet";

/** Ask rocco.works for a checkout tagged with this browser's team (only on a real tap) and go there. */
export async function startHire(email?: string): Promise<void> {
  const d = (await fetch("/api/hire", { method: "POST", headers: { "content-type": "application/json", "x-rocco-tap": "1" }, body: JSON.stringify({ email }) }).then((r) => r.json()).catch(() => null)) as { url?: string } | null;
  window.location.href = d?.url || "/pricing";
}

/**
 * The main action: "Hire Rocco". Opens the sheet: work email (the account) → checkout (prefilled, tagged with
 * the team) → back to their Rocco page to set up. `direct` is kept for compatibility (same flow).
 */
export function HireButton({ price, next, label = "Hire Rocco", className = "btn hire-cta", direct }: { price: string; next?: string; label?: string; className?: string; direct?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async (email?: string) => { setBusy(true); await startHire(email); };
  return (
    <>
      <button className={className} disabled={busy} onClick={() => setOpen(true)}>{busy ? "Opening checkout…" : label}</button>
      <TrialSheet price={price} next={next} open={open} onStart={go} onClose={() => setOpen(false)} />
    </>
  );
}
