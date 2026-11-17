import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { createWorkspace } from "@/lib/workspace";

/** Create a personal Rocco workspace. Returns the secret key used in the connector URL. */
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= 10) return NextResponse.json({ ok: false, error: "Too many workspaces from here. Try again later." }, { status: 429 });
  recent.set(ip, [...hits, now]);

  const store = getStore();
  if (!store) return NextResponse.json({ ok: false, error: "Rocco memory isn't switched on yet. Use the shared connector for now." }, { status: 503 });
  try {
    const { token } = await createWorkspace(store);
    return NextResponse.json({ ok: true, token, persistent: store.persistent });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[workspace] create failed:", msg);
    const hint = /\(40[13]\)/.test(msg) ? "Supabase rejected the key (use the secret / service_role key, not the publishable/anon key)."
      : /\(404\)|does not exist|relation/.test(msg) ? "Rocco's tables don't exist yet. Run supabase/setup.sql in the Supabase SQL Editor."
      : "Rocco's memory database didn't answer. Check rocco.works/api/health.";
    return NextResponse.json({ ok: false, error: hint }, { status: 502 });
  }
}
