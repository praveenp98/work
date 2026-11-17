import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Seals a workspace key so Rocco can text it back to a linked phone ("dashboard"), while the database only ever
 * holds the sha256 for lookups plus this AES-256-GCM ciphertext. Key: ROCCO_VAULT_KEY, else the server's Supabase key.
 */
function key(): Buffer | null {
  const e = process.env;
  const s = e.ROCCO_VAULT_KEY || e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_SECRET_KEY || e.SUPABASE_SERVICE_KEY || e.SUPABASE_KEY;
  return s ? createHash("sha256").update(`rocco-vault:${s}`).digest() : null;
}

export function seal(plain: string): string | undefined {
  const k = key();
  if (!k) return undefined;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv, c.getAuthTag(), ct].map((x) => (typeof x === "string" ? x : x.toString("base64url"))).join(".");
}

export function unseal(sealed?: string): string | null {
  const k = key();
  if (!k || !sealed) return null;
  try {
    const [v, iv, tag, ct] = sealed.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch { return null; }
}
