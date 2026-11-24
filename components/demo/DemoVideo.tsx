"use client";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/** "▶ Watch the 2-minute demo": opens the recorded tour (public/demo/rocco-demo.mp4) in a lightbox. */
export function DemoVideo({ label = "▶ Watch the 2-minute demo", className = "btn ghost" }: { label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      <button type="button" className={className} onClick={() => { setOpen(true); track("demo_video_opened"); }}>{label}</button>
      {open && (
        <div className="dv" role="dialog" aria-modal="true" aria-label="Rocco demo video" onClick={() => setOpen(false)}>
          <div className="dv-box" onClick={(e) => e.stopPropagation()}>
            <video ref={v} src="/demo/rocco-demo.mp4" poster="/demo/rocco-demo.jpg" controls autoPlay playsInline onEnded={() => track("demo_video_finished")} />
            <button type="button" className="dv-x" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}
