import { afterEach, describe, expect, it, vi } from "vitest";
import { SupabaseStore } from "./supabase";

afterEach(() => vi.unstubAllGlobals());

describe("SupabaseStore auth headers", () => {
  const capture = () => {
    const calls: [string, RequestInit][] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, i: RequestInit) => { calls.push([u, i]); return new Response("[]", { status: 200 }); }));
    return calls;
  };
  it("sends new sb_secret keys only as apikey and normalizes the URL", async () => {
    const calls = capture();
    await new SupabaseStore("https://abc.supabase.co/rest/v1/", "sb_secret_xyz").listRuns("w1");
    expect(calls[0][0]).toMatch(/^https:\/\/abc\.supabase\.co\/rest\/v1\/runs\?/);
    const h = calls[0][1].headers as Record<string, string>;
    expect(h.apikey).toBe("sb_secret_xyz");
    expect(h.Authorization).toBeUndefined();
  });
  it("keeps Authorization for legacy JWT keys", async () => {
    const calls = capture();
    await new SupabaseStore("https://abc.supabase.co", "eyJhbGciOi.legacy").listRuns("w1");
    expect((calls[0][1].headers as Record<string, string>).Authorization).toBe("Bearer eyJhbGciOi.legacy");
  });
  it("reports missing tables and rejected keys", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => new Response("{}", { status: u.includes("phones") ? 404 : u.includes("waitlist") ? 401 : 200 })));
    const r = await new SupabaseStore("https://abc.supabase.co", "sb_secret_x").checkTables(["workspaces", "phones", "waitlist"]);
    expect(r).toEqual({ workspaces: "ok", phones: "missing: run supabase/setup.sql", waitlist: "key rejected (401)" });
  });
});
