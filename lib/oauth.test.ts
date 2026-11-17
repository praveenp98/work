import { createHash, randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as approve } from "../app/oauth/authorize/approve/route";
import { POST as register } from "../app/oauth/register/route";
import { POST as tokenEndpoint } from "../app/oauth/token/route";
import { POST as mcpLogin } from "../app/mcp/login/route";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import { loadWorkspace } from "./workspace";

afterEach(() => vi.unstubAllEnvs());

const REDIRECT = "https://claude.ai/api/mcp/auth_callback";
const mcpCall = (token?: string) =>
  mcpLogin(new Request("https://rocco.works/mcp/login", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  }));

describe("Sign in to Rocco from Claude (MCP OAuth)", () => {
  it("401 with resource metadata, then register → approve → token → tools", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    setStoreForTests(store);

    const first = await mcpCall();
    expect(first.status).toBe(401);
    expect(first.headers.get("www-authenticate")).toMatch(/resource_metadata="https:\/\/rocco\.works\/\.well-known\/oauth-protected-resource\/mcp\/login"/);

    const reg = await (await register(new Request("https://rocco.works/oauth/register", { method: "POST", body: JSON.stringify({ redirect_uris: [REDIRECT], client_name: "Claude" }) }))).json();
    expect(reg.client_id).toMatch(/^rc_/);

    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const form = new FormData();
    for (const [k, v] of Object.entries({ client_id: reg.client_id, redirect_uri: REDIRECT, state: "s1", code_challenge: challenge })) form.set(k, v);
    const back = await approve(new Request("https://rocco.works/oauth/authorize/approve", { method: "POST", body: form }));
    expect(back.status).toBe(303);
    const loc = new URL(back.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe(REDIRECT);
    expect(loc.searchParams.get("state")).toBe("s1");

    const bad = await tokenEndpoint(new Request("https://rocco.works/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code: loc.searchParams.get("code")!, code_verifier: "wrong", client_id: reg.client_id, redirect_uri: REDIRECT }) }));
    expect(bad.status).toBe(400);

    const tok = await (await tokenEndpoint(new Request("https://rocco.works/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code: loc.searchParams.get("code")!, code_verifier: verifier, client_id: reg.client_id, redirect_uri: REDIRECT }) }))).json();
    expect(tok.access_token).toMatch(/^rw_[A-Za-z0-9]{24}$/);
    expect(await loadWorkspace(store, tok.access_token)).not.toBeNull();

    const refreshed = await (await tokenEndpoint(new Request("https://rocco.works/oauth/token", { method: "POST", body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: tok.refresh_token }) }))).json();
    expect(refreshed.access_token).toBe(tok.access_token);

    const tools = await mcpCall(tok.access_token);
    expect(tools.status).toBe(200);
    expect(await tools.text()).toMatch(/rocco_brief/);
  });

  it("reuses an existing Rocco when the user pastes their Rocco page link", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    const store = new MemoryStore();
    setStoreForTests(store);
    const { createWorkspace } = await import("./workspace");
    const { token } = await createWorkspace(store);
    const reg = await (await register(new Request("https://x/oauth/register", { method: "POST", body: JSON.stringify({ redirect_uris: [REDIRECT] }) }))).json();
    const verifier = "v".repeat(43);
    const form = new FormData();
    for (const [k, v] of Object.entries({ client_id: reg.client_id, redirect_uri: REDIRECT, code_challenge: createHash("sha256").update(verifier).digest("base64url"), existing: `https://rocco.works/w/${token}` })) form.set(k, v);
    const code = new URL((await approve(new Request("https://x/approve", { method: "POST", body: form }))).headers.get("location")!).searchParams.get("code")!;
    const tok = await (await tokenEndpoint(new Request("https://x/oauth/token", { method: "POST", body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier }) }))).json();
    expect(tok.access_token).toBe(token);
  });

  it("rejects redirect URIs that weren't registered", async () => {
    vi.stubEnv("ROCCO_VAULT_KEY", "test-vault");
    setStoreForTests(new MemoryStore());
    const reg = await (await register(new Request("https://x/oauth/register", { method: "POST", body: JSON.stringify({ redirect_uris: [REDIRECT] }) }))).json();
    const form = new FormData();
    for (const [k, v] of Object.entries({ client_id: reg.client_id, redirect_uri: "https://evil.example/cb", code_challenge: "x" })) form.set(k, v);
    expect((await approve(new Request("https://x/approve", { method: "POST", body: form }))).status).toBe(400);
  });
});
