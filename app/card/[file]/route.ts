import { AVATAR_PNG_BASE64 } from "@/lib/avatar";
import { SITE } from "@/lib/site";

/**
 * Rocco's contact card, built for the exact number the person texted (shared LoopMessage lines differ per
 * conversation). /card/14086368580.vcf. Sent as an attachment on the first hello, like Boardy's.
 */
export const dynamic = "force-static";
export const dynamicParams = true;

const fold = (line: string) => line.match(/.{1,74}/g)!.map((l, i) => (i ? " " + l : l)).join("\r\n");

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const digits = (await params).file.replace(/\.vcf$/i, "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return new Response("Not found", { status: 404 });
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:;Rocco;;;",
    "FN:Rocco",
    "ORG:Rocco",
    "TITLE:Your AI Amazon manager",
    `item1.TEL;TYPE=CELL;TYPE=pref:+${digits}`,
    "item1.X-ABLabel:iMessage",
    `EMAIL;TYPE=WORK:${SITE.contactEmail}`,
    `item2.URL:${SITE.url}`,
    "item2.X-ABLabel:Website",
    `item3.URL:${SITE.url}/me`,
    "item3.X-ABLabel:Your Rocco",
    `item4.URL:${SITE.x}`,
    "item4.X-ABLabel:X",
    "NOTE:Text me anything about your Amazon ads\\, sales or stock. I send your numbers every morning.",
    fold(`PHOTO;ENCODING=b;TYPE=PNG:${AVATAR_PNG_BASE64}`),
    "END:VCARD",
  ].join("\r\n") + "\r\n";
  return new Response(vcf, {
    headers: { "content-type": "text/vcard; charset=utf-8", "content-disposition": `inline; filename="Rocco.vcf"`, "cache-control": "public, max-age=3600" },
  });
}
