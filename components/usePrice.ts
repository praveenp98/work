"use client";
import { useEffect, useState } from "react";
import { PLAN } from "@/lib/pricing";

/** Yearly price in dollars. */
export function usePrice(): number {
  const [p, setP] = useState(PLAN.annualCents / 100);
  useEffect(() => {
    fetch("/api/price").then((r) => r.json()).then((s) => { if (s?.priceCents) setP(Math.round(s.priceCents / 100)); }).catch(() => {});
  }, []);
  return p;
}
