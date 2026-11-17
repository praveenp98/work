import { NextResponse } from "next/server";
import { issueCode, readClient } from "@/lib/oauth";
import { getStore, isToken } from "@/lib/store";
import { createWorkspace, ensureLinkCode, loadWorkspace, rememberToken } from "@/lib/workspace";

/** Form post from /oauth/authorize: create (or reuse) the team's Rocco, then send the code back to the AI app. */
export async function POST(req: Request) {
  const f = await req.formData();
  const get = (k: string) => String(f.get(k) ?? "");
  const clientId = get("client_id"), redirectUri = get("redirect_uri"), challenge = get("code_challenge");
  const client = readClient(clientId);
  if (!client || !client.ru.includes(redirectUri) || !challenge) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const store = getStore();
  if (!store) return NextResponse.json({ error: "Rocco memory isn't configured yet." }, { status: 503 });

  let token: string | null = null;
  const existing = get("existing").match(/rw_[A-Za-z0-9]{24}/)?.[0];
  if (existing && isToken(existing) && (await loadWorkspace(store, existing))) token = existing;
  if (!token) {
    const c = await createWorkspace(store);
    await rememberToken(store, c.ws, c.token);
    await ensureLinkCode(store, c.ws);
    token = c.token;
  }
  const code = issueCode({ token, clientId, redirectUri, challenge });
  if (!code) return NextResponse.json({ error: "server_error" }, { status: 500 });
  const to = new URL(redirectUri);
  to.searchParams.set("code", code);
  if (get("state")) to.searchParams.set("state", get("state"));
  return NextResponse.redirect(to.toString(), 303);
}
