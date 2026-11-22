import { NextResponse } from "next/server";
import { supabaseEnv } from "@/lib/store";
import { SupabaseStore } from "@/lib/store/supabase";
import { lastInbound, textingConfigured } from "@/lib/text/provider";

/** Setup check: what's configured and what's missing. Never returns secret values. */
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseEnv();
  const memory: Record<string, unknown> = {
    url: sb.url ? `set (${sb.urlName})` : "MISSING: add SUPABASE_URL (Supabase > Project Settings > API > Project URL)",
    key: sb.key ? `set (${sb.keyName}, ${sb.key.startsWith("sb_secret_") ? "new secret key" : sb.key.startsWith("sb_publishable_") ? "WRONG: that's the publishable key, use the secret key" : sb.key.startsWith("eyJ") ? "legacy JWT key" : "unknown format"})` : "MISSING: add SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API Keys > secret key)",
  };
  if (sb.url && sb.key) memory.tables = await new SupabaseStore(sb.url, sb.key).checkTables(["workspaces", "snapshots", "runs", "actions", "phones", "waitlist", "rocco_hits", "rocco_marks"]);
  const tables = memory.tables as Record<string, string> | undefined;
  return NextResponse.json({
    ok: !!(tables && Object.values(tables).every((v) => v === "ok")),
    memory,
    brain: process.env.ANTHROPIC_API_KEY ? "set (free-text replies + screenshot reading on)" : "off (add ANTHROPIC_API_KEY for free-text replies and screenshots; CSV reports work without it)",
    slack: process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_SIGNING_SECRET ? "set" : "off (create the app from docs/slack-manifest.yml, then add SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET)",
    payments: {
      dodoApiKey: process.env.DODO_API_KEY ? "set" : "missing (payments can't be confirmed)",
      yearlyProduct: process.env.DODO_PRODUCT_ID_ANNUAL ? "set" : "missing (DODO_PRODUCT_ID_ANNUAL)",
      monthlyProduct: process.env.DODO_PRODUCT_ID_MONTHLY ? "set" : "missing (DODO_PRODUCT_ID_MONTHLY)",
      webhookSignature: process.env.DODO_WEBHOOK_SECRET ? "set" : "missing (DODO_WEBHOOK_SECRET: unsigned webhooks accepted but can't unlock anything)",
      extraAccountProduct: process.env.DODO_PRODUCT_ID_EXTRA_ACCOUNT ? "set" : "missing (DODO_PRODUCT_ID_EXTRA_ACCOUNT: a 4th account says \"email us\")",
      mode: process.env.DODO_MODE === "test" ? "TEST MODE (switch off before real sales)" : "live",
    },
    analytics: { posthog: process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY ? "on" : "off (set POSTHOG_KEY, docs/ANALYTICS.md)", hackathonTracker: "on every page" },
    amazon: { datadoe: process.env.DATADOE_API_KEY ? "set" : "missing (DATADOE_API_KEY)", writes: process.env.ROCCO_WRITES_OFF === "1" ? "PAUSED (ROCCO_WRITES_OFF=1)" : "on" },
    signIn: { google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "set" : "missing (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)", vault: process.env.ROCCO_VAULT_KEY ? "set" : "using the Supabase key (fine; do not add or change ROCCO_VAULT_KEY later: saved team links would stop opening)" },
    texting: { lastInboundFields: lastInbound.keys.length ? lastInbound.keys.join(", ") : "none seen on this server instance yet",  loopmessage: textingConfigured() ? "set" : "dry-run (add LOOPMESSAGE_API_KEY)", optInUrl: (process.env.ROCCO_OPTIN_URL || process.env.NEXT_PUBLIC_ROCCO_OPTIN_URL) ? "set" : "missing (homepage Text Rocco collects contacts instead)", webhookSecret: process.env.TEXT_WEBHOOK_SECRET ? "set" : "missing", cronSecret: process.env.CRON_SECRET ? "set" : "missing" },
    note: "After changing Vercel environment variables, redeploy (Deployments > ... > Redeploy) for them to take effect.",
  }, { headers: { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" } });
}
