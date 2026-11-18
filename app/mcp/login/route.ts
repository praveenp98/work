import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "@/lib/mcp/server";
import { CORS, RESOURCE_METADATA } from "@/lib/oauth";
import { getStore } from "@/lib/store";
import { later, onFirstUse } from "@/lib/notify";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Rocco with sign-in: https://rocco.works/mcp/login. Claude/ChatGPT see the 401 + metadata, open Rocco's sign-in
 * page, and come back with a token (the workspace key). Same tools as the personal connector.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const unauthorized = () =>
  new Response(JSON.stringify({ error: "Sign in to Rocco" }), {
    status: 401,
    headers: { ...CORS, "content-type": "application/json", "www-authenticate": `Bearer resource_metadata="${RESOURCE_METADATA}"` },
  });

async function handle(req: Request): Promise<Response> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return unauthorized();
  const store = getStore();
  if (!store) return Response.json({ error: "Rocco memory isn't configured yet." }, { status: 503 });
  const ws = await loadWorkspace(store, token);
  if (!ws) return unauthorized();
  // The bing: first real tool call from the team's AI turns Rocco "on" and tells the team.
  if (!ws.connectedAt) {
    const rpc = (await req.clone().json().catch(() => null)) as { method?: string } | { method?: string }[] | null;
    if ([rpc].flat().some((m) => m?.method === "tools/call")) later(() => onFirstUse(store, ws));
  }
  const server = buildServer({ store, ws, token });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    const res = await transport.handleRequest(req);
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    return res;
  } finally {
    void transport.close();
    void server.close();
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
