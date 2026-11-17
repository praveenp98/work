import { CORS, registerClient } from "@/lib/oauth";

/** Dynamic client registration (RFC 7591), stateless. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const c = registerClient(body);
  if (!c) return Response.json({ error: "invalid_redirect_uri" }, { status: 400, headers: CORS });
  return Response.json(c, { status: 201, headers: CORS });
}
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
