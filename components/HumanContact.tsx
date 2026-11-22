"use client";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

/**
 * "Email a human" on every page: a small pill bottom-right (on the homepage on phones it moves up out of the way of
 * the sticky Hire button). Opens the visitor's mail app to human@rocco.works with a subject that says where they were.
 */
export function HumanContact() {
  const path = usePathname() ?? "/";
  const where = path.startsWith("/w/") ? "my Rocco" : path === "/" ? "the homepage" : path.replace(/^\//, "");
  const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Question about Rocco (${where})`)}`;
  return (
    <a className={`human-pill${path === "/" ? " home" : ""}`} href={href} aria-label={`Email a human at ${SITE.contactEmail}`}>
      <span aria-hidden>✉️</span><span className="human-t">Email a human</span>
    </a>
  );
}
