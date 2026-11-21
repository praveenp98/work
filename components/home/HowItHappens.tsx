"use client";
import { useEffect, useState } from "react";
import { RoccoHead } from "@/components/Rocco";

/**
 * Boardy-style "How an intro happens": three numbered steps on the left (the active one gets a blue line that
 * fills), a phone on the right that shows that step. Steps advance by themselves; tapping one jumps to it.
 */
const STEPS_US = [
  { t: "I check your account every morning", d: "Seller Central and Amazon Ads, connected once with Amazon's own sign-in. I read them the way a senior Amazon manager would." },
  { t: "I find what's worth doing", d: "Stock to send, bids to move, waste to cut, listings to fix. Ranked by money, with the reason." },
  { t: "You tap approve, I make the change", d: "Right in Amazon: checked first, logged, undoable. A week later I tell you what it actually did." },
];
const STEPS_INTL = [
  { t: "Amazon emails me your reports", d: "You schedule them to your Rocco inbox once. Every morning they land, and I read them the way a senior Amazon manager would." },
  { t: "I find what's worth doing", d: "Stock to send, bids to move, waste to cut, listings to fix. Ranked by money, with the reason." },
  { t: "You say yes, I give you the exact clicks", d: "Reply YES and I send the steps for the Ads console. Text DONE, and I check a week later if it worked." },
];
const MS = 5200;

const CHECKS_US = ["Seller Central: sales & traffic", "Amazon Ads: 2,140 search terms", "Inventory: 38 SKUs", "Listings: 12 ASINs", "Last week's 3 changes"];
const CHECKS_INTL = ["📥 Amazon Ads email: search terms", "📥 Amazon Ads email: campaigns", "📥 Business report (forwarded)", "Inventory: 38 SKUs", "Last week's 3 changes"];
const FIXES = [
  { i: "📦", t: "Send 340 units to FBA", s: "Runs out in 9 days", v: "~$2,900 sales kept" },
  { i: "✂️", t: "Cut 2 money-burning terms", s: "41 clicks, 0 orders", v: "+$63/mo" },
  { i: "📈", t: "Raise bid 12% on a winner", s: "ACoS 18% vs 30% target", v: "+$210/mo" },
];

export function HowItHappens({ intl = false }: { intl?: boolean }) {
  const STEPS = intl ? STEPS_INTL : STEPS_US;
  const CHECKS = intl ? CHECKS_INTL : CHECKS_US;
  const [step, setStep] = useState(0);
  const [k, setK] = useState(0); // restarts the progress bar animation
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => { setStep((s) => (s + 1) % STEPS.length); setK((x) => x + 1); }, MS);
    return () => clearTimeout(id);
  }, [step, k]);

  return (
    <div className="two">
      <div className="two-text">
        <h2 className="big-h">How a fix<br />happens.</h2>
        <ol className="hsteps">
          {STEPS.map((s, i) => (
            <li key={s.t} className={i === step ? "on" : ""} onClick={() => { setStep(i); setK((x) => x + 1); }}>
              <span className="hsteps-bar" aria-hidden>{i === step && <i key={k} style={{ animationDuration: `${MS}ms` }} />}</span>
              <span className="hsteps-n">0{i + 1}</span>
              <div><b>{s.t}</b><p>{s.d}</p></div>
            </li>
          ))}
        </ol>
      </div>

      <div className="two-vis" aria-hidden>
        <div className="hphone">
          <div className="hphone-notch" />
          <div className="hphone-top">
            <span className="hphone-av"><svg width="26" height="22" viewBox="15 5 170 140"><RoccoHead mood="smirk" id="hih" /></svg></span>
            <b>Rocco ›</b>
          </div>
          <div className="hphone-body" key={step}>
            <p className="hphone-time">Today 8:00 AM</p>
            {step === 0 && (
              <div className="pb pb-check">
                <p className="bub">Morning check 🔎</p>
                <ul>{CHECKS.map((c, i) => <li key={c} style={{ animationDelay: `${0.3 + i * 0.55}s` }}><span>✓</span>{c}</li>)}</ul>
              </div>
            )}
            {step === 1 && (
              <div className="pb">
                <p className="bub">☀️ Yesterday: $4,120 sales, ACoS 24%. 3 things worth doing today:</p>
                {FIXES.map((f, i) => (
                  <div key={f.t} className="fixc" style={{ animationDelay: `${0.3 + i * 0.5}s` }}>
                    <span>{f.i}</span><div><b>{f.t}</b><small>{f.s}</small></div><em>{f.v}</em>
                  </div>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="pb">
                <p className="bub">Reply YES to approve all 3.</p>
                <p className="bub mine" style={{ animationDelay: ".6s" }}>yes</p>
                <p className="bub" style={{ animationDelay: "1.4s" }}>{intl ? "Here are the exact clicks for each ✍️ Text DONE when they're made." : "Done ✅ Made all 3 in Amazon. I'll check the results Monday."}</p>
                <p className="bub" style={{ animationDelay: "2.4s" }}>📅 Mon: the bid change worked. +$210/mo, ACoS held at 19%.</p>
              </div>
            )}
          </div>
          <div className="hphone-input"><span>Text Rocco</span><i>↑</i></div>
        </div>
        <div className="float-card" key={`f${step}`}>
          <small>{["Checking", "Found", "Approved"][step]}</small>
          <b>{["5 sources, 2 minutes", "3 fixes · ~$3,170", "3 of 3 · logged"][step]}</b>
        </div>
      </div>
    </div>
  );
}
