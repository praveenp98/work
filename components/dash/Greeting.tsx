"use client";
import { useEffect, useState } from "react";

/** "Good morning / afternoon / evening" in the viewer's own time (the server runs on UTC). */
export function Greeting({ className }: { className?: string }) {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => setH(new Date().getHours()), []);
  const word = h === null ? "Hello" : h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return <span className={className} suppressHydrationWarning>{word}</span>;
}
