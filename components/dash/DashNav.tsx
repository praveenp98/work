"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { path: "", label: "Today", icon: "☀️", main: true },
  { path: "/actions", label: "Actions", icon: "⚡", main: true },
  { path: "/products", label: "Products", icon: "💰", main: true },
  { path: "/images", label: "Images", icon: "🎨", main: true },
  { path: "/analytics", label: "Analytics", icon: "📈" },
  { path: "/log", label: "Change log", icon: "🧾" },
  { path: "/tidy", label: "Tidy campaigns", icon: "🗂️" },
  { path: "/report", label: "Report", icon: "📄" },
] as const;

/**
 * The dashboard menu (every /w/<token> page): a sticky tab bar on desktop, an app-style bottom bar on phones with
 * a "More" sheet. Settings lives on the Today page (opened and scrolled to from here).
 */
export function DashNav({ token }: { token: string }) {
  const path = usePathname() ?? "";
  const base = `/w/${token}`;
  const [more, setMore] = useState(false);
  const active = (p: string) => (p === "" ? path === base : path.startsWith(base + p));

  useEffect(() => {
    document.body.classList.add("has-dashbar");
    const open = () => {
      if (location.hash !== "#settings") return;
      const d = document.getElementById("settings") as HTMLDetailsElement | null;
      if (d) { d.open = true; setTimeout(() => d.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => { document.body.classList.remove("has-dashbar"); window.removeEventListener("hashchange", open); };
  }, []);
  useEffect(() => { setMore(false); }, [path]);

  const settings = (
    <a href={`${base}#settings`} onClick={(e) => { if (path === base) { e.preventDefault(); history.replaceState(null, "", "#settings"); window.dispatchEvent(new HashChangeEvent("hashchange")); setMore(false); } }}>
      <span aria-hidden>⚙️</span> Settings
    </a>
  );

  return (
    <>
      <nav className="dn" aria-label="Rocco menu">
        <div className="dn-in">
          {ITEMS.map((i) => <Link key={i.path} href={base + i.path} className={active(i.path) ? "on" : ""} aria-current={active(i.path) ? "page" : undefined}><span aria-hidden>{i.icon}</span> {i.label}</Link>)}
          {settings}
        </div>
      </nav>

      <nav className="dn-bar" aria-label="Rocco menu">
        {ITEMS.filter((i) => "main" in i).map((i) => <Link key={i.path} href={base + i.path} className={active(i.path) ? "on" : ""} aria-current={active(i.path) ? "page" : undefined}><span aria-hidden>{i.icon}</span><small>{i.label}</small></Link>)}
        <button className={more || ITEMS.some((i) => !("main" in i) && active(i.path)) ? "on" : ""} onClick={() => setMore((m) => !m)} aria-expanded={more}><span aria-hidden>☰</span><small>More</small></button>
      </nav>
      {more && (
        <div className="dn-sheet" role="dialog" aria-label="More" onClick={(e) => e.target === e.currentTarget && setMore(false)}>
          <div className="dn-sheet-in">
            {ITEMS.filter((i) => !("main" in i)).map((i) => <Link key={i.path} href={base + i.path} className={active(i.path) ? "on" : ""}><span aria-hidden>{i.icon}</span> {i.label}</Link>)}
            {settings}
            <Link href="/help"><span aria-hidden>❓</span> Help</Link>
            <form action="/api/auth/signout" method="post"><button className="linkbtn muted">Sign out</button></form>
          </div>
        </div>
      )}
    </>
  );
}
