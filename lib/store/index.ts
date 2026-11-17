import { createHash, randomBytes } from "node:crypto";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

const g = globalThis as unknown as { __roccoStore?: Store };

/** Supabase when configured; otherwise an in-memory store (dev/tests, or when ROCCO_ALLOW_MEMORY_STORE=1). */
export function getStore(): Store | null {
  if (g.__roccoStore) return g.__roccoStore;
  const { url, key } = supabaseEnv();
  if (url && key) g.__roccoStore = new SupabaseStore(url, key);
  else if (process.env.NODE_ENV !== "production" || process.env.ROCCO_ALLOW_MEMORY_STORE === "1") g.__roccoStore = new MemoryStore();
  else return null;
  return g.__roccoStore;
}

/** Accepts the common names people use in Vercel. Never exposed to the browser. */
export function supabaseEnv() {
  const env = process.env;
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_PROJECT_URL;
  const keyName = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_KEY"].find((n) => env[n]);
  return { url, key: keyName ? env[keyName] : undefined, urlName: url ? (env.SUPABASE_URL ? "SUPABASE_URL" : env.NEXT_PUBLIC_SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : "SUPABASE_PROJECT_URL") : null, keyName: keyName ?? null };
}

export function setStoreForTests(s: Store) { g.__roccoStore = s; }

const ALPHA = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Workspace token: the secret part of the personal connector URL. ~140 bits. */
export function newToken(): string {
  const b = randomBytes(24);
  return "rw_" + Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}
export const isToken = (t: string) => /^rw_[A-Za-z0-9]{24}$/.test(t);
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
