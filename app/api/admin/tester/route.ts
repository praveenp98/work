import { NextResponse } from "next/server";
import { adminOk } from "@/lib/security";
import { getStore } from "@/lib/store";
import { createWorkspace, ensureLinkCode, rememberToken } from "@/lib/workspace";

/**
 * Founder testing: free access without paying (Dodo isn't touched, so it never counts as a hire or revenue).
 * Protected by CRON_SECRET.
 *   GET /api/admin/tester?key=CRON_SECRET&email=you@gmail.com            → give your existing Rocco 30 days of access
 *   GET /api/admin/tester?key=CRON_SECRET&email=you@gmail.com&fresh=1    → archive your old Rocco(s), start a brand-new one
 * Then: Sign out on rocco.works, Sign in with Google with that email → Connect Amazon → first pull → dashboard.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (!adminOk(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const store = getStore();
  const email = (q.get("email") ?? "").trim().toLowerCase();
  if (!store || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
  const now = new Date();
  const until = new Date(now.getTime() + 30 * 86_400_000).toISOString();
  const grant = <T extends { licensed?: boolean; paidUntil?: string; comp?: string; hiredAt?: string; plan?: "annual" | "monthly" }>(ws: T) => {
    ws.licensed = true; ws.paidUntil = until; ws.comp = `founder test ${now.toISOString().slice(0, 10)}`; ws.hiredAt = now.toISOString(); ws.plan = "annual"; (ws as { ownerVerified?: boolean }).ownerVerified = true;
  };

  const old = await store.findWorkspacesByOwner(email);
  if (q.get("fresh") !== "1" && old[0]) {
    grant(old[0]);
    await store.saveWorkspace(old[0]);
    return NextResponse.json({ ok: true, mode: "existing", accessUntil: until, next: "Open https://rocco.works/me" });
  }
  // Fresh: old teams keep their data but no longer belong to this email (sign-in won't find them).
  for (const ws of old) { ws.ownerEmail = `archived-${now.getTime()}+${email}`; await store.saveWorkspace(ws); }
  const c = await createWorkspace(store);
  c.ws.ownerEmail = email;
  grant(c.ws);
  await store.saveWorkspace(c.ws);
  await rememberToken(store, c.ws, c.token);
  await ensureLinkCode(store, c.ws);
  return NextResponse.json({ ok: true, mode: "fresh", archived: old.length, accessUntil: until, next: "Sign out on rocco.works, then Sign in with Google with this email. You'll land on Connect Amazon." });
}
