import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { exchangeCode, postSlack, readState, teamKey } from "@/lib/slack";
import { getStore } from "@/lib/store";
import { revealToken } from "@/lib/workspace";

/** Slack sends the browser back here after "Add to Slack". Link the Slack team to the Rocco workspace and say hi. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const wsId = readState(u.searchParams.get("state"));
  const code = u.searchParams.get("code");
  const store = getStore();
  if (!wsId || !code || !store) return NextResponse.redirect(`${SITE.url}/?slack=error`, 302);
  const ws = await store.getWorkspaceById(wsId);
  const link = ws ? await exchangeCode(code) : null;
  if (!ws || !link) return NextResponse.redirect(`${SITE.url}/?slack=error`, 302);
  ws.slack = link;
  await store.saveWorkspace(ws);
  await store.savePhone({ phone: teamKey(link.teamId), workspaceId: ws.id, optedOut: false, createdAt: new Date().toISOString() });
  await postSlack(link, "Hey team, I'm Rocco 🦝 your AI Amazon manager. I'll post the numbers here every morning. Mention me (@Rocco) with anything: “yes N1 N2”, “how's stock?”, “brief”, “wins”. You can also DM me.");
  const t = revealToken(ws);
  return NextResponse.redirect(t ? `${SITE.url}/w/${t}?slack=connected` : `${SITE.url}/?slack=connected`, 302);
}
