import type { Station } from "@/lib/office";

/** Tell Rocco's office something real just happened on this page (approve, undo, check). The office walks Rocco there. */
export function officeAct(station: Station, text: string, scope?: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("rocco:act", { detail: { station, text, scope } }));
}
