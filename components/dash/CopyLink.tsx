"use client";
import { useState } from "react";

export function CopyLink({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn ghost small" onClick={async () => {
      try { await navigator.clipboard.writeText(value); } catch { window.prompt("Copy this:", value); }
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }}>{done ? "Copied ✓" : label}</button>
  );
}
