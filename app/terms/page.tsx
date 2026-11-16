import type { Metadata } from "next";
import { SITE } from "@/lib/site";
export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };
export default function Page() {
  return (
    <section className="prose">
      <h1>Terms of use</h1>
      <p className="fine">Last updated Nov 16, 2026</p>
      <ul>
        <li>Rocco is self-serve software. It analyzes reports you provide and suggests changes. It does not manage your account or provide consulting.</li>
        <li>You decide which suggestions to apply and you apply them yourself. Review every change before uploading. Amazon advertising results are never guaranteed.</li>
        <li>Lifetime plans give access to Rocco&apos;s tools for as long as the product is offered, for the number of brands in your plan. Licenses are for your own use (or your clients&apos;, on Pro and Agency plans) and may not be resold.</li>
        <li>Don&apos;t upload data you don&apos;t have the right to use, and don&apos;t try to break or abuse the service.</li>
        <li>The service is provided as is. Our total liability is limited to the amount you paid.</li>
      </ul>
      <p className="fine">{SITE.disclaimer} Amazon is a trademark of Amazon.com, Inc. or its affiliates and is used here only to describe compatibility.</p>
    </section>
  );
}
