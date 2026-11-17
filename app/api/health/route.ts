import { NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/store";
import { SupabaseStore } from "@/lib/store/supabase";
import { textingConfigured } from "@/lib/text/provider";

/** Setup check: what's configured and what's missing. Never returns secret values. */
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseEnv();
  const memory: Record<string, unknown> = {
    url: sb.url ? `set (${sb.urlName})` : "MISSING: add SUPABASE_URL (Supabase > Project Settings > API > Project URL)",
    key: sb.key ? `set (${sb.keyName}, ${sb.key.startsWith("sb_secret_") ? "new secret key" : sb.key.startsWith("sb_publishable_") ? "WRONG: that's the publishable key, use the secret key" : sb.key.startsWith("eyJ") ? "legacy JWT key" : "unknown format"})` : "MISSING: add SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API Keys > secret key)",
  };
  if (sb.url && sb.key) memory.tables = await new SupabaseStore(sb.url, sb.key).checkTables(["workspaces", "snapshots", "runs", "actions", "phones", "waitlist"]);
  const tables = memory.tables as Record<string, string> | undefined;
  return NextResponse.json({
    ok: !!(tables && Object.values(tables).every((v) => v === "ok")),
    memory,
    payments: { dodoApiKey: process.env.DODO_API_KEY ? "set" : "missing (price ladder stays at $99)" },
    texting: { loopmessage: textingConfigured() ? "set" : "dry-run (add LOOPMESSAGE_API_KEY)", optInUrl: process.env.NEXT_PUBLIC_ROCCO_OPTIN_URL ? "set" : "missing (homepage Text Rocco collects contacts instead)", webhookSecret: process.env.TEXT_WEBHOOK_SECRET ? "set" : "missing", cronSecret: process.env.CRON_SECRET ? "set" : "missing" },
    note: "After changing Vercel environment variables, redeploy (Deployments > ... > Redeploy) for them to take effect.",
  }, { headers: { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" } });
}
