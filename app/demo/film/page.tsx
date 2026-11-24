import type { Metadata } from "next";
import { DemoApp } from "@/components/demo/DemoApp";

/** Full-screen auto-playing tour, recorded into public/demo/rocco-demo.mp4 (scripts/record-demo.js). Not for search. */
export const metadata: Metadata = { title: "Rocco demo film", robots: { index: false, follow: false } };

export default function Page() {
  return <DemoApp film />;
}
