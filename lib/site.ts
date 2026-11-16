export const SITE = {
  name: "Rocco",
  domain: "rocco.works",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://rocco.works",
  tagline: "Rocco works your Amazon ads. You approve.",
  description:
    "Rocco is an AI raccoon that digs through your Amazon ads reports, finds the money leaking out, and hands you the exact fixes and a ready-to-upload bulk file. Free roast in 2 minutes, no login.",
  x: "https://x.com/roccoworks",
  disclaimer: "Rocco is an independent tool and is not affiliated with, endorsed by or sponsored by Amazon.",
  contactEmail: "hello@rocco.works",
};

export const PLANS = [
  { id: "holiday", name: "Holiday Pass", price: 99, brands: 1, blurb: "Every tool, one brand, until Jan 31, 2027.", envUrl: process.env.NEXT_PUBLIC_POLAR_HOLIDAY_URL },
  { id: "seller", name: "Seller Lifetime", price: 149, brands: 1, blurb: "One brand. Every tool, every update. Pay once.", envUrl: process.env.NEXT_PUBLIC_POLAR_SELLER_URL },
  { id: "pro", name: "Pro Lifetime", price: 299, brands: 5, blurb: "Up to 5 brands. For growing sellers and freelancers.", envUrl: process.env.NEXT_PUBLIC_POLAR_PRO_URL, featured: true },
  { id: "agency", name: "Agency Lifetime", price: 399, brands: 20, blurb: "Up to 20 brands, white-label roast reports.", envUrl: process.env.NEXT_PUBLIC_POLAR_AGENCY_URL },
] as const;

/** Founding prices step up on these dates (real deadlines only). */
export const PRICE_STEPS = ["Nov 27, 2026", "Dec 1, 2026", "Dec 16, 2026"];
