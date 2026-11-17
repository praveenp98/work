/**
 * Ship or Die hackathon traffic verification (required on every page before traffic, rule 5).
 * Rendered inside <head> from the root layout. Env vars can override for another site id.
 */
const SRC = process.env.NEXT_PUBLIC_TRACKER_SRC || "https://www.ship-or-die.com/hackathon/verify.js";
const SITE_ID = process.env.NEXT_PUBLIC_TRACKER_SITE_ID || "f9fac6eeac39ef1b81208010816a97a15278f3aa";

export function Tracker() {
  return <script defer src={SRC} data-site={SITE_ID} />;
}
