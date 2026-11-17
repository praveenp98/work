import { createHash } from "node:crypto";
import { SITE } from "./site";
import { seal, unseal } from "./vault";

/**
 * OAuth 2.1 for the Rocco connector (MCP authorization spec): adding https://rocco.works/mcp/login in Claude or
 * ChatGPT opens Rocco's sign-in page, creates (or reuses) the team's private Rocco and returns signed in.
 * Stateless: client ids, codes and refresh tokens are AES-GCM sealed blobs (lib/vault), so no new tables.
 * The access token is the workspace key itself (the same secret as the personal connector URL).
 */
export const ISSUER = SITE.url;
export const MCP_LOGIN = `${SITE.url}/mcp/login`;
export const RESOURCE_METADATA = `${SITE.url}/.well-known/oauth-protected-resource/mcp/login`;

export const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "authorization, content-type, mcp-protocol-version" };

const pack = (kind: string, data: Record<string, unknown>, ttlSec?: number) =>
  seal(JSON.stringify({ k: kind, ...data, ...(ttlSec ? { exp: Date.now() + ttlSec * 1000 } : {}) }));

function open<T>(kind: string, blob?: string | null): T | null {
  if (!blob) return null;
  const raw = unseal(blob);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { k: string; exp?: number } & T;
    if (d.k !== kind || (d.exp && d.exp < Date.now())) return null;
    return d;
  } catch { return null; }
}

const okRedirect = (u: string) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" || (x.protocol === "http:" && ["localhost", "127.0.0.1"].includes(x.hostname));
  } catch { return false; }
};

/** Dynamic client registration: the client id carries its own redirect URIs, sealed. */
export function registerClient(body: { redirect_uris?: unknown; client_name?: unknown }) {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String).filter(okRedirect).slice(0, 10) : [];
  if (!uris.length) return null;
  const name = typeof body.client_name === "string" ? body.client_name.slice(0, 60) : "your AI app";
  const id = pack("client", { ru: uris, n: name });
  return id ? { client_id: `rc_${id}`, redirect_uris: uris, client_name: name, token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"] } : null;
}

export function readClient(clientId?: string | null): { ru: string[]; n: string } | null {
  if (!clientId?.startsWith("rc_")) return null;
  return open<{ ru: string[]; n: string }>("client", clientId.slice(3));
}

export function issueCode(o: { token: string; clientId: string; redirectUri: string; challenge: string }) {
  return pack("code", { t: o.token, c: o.clientId, r: o.redirectUri, ch: o.challenge }, 600);
}

const s256 = (v: string) => createHash("sha256").update(v).digest("base64url");

export function redeemCode(o: { code: string; verifier: string; clientId?: string; redirectUri?: string }): string | null {
  const d = open<{ t: string; c: string; r: string; ch: string }>("code", o.code);
  if (!d) return null;
  if (o.clientId && o.clientId !== d.c) return null;
  if (o.redirectUri && o.redirectUri !== d.r) return null;
  if (!o.verifier || s256(o.verifier) !== d.ch) return null;
  return d.t;
}

export const issueRefresh = (token: string) => pack("refresh", { t: token });
export const redeemRefresh = (r: string) => open<{ t: string }>("refresh", r)?.t ?? null;

export const tokenResponse = (token: string) => ({ access_token: token, token_type: "Bearer", refresh_token: issueRefresh(token), scope: "rocco" });

export const authServerMetadata = () => ({
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/oauth/authorize`,
  token_endpoint: `${ISSUER}/oauth/token`,
  registration_endpoint: `${ISSUER}/oauth/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  scopes_supported: ["rocco"],
});

export const resourceMetadata = () => ({ resource: MCP_LOGIN, authorization_servers: [ISSUER], scopes_supported: ["rocco"], resource_name: "Rocco" });
