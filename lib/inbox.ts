import { gunzipSync } from "node:zlib";
import Papa from "papaparse";
import PostalMime from "postal-mime";
import { REPORT_HELP } from "./analyze";
import { notifyTeam } from "./notify";
import { paywall } from "./paywall";
import type { InboxItem, Store, Workspace } from "./store/types";
import { buildBrief, DEFAULT_BRAND, runAnalysis } from "./workspace";

/**
 * Rocco's report inbox (outside the US, or anyone without Claude's Amazon connectors).
 * Each team gets an address: <link code>@in.rocco.works. The seller schedules Amazon's own report emails (Ads console
 * scheduled reports; any report they forward) to it once. Every email that lands is read here:
 *  - attachments: CSV / TSV / TXT / XLSX / .gz → the same analysis engine Claude uses → fixes in memory
 *  - no attachment: download links are followed ONLY if they are pre-signed file links (S3/CloudFront signatures).
 *    Rocco never signs in to Amazon or opens pages behind a login (no scraping).
 * Then the team gets the morning text/Slack with the top fixes. Approvals turn into a bulk file for Amazon Ads.
 */
export { INBOX_DOMAIN, inboxAddress } from "./inbox-address";
import { INBOX_DOMAIN } from "./inbox-address";

export interface InboundFile { name: string; type?: string; data: Uint8Array }
export interface InboundMail { to: string[]; from: string; subject: string; text?: string; html?: string; files: InboundFile[] }

const MAX_FILE = 15_000_000;

/** Postmark inbound webhook JSON → mail. */
export function fromPostmark(j: Record<string, unknown>): InboundMail {
  const full = (j.ToFull as { Email?: string }[] | undefined)?.map((x) => x.Email ?? "") ?? [];
  const cc = (j.CcFull as { Email?: string }[] | undefined)?.map((x) => x.Email ?? "") ?? [];
  const orig = typeof j.OriginalRecipient === "string" ? [j.OriginalRecipient] : [];
  const to = [...orig, ...full, ...cc, ...String(j.To ?? "").split(",")].map((s) => s.trim()).filter(Boolean);
  const files = ((j.Attachments as { Name?: string; Content?: string; ContentType?: string }[] | undefined) ?? [])
    .filter((a) => a.Content)
    .map((a) => ({ name: a.Name ?? "report", type: a.ContentType, data: new Uint8Array(Buffer.from(a.Content!, "base64")) }));
  return { to, from: String(j.From ?? ""), subject: String(j.Subject ?? ""), text: j.TextBody as string | undefined, html: j.HtmlBody as string | undefined, files };
}

/** Raw RFC 822 email (Cloudflare Email Worker, Mailgun "store and notify", etc.) → mail. */
export async function fromRaw(raw: ArrayBuffer | Uint8Array | string, envelopeTo?: string): Promise<InboundMail> {
  const m = await PostalMime.parse(raw, { attachmentEncoding: "base64" }); // strings decode the same in every runtime
  const addrs = (xs?: { address?: string }[]) => (xs ?? []).map((x) => x.address ?? "").filter(Boolean);
  const to = [...(envelopeTo ? [envelopeTo] : []), ...addrs(m.to), ...addrs(m.cc), ...addrs(m.deliveredTo ? [{ address: m.deliveredTo }] : [])];
  const files = (m.attachments ?? []).map((a) => ({
    name: a.filename ?? "report",
    type: a.mimeType,
    data: new Uint8Array(Buffer.from(String(a.content), "base64")),
  }));
  return { to, from: m.from?.address ?? "", subject: m.subject ?? "", text: m.text, html: m.html, files };
}

/** Which team an email is for: the first recipient on our inbox domain whose local part is a team's link code. */
export async function teamFor(store: Store, mail: InboundMail): Promise<Workspace | null> {
  for (const a of mail.to) {
    const m = a.toLowerCase().match(/^([a-z0-9]{6})(\+[^@]*)?@(.+)$/);
    if (!m || m[3] !== INBOX_DOMAIN) continue;
    const ws = await store.findWorkspaceByLinkCode(m[1].toUpperCase());
    if (ws) return ws;
  }
  return null;
}

/** File → tables. CSV/TSV/TXT, XLSX (every sheet), gzip of either. */
export async function tablesFrom(f: InboundFile): Promise<unknown[][][]> {
  let { name, data } = f;
  name = name.toLowerCase();
  if (data.byteLength > MAX_FILE) throw new Error("too big");
  if (name.endsWith(".gz") || (data[0] === 0x1f && data[1] === 0x8b)) { data = new Uint8Array(gunzipSync(data)); name = name.replace(/\.gz$/, ""); }
  if (name.endsWith(".zip") || (data[0] === 0x50 && data[1] === 0x4b && !name.endsWith(".xlsx"))) {
    if (!name.endsWith(".xlsx")) throw new Error("zip files aren't supported yet: send the CSV or XLSX itself");
  }
  if (name.endsWith(".xlsx") || (data[0] === 0x50 && data[1] === 0x4b)) {
    const { default: readXlsxFile, readSheetNames } = await import("read-excel-file/node");
    const buf = Buffer.from(data);
    const out: unknown[][][] = [];
    for (const sheet of await readSheetNames(buf)) out.push((await readXlsxFile(buf, { sheet })) as unknown[][]);
    return out;
  }
  if (name.endsWith(".xls") || name.endsWith(".pdf")) throw new Error(`${name.split(".").pop()} files can't be read: choose CSV or XLSX delivery`);
  const text = new TextDecoder().decode(data).replace(/^﻿/, "");
  return [Papa.parse<unknown[]>(text, { skipEmptyLines: true }).data];
}

