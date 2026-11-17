"use client";
import { useEffect, useState } from "react";
import { LADDER } from "@/lib/pricing";

/** Current founding price in dollars (falls back to the ladder start). */
export function usePrice(): number {
  const [p, setP] = useState(LADDER.startCents / 100);
  useEffect(() => {
    fetch("/api/price").then((r) => r.json()).then((s) => { if (s?.priceCents) setP(Math.round(s.priceCents / 100)); }).catch(() => {});
  }, []);
  return p;
}
