import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "@/lib/mcp/server";
import { getStore } from "@/lib/store";
import { loadWorkspace } from "@/lib/workspace";

/**
 * Personal Rocco connector: https://rocco.works/mcp/<workspace key>.
 * Same tools as /mcp plus memory (brief, change log, result checks, brand settings).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request, { params }: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await params;
  const store = getStore();
  if (!store) return Response.json({ error: "Rocco memory isn't configured yet." }, { status: 503 });
  const ws = await loadWorkspace(store, token);
  if (!ws) return Response.json({ error: "Unknown Rocco workspace. Create one at https://rocco.works/connect" }, { status: 404 });
  const server = buildServer({ store, ws, token });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    void transport.close();
    void server.close();
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
