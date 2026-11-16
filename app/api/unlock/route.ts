import { NextResponse } from "next/server";
import { validatePolarKey } from "@/lib/polar";

/** Validate a Polar license key for the paid unlock on the website. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const v = await validatePolarKey(String(body?.key ?? ""));
  return NextResponse.json({ ok: v.ok, error: v.error }, { status: v.status });
}
