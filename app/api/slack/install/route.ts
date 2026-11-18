import { NextResponse } from "next/server";
import { installUrl } from "@/lib/slack";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/** "Add to Slack" from a Rocco page: /api/slack/install?t=<workspace key>. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const store = getStore();
  const ws = store ? await loadWorkspace(store, t) : null;
  if (!ws) return NextResponse.json({ error: "Open this from your Rocco page." }, { status: 400 });
  const url = installUrl(ws.id);
  if (!url) return NextResponse.json({ error: "Slack isn't switched on yet (missing SLACK_CLIENT_ID / SLACK_CLIENT_SECRET / SLACK_SIGNING_SECRET)." }, { status: 503 });
  return NextResponse.redirect(url, 302);
}
