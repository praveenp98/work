"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const DemoApp = dynamic(() => import("@/components/demo/DemoApp").then((m) => m.DemoApp), { ssr: false, loading: () => <p className="fine" style={{ padding: 24 }}>Opening the demo account…</p> });

/** "Try it right here": the full clickable demo account in a panel, no sign-up, no page change. */
export function TryDemo({ label = "Try it right here", className = "btn ghost" }: { label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  // Clicking Rocco in the hero opens the demo (only the first TryDemo on the page listens).
  useEffect(() => {
    const k = () => { if (document.querySelector(".td")) return; setOpen(true); track("demo_tour_started", { where: "rocco_click" }); };
    window.addEventListener("rocco:try", k);
    return () => window.removeEventListener("rocco:try", k);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button className={className} onClick={() => { setOpen(true); track("demo_tour_started", { where: "home_panel" }); }}>{label}</button>
      {open && (
        <div className="td" role="dialog" aria-modal="true" aria-label="Rocco demo account" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="td-box">
            <div className="td-h"><b>Demo account · click anything</b><button className="linkbtn" onClick={() => setOpen(false)} aria-label="Close">Close ✕</button></div>
            <div className="td-body"><DemoApp /></div>
          </div>
        </div>
      )}
    </>
  );
}
