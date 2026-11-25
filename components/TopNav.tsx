"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const LINKS = [
  { href: "/pricing", t: "Pricing" },
  { href: "/demo", t: "Demo" },
  { href: "/compare", t: "Compare" },
  { href: "/answers", t: "Answers" },
  { href: "/help", t: "Help" },
];

/**
 * Top-left links. Desktop: inline. Phones: a Menu button (the inline links don't fit, and people kept tapping the
 * logo looking for them). Inside the product (your Rocco, welcome) only Help.
 */
export function TopNav() {
  const path = usePathname() ?? "";
  const inApp = /^\/(w|me|welcome)(\/|$)/.test(path);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = inApp ? LINKS.filter((l) => l.href === "/help") : LINKS;
  return (
    <div className="top-nav">
      <nav className="top-left" aria-label="Main">
        {links.filter((l) => l.href !== "/demo" || !inApp).map((l) => <Link key={l.href} href={l.href}>{l.t}</Link>)}
      </nav>
      {/* Dashboard pages have their own menu (components/dash/DashNav.tsx): no site Menu there. */}
      {!/^\/w\//.test(path) && <div className="top-menu">
        <button className="top-menu-btn" aria-expanded={open} aria-controls="top-menu-list" onClick={() => { setOpen((o) => !o); if (!open) track("menu_opened"); }}>
          <span aria-hidden>{open ? "✕" : "☰"}</span> Menu
        </button>
        {open && (
          <nav id="top-menu-list" className="top-menu-list" aria-label="Menu">
            {links.map((l) => <Link key={l.href} href={l.href}>{l.t}</Link>)}
            {!inApp && <Link href="/pricing" className="top-menu-cta">Hire Rocco →</Link>}
          </nav>
        )}
      </div>}
    </div>
  );
}
