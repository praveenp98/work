import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerPage } from "@/components/partners/PartnerPage";
import { PARTNER_PAGES, partnerPage } from "@/lib/partners";

/** /partners/agencies, /partners/tools, /partners/communities (copy: lib/partners.ts). Static. */
export const dynamicParams = false;
export const generateStaticParams = () => PARTNER_PAGES.map((p) => ({ type: p.slug }));

type P = { params: Promise<{ type: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = partnerPage((await params).type);
  if (!p) return {};
  return { title: p.metaTitle, description: p.metaDescription, alternates: { canonical: p.path }, openGraph: { title: p.metaTitle, description: p.metaDescription } };
}

export default async function Page({ params }: P) {
  const p = partnerPage((await params).type);
  if (!p) notFound();
  return <PartnerPage page={p} />;
}
