import { after, NextResponse } from "next/server";
import { secretOk } from "@/lib/security";
import { syncGroup, tellTeam } from "@/lib/datadoe-sync";
import { refreshManager } from "@/lib/manager";
import type { Priors } from "@/lib/memory";
import { getStore } from "@/lib/store";

/** One batch of the daily pull (≤ 10 accounts sharing one export per report), started by /api/cron/amazon. Answers at once, works after the response. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretOk(req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""), secret)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false }, { status: 503 });
  const store = getStore();
  const b = (await req.json().catch(() => ({}))) as { jobs?: { wsId: string; id: string; name: string }[]; delaySec?: number; priors?: Priors };
  const jobs = (b.jobs ?? []).slice(0, 10);
  if (!store || !jobs.length) return NextResponse.json({ ok: false }, { status: 400 });
  after(async () => {
    await new Promise((r) => setTimeout(r, Math.min(Math.max(b.delaySec ?? 0, 0), 60) * 1000));
    const results = await syncGroup(store, jobs).catch(() => new Map());
    // All accounts of the batch in parallel (one Claude call each), so the batch fits its 300s even when exports were
    // slow; the morning message goes out right after each account's plan is ready.
    await Promise.all(jobs.map(async (j) => {
      const r = results.get(j.id);
      if (!r?.kinds.length) return;
      await refreshManager(store, j.wsId, { priors: b.priors }).catch(() => 0); // Claude's pick of today's fixes + brief
      const ws = await store.getWorkspaceById(j.wsId);
      if (ws) await tellTeam(store, ws, r).catch(() => {});
    }));
  });
  return NextResponse.json({ ok: true, accepted: jobs.length }, { status: 202 });
}
