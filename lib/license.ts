"use client";
const KEY = "rocco_license_v1";

export function getLicense(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setLicense(k: string) {
  try { localStorage.setItem(KEY, k); } catch { /* private mode: unlock lasts this page view */ }
}
export async function validateLicense(key: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key }) }).catch(() => null);
  if (!res) return { ok: false, error: "Network error. Try again." };
  return res.json();
}
