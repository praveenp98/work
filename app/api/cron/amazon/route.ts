import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { datadoeOn } from "@/lib/datadoe";
import { priorsFrom } from "@/lib/memory";
import { SITE } from "@/lib/site";
import { getStore } from "@/lib/store";

/**
 * Daily pull for teams connected to Amazon directly (DataDoe). Vercel Cron calls this after DataDoe's 2am-local fetch
 * (vercel.json). It only dispatches: accounts go out in batches of 8, each batch its own function run
 * (/api/cron/amazon/batch, 300s), staggered 0-50s; DataDoe 429s are retried with backoff. 100 accounts ≈ 13 batches.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const BATCH = 8;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  const store = getStore();
  if (!store || !datadoeOn()) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const teams = (await store.listAmazonWorkspaces()).filter((ws) => hasAccess(ws)); // unpaid/lapsed teams cost nothing
  // Anonymized cross-account defaults (counts per fix type only) for the manager prompt.
  const priors = priorsFrom(await Promise.all(teams.map((ws) => store.listActions(ws.id, { limit: 300 }).catch(() => []))));
  const jobs = teams.flatMap((ws) => (ws.amazon?.accounts ?? []).map((a) => ({ wsId: ws.id, id: a.id, name: a.name })));
  const base = SITE.url; // public domain: deployment-protected *.vercel.app URLs would reject this call
  let sent = 0;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const res = await fetch(`${base}/api/cron/amazon/batch`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(secret ? { authorization: `Bearer ${secret}` } : {}) },
      body: JSON.stringify({ jobs: jobs.slice(i, i + BATCH), priors, delaySec: ((i / BATCH) % 6) * 10 }), // 0-50s stagger; 429 retries absorb overlap
    }).catch(() => null);
    if (res?.ok) sent++;
  }
  return NextResponse.json({ ok: true, accounts: jobs.length, batches: Math.ceil(jobs.length / BATCH), dispatched: sent });
}
