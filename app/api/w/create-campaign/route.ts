import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { createExactCampaign } from "@/lib/create-campaign";
import { datadoeOn } from "@/lib/datadoe";
import { LIMIT_MSG, spend } from "@/lib/security";
import { getStore } from "@/lib/store";
import { approvedBy } from "@/lib/team";
import { applyChanges, latestRuns, loadWorkspace } from "@/lib/workspace";

/** "Create campaign" on the New exact campaign job: approved by the tap, logged, results checked a week later. */
export const maxDuration = 300;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { t?: string; brand?: string; codes?: unknown };
  const store = getStore();
  const ws = store && b.t ? await loadWorkspace(store, b.t) : null;
  const codes = Array.isArray(b.codes) ? b.codes.map(String).map((c) => c.toUpperCase()).filter((c) => /^H\d{1,3}$/.test(c)).slice(0, 25) : [];
  if (!store || !ws || !codes.length) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasAccess(ws)) return NextResponse.json({ ok: false, error: "Hire Rocco to make changes." }, { status: 402 });
  const brand = b.brand || Object.keys(ws.brands)[0] || "main";
  const account = ws.amazon?.accounts?.find((a) => a.name === brand) ?? ws.amazon?.accounts?.[0];
  if (!datadoeOn() || !account) return NextResponse.json({ ok: false, error: "Connect your Amazon first." }, { status: 400 });
  if (!(await spend(store, ws, "campaigns"))) return NextResponse.json({ ok: false, error: LIMIT_MSG.campaigns }, { status: 429 });
  const runs = await latestRuns(store, ws, brand);
  const props = runs.flatMap((r) => r.proposals.map((p) => ({ p, runId: r.id }))).filter((x) => codes.includes(x.p.code));
  const r = await createExactCampaign({ id: account.id, country: account.country }, props.map((x) => x.p), `rocco:${ws.id}:create:${codes.join(",")}`.slice(0, 100));
  if (r.status === "applied") await applyChanges(store, ws, props.map((x) => x.p.code), { brand, note: `new exact campaign made by Rocco in Amazon (${r.done.join(", ")})${await approvedBy(ws)}` });
  return NextResponse.json({ ok: true, ...r, codes: props.map((x) => x.p.code) });
}
