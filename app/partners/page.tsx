import type { Metadata } from "next";
import { PartnerPage } from "@/components/partners/PartnerPage";
import { HUB } from "@/lib/partners";

export const dynamic = "force-static";
export const metadata: Metadata = { title: HUB.metaTitle, description: HUB.metaDescription, alternates: { canonical: HUB.path }, openGraph: { title: HUB.metaTitle, description: HUB.metaDescription } };

export default function Page() {
  return <PartnerPage page={HUB} hub />;
}