/** Download links Rocco may follow: pre-signed file links only (they carry their own signature, no login). */
export function signedLinks(mail: InboundMail): string[] {
  const body = `${mail.text ?? ""} ${mail.html ?? ""}`.replace(/&amp;/g, "&");
  const urls = [...new Set(body.match(/https:\/\/[^\s"'<>)]+/g) ?? [])];
  return urls.filter((u) => {
    try {
      const x = new URL(u);
      const storage = /(^|\.)amazonaws\.com$|(^|\.)cloudfront\.net$/.test(x.hostname);
      const signed = [...x.searchParams.keys()].some((k) => /^(x-amz-signature|signature|x-amz-credential)$/i.test(k));
      return storage && signed;
    } catch { return false; }
  }).slice(0, 3);
}

async function download(url: string): Promise<InboundFile | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_FILE) return null;
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "report.csv");
    return { name, type: res.headers.get("content-type") ?? undefined, data: buf };
  } catch { return null; } finally { clearTimeout(t); }
}

export interface InboundResult { ws: Workspace | null; item?: InboxItem; analyzed: number }

/** Read one inbound email end to end: analyze its reports, log it on the team, tell the team. */
export async function handleInbound(store: Store, mail: InboundMail, now = new Date(), opts: { notify?: boolean } = {}): Promise<InboundResult> {
  const ws = await teamFor(store, mail);
  if (!ws) return { ws: null, analyzed: 0 };
  const brand = Object.keys(ws.brands)[0] ?? DEFAULT_BRAND;
  let files = mail.files.filter((f) => !/\.(png|jpe?g|gif|svg|ics|p7s|asc)$/i.test(f.name));
  let linkOnly = false;
  if (!files.length) {
    const links = signedLinks(mail);
    files = (await Promise.all(links.map(download))).filter((f): f is InboundFile => !!f);
    linkOnly = !files.length && /https:\/\//.test(`${mail.text ?? ""}${mail.html ?? ""}`);
  }

  const logged: InboxItem["files"] = [];
  const kinds: string[] = [];
  for (const f of files.slice(0, 6)) {
    try {
      const tables = await tablesFrom(f);
      let ok = false;
      for (const table of tables) {
        try {
          const { out } = await runAnalysis(store, ws, brand, table);
          kinds.push(out.kind);
          logged.push({ name: f.name, kind: out.kind, headline: out.analysis.headline.slice(0, 200) });
          ok = true;
        } catch { /* not a report sheet (cover page, notes): try the next one */ }
      }
      if (!ok) logged.push({ name: f.name, error: "not a report Rocco reads yet" });
    } catch (e) {
      logged.push({ name: f.name, error: e instanceof Error ? e.message : "couldn't open it" });
    }
  }

  const fresh = (await store.getWorkspaceById(ws.id)) ?? ws;
  const first = !fresh.inbox?.some((i) => i.files.some((f) => f.kind));
  const item: InboxItem = { at: now.toISOString(), from: mail.from.slice(0, 120), subject: mail.subject.slice(0, 200), files: logged, ...(linkOnly ? { note: "link_only" as const } : !files.length ? { note: "no_report" as const } : {}) };
  fresh.inbox = [item, ...(fresh.inbox ?? [])].slice(0, 20);
  if (kinds.length && !fresh.reportsAt) fresh.reportsAt = now.toISOString();
  await store.saveWorkspace(fresh);

  if (opts.notify !== false) {
    if (kinds.length) {
      const b = await buildBrief(store, fresh, now);
      const open = [...(b.perBrand.find((x) => x.brand === brand)?.open ?? [])].sort((a, c) => c.valueMonthly - a.valueMonthly).slice(0, 3);
      const names = [...new Set(kinds)].map((k) => REPORT_HELP[k as keyof typeof REPORT_HELP]?.name ?? k).join(" + ");
      const L = [`${first ? "🔔 First report in, I'm on! " : "📥 "}Amazon sent me your ${names}.`, ...logged.filter((l) => l.headline).map((l) => l.headline!)];
      for (const o of open) L.push(`• ${o.code}: ${o.reason.slice(0, 110)}`);
      if (open.length) L.push(`Reply YES ${open.map((o) => o.code).join(" ")} to approve.`);
      const offer = paywall(fresh, b, "found", { now });
      await store.saveWorkspace(fresh);
      await notifyTeam(store, fresh, [L.join("\n"), ...(offer ? [offer.text, offer.url] : [])]);
    } else if (linkOnly) {
      await notifyTeam(store, fresh, [`📭 Got "${mail.subject.slice(0, 80)}" but it only has a sign-in link, and I never log in to Amazon. Set the schedule's delivery to attach the file (CSV), or download it and forward it to me.`]);
    }
  }
  return { ws: fresh, item, analyzed: kinds.length };
}
