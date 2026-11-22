import { after, NextResponse } from "next/server";
import { pullAndSave, tellTeam } from "@/lib/datadoe-sync";
import { getStore } from "@/lib/store";

/** One batch of the daily pull (≤ 8 accounts), started by /api/cron/amazon. Answers at once, works after the response. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false }, { status: 503 });
  const store = getStore();
  const b = (await req.json().catch(() => ({}))) as { jobs?: { wsId: string; id: string; name: string }[]; delaySec?: number };
  const jobs = (b.jobs ?? []).slice(0, 8);
  if (!store || !jobs.length) return NextResponse.json({ ok: false }, { status: 400 });
  after(async () => {
    await new Promise((r) => setTimeout(r, Math.min(Math.max(b.delaySec ?? 0, 0), 240) * 1000));
    for (const j of jobs) {
      const r = await pullAndSave(store, j.wsId, { id: j.id, name: j.name }).catch(() => null);
      const ws = r ? await store.getWorkspaceById(j.wsId) : null;
      if (r && ws) await tellTeam(store, ws, r).catch(() => {});
    }
  });
  return NextResponse.json({ ok: true, accepted: jobs.length }, { status: 202 });
}
