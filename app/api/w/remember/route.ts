import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { seal } from "@/lib/vault";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Opening your Rocco page remembers the team in this browser (sealed, httpOnly cookie), so when Claude/ChatGPT
 * opens Rocco's Connect page (OAuth), it can connect to this same Rocco instead of creating a new one.
 */
export const TEAM_COOKIE = "rocco_team";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const sealed = ws ? seal(b.t!) : undefined;
  if (!ws || !sealed) return NextResponse.json({ ok: false }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TEAM_COOKIE, sealed, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 180 * 86_400 });
  return res;
}
