"use client";
import { useEffect, useState } from "react";
import { HireButton } from "@/components/home/HireButton";

/** Boardy's floating message bar, Rocco's way: after the hero scrolls away, one pill with the one action. */
export function StickyHire({ price, google }: { price: string; google?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      // Hidden over the price section: its own Hire button is right there, and two would stack.
      const pr = document.getElementById("price")?.getBoundingClientRect();
      const overPrice = !!pr && pr.top < window.innerHeight && pr.bottom > 0;
      setShow(window.scrollY > window.innerHeight * 0.9 && !overPrice && window.innerHeight + window.scrollY < document.body.scrollHeight - 420);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`sticky-hire${show ? " show" : ""}`} aria-hidden={!show} inert={!show}>
      <span className="sticky-txt">I can run your Amazon business.</span>
      <HireButton price={price} google={google} label="Hire Rocco" className="btn sticky-btn" />
    </div>
  );
}
