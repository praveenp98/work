"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Boardy's round message button: hidden on the homepage hero, slides in once you scroll; always on other pages. */
export function ChatFab() {
  const home = usePathname() === "/";
  const [show, setShow] = useState(!home);
  useEffect(() => {
    if (!home) { setShow(true); return; }
    const on = () => setShow(window.scrollY > 260);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [home]);
  return (
    <Link href="/#text" className={`chat-fab${show ? " show" : ""}`} aria-label="Text Rocco" tabIndex={show ? 0 : -1}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M12 3.5c-4.8 0-8.5 3.2-8.5 7.2 0 2.2 1.1 4.1 2.9 5.4l-.6 3.4 3.4-1.8c.9.2 1.8.3 2.8.3 4.8 0 8.5-3.2 8.5-7.3S16.8 3.5 12 3.5z" /></svg>
    </Link>
  );
}
