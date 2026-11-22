"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top-left links. Inside the product (your Rocco, welcome) people already hired Rocco: only Help, no sales links. */
export function TopNav() {
  const path = usePathname() ?? "";
  const inApp = /^\/(w|me|welcome)(\/|$)/.test(path);
  return (
    <nav className="top-left" aria-label="Main">
      {!inApp && <Link href="/pricing">Pricing</Link>}
      <Link href="/help">Help</Link>
      {!inApp && <Link href="/answers">Answers</Link>}
    </nav>
  );
}
