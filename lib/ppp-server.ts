import { headers } from "next/headers";
import { localPrices, NAMES, type LocalPrice } from "./ppp";

export interface Where { country: string; name: string; local: LocalPrice | null }

/** The visitor's country (Vercel geo header) and, if known, the local price checkout will show. */
export async function visitorPricing(): Promise<Where | null> {
  const cc = ((await headers()).get("x-vercel-ip-country") ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) || cc === "US") return null;
  return { country: cc, name: NAMES[cc] ?? cc, local: localPrices()[cc] ?? null };
}

