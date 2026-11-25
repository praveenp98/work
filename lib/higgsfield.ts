/**
 * Higgsfield image generation (docs.higgsfield.ai). Server only. Key: HIGGSFIELD_KEY = "<key id>:<key secret>"
 * (header `Authorization: Key <id>:<secret>`). Requests are asynchronous: submit → poll status_url → images[].url.
 * Output URLs live for at least 7 days; Rocco hands them to Amazon (which copies the file) or the seller downloads them.
 * Default model: Qwen Image 3 edit, which keeps the seller's real product from the reference photo.
 */
const BASE = "https://api.higgsfield.ai";
export const HF_MODEL = process.env.HIGGSFIELD_IMAGE_MODEL || "alibaba/qwen-image-3/edit";
export const higgsfieldOn = () => !!process.env.HIGGSFIELD_KEY;

const auth = () => ({ Authorization: `Key ${process.env.HIGGSFIELD_KEY ?? ""}`, "Content-Type": "application/json" });

export type HfStatus = "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
export interface HfRequest { requestId: string; status: HfStatus; images: string[]; error?: string }

export const ASPECTS = ["1:1", "2:3", "3:2", "3:4", "4:3", "7:9", "9:7", "9:16", "16:9", "21:9"] as const;
export type Aspect = (typeof ASPECTS)[number];

/** Submit one image edit. `refs` are 1–3 public image URLs (the product photo first). Idempotent per `key`. */
export async function submitImage(o: { prompt: string; negative?: string; refs: string[]; aspect: Aspect; key: string; resolution?: "1k" | "2k" }): Promise<HfRequest> {
  const refs = o.refs.filter((u) => /^https:\/\//.test(u)).slice(0, 3);
  if (!refs.length) return { requestId: "", status: "failed", images: [], error: "No product photo to work from." };
  const res = await fetch(`${BASE}/${HF_MODEL}`, {
    method: "POST", headers: { ...auth(), "Idempotency-Key": o.key.slice(0, 120) }, cache: "no-store",
    body: JSON.stringify({ prompt: o.prompt.slice(0, 6000), image_urls: refs, resolution: o.resolution ?? "2k", aspect_ratio: o.aspect, ...(o.negative ? { negative_prompt: o.negative.slice(0, 2000) } : {}) }),
  }).catch(() => null);
  if (!res) return { requestId: "", status: "failed", images: [], error: "Higgsfield didn't answer." };
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { requestId: "", status: "failed", images: [], error: `Higgsfield ${res.status}: ${JSON.stringify(body.detail ?? body.message ?? body).slice(0, 200)}` };
  return parseStatus(body);
}

/** Current state of a request (GET /requests/{id}/status). */
export async function imageStatus(requestId: string): Promise<HfRequest> {
  if (!/^[0-9a-f-]{20,60}$/i.test(requestId)) return { requestId, status: "failed", images: [], error: "Bad request id." };
  const res = await fetch(`${BASE}/requests/${requestId}/status`, { headers: auth(), cache: "no-store" }).catch(() => null);
  if (!res) return { requestId, status: "in_progress", images: [] };
  return parseStatus((await res.json().catch(() => ({}))) as Record<string, unknown>, requestId);
}

/** Higgsfield's request JSON → our shape (images as plain URLs). */
export function parseStatus(b: Record<string, unknown>, fallbackId = ""): HfRequest {
  const status = String(b.status ?? "queued") as HfStatus;
  const imgs = Array.isArray(b.images) ? (b.images as { url?: unknown }[]).map((x) => String(x?.url ?? "")).filter((u) => /^https:\/\//.test(u)) : [];
  const err = status === "nsfw" ? "Higgsfield's safety filter rejected this image. Try a different idea." : status === "failed" ? String((b.error as string) ?? "Generation failed.").slice(0, 200) : undefined;
  return { requestId: String(b.request_id ?? fallbackId), status, images: imgs, ...(err ? { error: err } : {}) };
}

/**
 * A reference photo the seller uploads (no public URL yet): ask Higgsfield for a presigned upload, PUT the bytes,
 * return the public URL to use as a reference.
 */
export async function uploadReference(bytes: ArrayBuffer, contentType: string): Promise<string | null> {
  if (!/^image\/(jpeg|jpg|png|webp)$/.test(contentType) || bytes.byteLength > 8_000_000) return null;
  const r = await fetch(`${BASE}/files/generate-upload-url`, { method: "POST", headers: auth(), body: JSON.stringify({ content_type: contentType }), cache: "no-store" }).catch(() => null);
  const u = r?.ok ? ((await r.json().catch(() => null)) as { public_url?: string; upload_url?: string; upload_headers?: Record<string, string> } | null) : null;
  if (!u?.upload_url || !u.public_url) return null;
  const put = await fetch(u.upload_url, { method: "PUT", headers: u.upload_headers ?? { "Content-Type": contentType }, body: bytes }).catch(() => null);
  return put?.ok ? u.public_url : null;
}
