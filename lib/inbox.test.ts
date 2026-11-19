import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as inbound } from "../app/api/inbound/email/route";
import { fromRaw, handleInbound, signedLinks } from "./inbox";
import { setStoreForTests } from "./store";
import { MemoryStore } from "./store/memory";
import fs from "node:fs";
import path from "node:path";
import { createWorkspace, ensureLinkCode } from "./workspace";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const CSV = fs.readFileSync(path.join(__dirname, "..", "fixtures", "sp-search-term-report.csv"), "utf8");

function rawEmail(to: string, csv: string | null, body = "Your scheduled report is attached.") {
  const b = "XYZBOUNDARY";
  const parts = [
    `From: Amazon Ads <no-reply@amazon.example>`, `To: ${to}`, `Subject: Scheduled report: Sponsored Products Search term`, `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${b}"`, ``, `--${b}`, `Content-Type: text/plain; charset=utf-8`, ``, body,
  ];
  if (csv) parts.push(`--${b}`, `Content-Type: text/csv; name="Sponsored_Products_Search_term_report.csv"`, `Content-Disposition: attachment; filename="Sponsored_Products_Search_term_report.csv"`, `Content-Transfer-Encoding: base64`, ``, Buffer.from(csv).toString("base64").replace(/.{76}/g, "$&\r\n"));
  parts.push(`--${b}--`, ``);
  return parts.join("\r\n");
}

async function team() {
  const store = new MemoryStore();
  setStoreForTests(store);
  const { ws } = await createWorkspace(store);
  const code = await ensureLinkCode(store, ws);
  return { store, ws, addr: `${code.toLowerCase()}@in.rocco.works` };
}

describe("report inbox (outside the US)", () => {
  it("a scheduled Amazon Ads email with a CSV becomes fixes in the team's memory, logged on the inbox", async () => {
    const { store, ws, addr } = await team();
    const mail = await fromRaw(rawEmail(addr, CSV));
    expect(mail.files[0].name).toMatch(/Search_term_report\.csv/);
    const r = await handleInbound(store, mail, new Date(), { notify: false });
    expect(r.analyzed).toBe(1);
    const w = (await store.getWorkspaceById(ws.id))!;
    expect(w.inbox?.[0].files[0]).toMatchObject({ kind: "sp_search_term" });
    expect(w.reportsAt).toBeTruthy();
    expect((await store.listRuns(ws.id, { limit: 1 }))[0].proposals.length).toBeGreaterThan(0);
  });

  it("emails for unknown addresses or other domains are ignored", async () => {
    const { store } = await team();
    expect((await handleInbound(store, await fromRaw(rawEmail("zzzzzz@in.rocco.works", CSV)), new Date(), { notify: false })).ws).toBeNull();
    expect((await handleInbound(store, await fromRaw(rawEmail("someone@gmail.com", CSV)), new Date(), { notify: false })).ws).toBeNull();
  });

  it("never follows sign-in links; only pre-signed file links", async () => {
    const mail = { to: [], from: "", subject: "", files: [], text: "Download: https://advertising.amazon.com/reports/123 or https://bucket.s3.amazonaws.com/r.csv?X-Amz-Signature=abc&X-Amz-Credential=x" };
    expect(signedLinks(mail)).toEqual(["https://bucket.s3.amazonaws.com/r.csv?X-Amz-Signature=abc&X-Amz-Credential=x"]);
    const { store, ws, addr } = await team();
    const r = await handleInbound(store, await fromRaw(rawEmail(addr, null, "Your report is ready: https://advertising.amazon.com/reports/123")), new Date(), { notify: false });
    expect(r.item?.note).toBe("link_only");
    expect((await store.getWorkspaceById(ws.id))!.inbox?.[0].note).toBe("link_only");
  });

  it("webhook: needs the secret; takes raw email (Cloudflare) and Postmark JSON", async () => {
    vi.stubEnv("ROCCO_INBOUND_SECRET", "s3cret");
    const { store, ws, addr } = await team();
    const url = "https://rocco.works/api/inbound/email";
    expect((await inbound(new Request(url, { method: "POST", body: "x" }))).status).toBe(401);
    const raw = await inbound(new Request(url, { method: "POST", headers: { "content-type": "message/rfc822", "x-rocco-inbound-secret": "s3cret", "x-rocco-to": addr }, body: rawEmail(addr, CSV) }));
    expect(await raw.json()).toMatchObject({ ok: true, team: true, analyzed: 1 });
    const pm = await inbound(new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${Buffer.from("rocco:s3cret").toString("base64")}` },
      body: JSON.stringify({ From: "a@b.c", To: addr, Subject: "fwd: report", Attachments: [{ Name: "report.csv", ContentType: "text/csv", Content: Buffer.from(CSV).toString("base64") }] }),
    }));
    expect(await pm.json()).toMatchObject({ ok: true, team: true, analyzed: 1 });
    expect((await store.getWorkspaceById(ws.id))!.inbox).toHaveLength(2);
  });
});
