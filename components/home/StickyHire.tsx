"use client";
import { useEffect, useState } from "react";
import { HireButton } from "@/components/home/HireButton";

/** Boardy's floating message bar, Rocco's way: after the hero scrolls away, one pill with the one action. */
export function StickyHire({ price, google }: { price: string; google?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.9 && window.innerHeight + window.scrollY < document.body.scrollHeight - 420);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`sticky-hire${show ? " show" : ""}`} aria-hidden={!show}>
      <span className="sticky-txt">I can run your Amazon business.</span>
      <HireButton price={price} google={google} label="Connect Amazon" className="btn sticky-btn" />
    </div>
  );
}
