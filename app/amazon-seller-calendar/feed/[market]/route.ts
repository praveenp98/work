import { MARKETS } from "@/lib/season";
import { seasonEvents, wrapCalendar } from "@/lib/season-ics";

/** Public calendar feed per marketplace: subscribe once in Google, Apple or Outlook calendar. */
export const revalidate = 43200;
export const generateStaticParams = () => MARKETS.map((m) => ({ market: m.slug }));

export async function GET(_req: Request, { params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  const mk = MARKETS.find((m) => m.slug === market);
  if (!mk) return new Response("Not found", { status: 404 });
  const link = `What to change on your account, with the full calendar: https://rocco.works/amazon-seller-calendar/${mk.slug}`;
  return new Response(wrapCalendar(`Amazon seller calendar · ${mk.name} (Rocco)`, seasonEvents(mk.code, `pub-${mk.slug}`, link)), { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
