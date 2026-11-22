import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { secretOk, verifyStandardWebhook, within } from "./security";

describe("security helpers", () => {
  it("secretOk is exact and never passes on an empty secret", () => {
    expect(secretOk("abc", "abc")).toBe(true);
    expect(secretOk("abd", "abc")).toBe(false);
    expect(secretOk("abc", undefined)).toBe(false);
    expect(secretOk("", "")).toBe(false);
  });
  it("per-team limits keep a rolling window", () => {
    const now = new Date("2026-11-22T12:00:00Z");
    const old = new Date("2026-11-21T10:00:00Z").toISOString();
    const recent = new Date("2026-11-22T11:00:00Z").toISOString();
    expect(within([old, recent], 1, 2, 24, now)).toEqual({ ok: true, kept: [recent] });
    expect(within([recent, recent], 1, 2, 24, now).ok).toBe(false);
    expect(within([], 301, 300, 24, now).ok).toBe(false);
  });
  it("verifies Dodo (Standard Webhooks) signatures", () => {
    const key = Buffer.from("supersecretkey123").toString("base64");
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{"type":"payment.succeeded"}';
    const sig = createHmac("sha256", Buffer.from(key, "base64")).update(`msg_1.${ts}.${body}`).digest("base64");
    const h = (s: string, t = ts) => new Headers({ "webhook-id": "msg_1", "webhook-timestamp": t, "webhook-signature": `v1,${s}` });
    expect(verifyStandardWebhook(`whsec_${key}`, h(sig), body)).toBe(true);
    expect(verifyStandardWebhook(`whsec_${key}`, h(sig), body + " ")).toBe(false);
    expect(verifyStandardWebhook(`whsec_${key}`, h(sig, String(Number(ts) - 3600)), body)).toBe(false);
  });
});
