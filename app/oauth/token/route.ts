import { CORS, redeemCode, redeemRefresh, tokenResponse } from "@/lib/oauth";

/** Token endpoint: authorization_code (PKCE S256) and refresh_token. Public clients, no secret. */
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  const p = ct.includes("application/json")
    ? new URLSearchParams(Object.entries((await req.json().catch(() => ({}))) as Record<string, string>))
    : new URLSearchParams(await req.text());
  const grant = p.get("grant_type");
  let token: string | null = null;
  if (grant === "authorization_code") {
    token = redeemCode({ code: p.get("code") ?? "", verifier: p.get("code_verifier") ?? "", clientId: p.get("client_id") ?? undefined, redirectUri: p.get("redirect_uri") ?? undefined });
  } else if (grant === "refresh_token") {
    token = redeemRefresh(p.get("refresh_token") ?? "");
  } else {
    return Response.json({ error: "unsupported_grant_type" }, { status: 400, headers: CORS });
  }
  if (!token) return Response.json({ error: "invalid_grant" }, { status: 400, headers: CORS });
  return Response.json(tokenResponse(token), { headers: { ...CORS, "cache-control": "no-store" } });
}
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
