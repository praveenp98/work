import Script from "next/script";

/** Hackathon / TrustMRR traffic tracker. Configure via env; renders nothing until set. */
export function Tracker() {
  const src = process.env.NEXT_PUBLIC_TRACKER_SRC;
  if (!src) return null;
  const site = process.env.NEXT_PUBLIC_TRACKER_SITE_ID;
  return <Script src={src} strategy="afterInteractive" data-site-id={site} data-website-id={site} />;
}
