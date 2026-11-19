"use client";
import { useEffect, useState } from "react";
import { TrialSheet } from "@/components/dash/TrialSheet";

/**
 * Boardy-style setup: one card, one action, one step at a time. Used on a person's Rocco page (/w/<key>)
 * and on /setup. Claude only: it's the AI with Amazon's official connectors. Claude is the hands (pulls Amazon
 * data, makes the changes you confirm); Rocco is the manager and the memory.
 */
type Step = "rocco" | "seller" | "ask" | "daily" | "done";
const ORDER: Step[] = ["rocco", "seller", "ask", "daily", "done"];
const ASK = "Rocco, morning check";
const CONNECTORS = "https://claude.ai/settings/connectors";
const CHAT = `https://claude.ai/new?q=${encodeURIComponent(ASK)}`;
const CONNECTOR_URL = "https://rocco.works/mcp/login";
const OWNER_MSG = "Hi! Can you switch on AI agents in Seller Central for me? Seller Central → Settings → Manage Agents → connect your AI agent and enable the \"Amazon Selling Partner\" plugin for my login. Takes a minute, once. It's so Rocco (rocco.works) can check our ads, stock and listings every morning. Thanks!";

function store(key: string, v?: string): string | null {
  try {
    if (v === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, v);
  } catch { /* private mode: fine */ }
  return null;
}

export function StartSteps({ token: initial, compact, trial }: { token?: string | null; compact?: boolean; trial?: { url: string; price: string } }) {
  const [token, setToken] = useState<string | null>(initial ?? null);
  const [step, setStep] = useState<Step>("rocco");
  const [copied, setCopied] = useState("");
  const [owner, setOwner] = useState(false);
  const key = `rocco-start-${token ?? "anon"}`;

  useEffect(() => {
    if (!initial) {
      const t = new URLSearchParams(window.location.search).get("t");
      if (t && /^rw_[A-Za-z0-9]{24}$/.test(t)) setToken(t);
    }
    const saved = store(`rocco-start-${initial ?? "anon"}`)?.split(":").at(-1) as Step | undefined;
    if (saved && ORDER.includes(saved)) setStep(saved);
  }, [initial]);
  useEffect(() => { store(key, `claude:${step}`); }, [key, step]);

  const go = (s: Step) => { setStep(s); setCopied(""); };
  const next = () => go(ORDER[Math.min(ORDER.indexOf(step) + 1, ORDER.length - 1)]);
  const back = () => go(ORDER[Math.max(ORDER.indexOf(step) - 1, 0)]);

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); }
    catch { window.prompt("Copy this:", text); setCopied(label); }
  }

  const n = ORDER.indexOf(step);
  const offerTrial = !!trial && (step === "ask" || step === "done");

  return (
    <section className={`start${compact ? " compact" : ""}`} aria-live="polite">
      {trial && <TrialSheet url={trial.url} price={trial.price} open={offerTrial} />}
      {step !== "done" && <div className="start-dots" aria-label={`Step ${n + 1} of 4`}>{[0, 1, 2, 3].map((i) => <span key={i} className={i <= n ? "on" : ""} />)}</div>}

      {step === "rocco" && (
        <div className="start-card">
          <h2>Add me to Claude</h2>
          <p className="start-sub">Copy my link. In Claude: <b>Settings → Connectors → Add custom connector</b>, name it <b>Rocco</b>, paste, <b>Add</b>. When Claude opens Rocco, tap <b>Connect</b>.</p>
          <button className="btn start-main" onClick={() => copy(CONNECTOR_URL, "rocco")}>{copied === "rocco" ? "Copied ✓ Now open Claude" : "1. Copy my Rocco link"}</button>
          <a className="btn ghost start-second" href={CONNECTORS} target="_blank" rel="noreferrer">2. Open Claude connectors ↗</a>
          <p className="fine">{token ? "Connect links it to this team's Rocco: same memory for everyone." : "Connecting creates your team's private Rocco."} Works in Claude on the web, desktop and phone.</p>
          <Nav back={back} next={next} nextLabel="I added Rocco →" first />
        </div>
      )}

      {step === "seller" && (
        <div className="start-card">
          <h2>Plug in Amazon</h2>
          <p className="start-sub">In the same Claude connectors page: <b>Browse connectors</b> → <b>Amazon Selling Partner</b> → <b>Connect</b> → sign in to Seller Central. Got Amazon Ads? Add <b>Amazon Ads</b> the same way.</p>
          <a className="btn start-main" href={CONNECTORS} target="_blank" rel="noreferrer">Open Claude connectors ↗</a>
          <p className="fine">Amazon&apos;s official connectors. I never see your password, and nothing changes without your approval.</p>
          <button className="linkbtn" onClick={() => setOwner((o) => !o)}>Amazon says &ldquo;ask the primary user&rdquo;? {owner ? "▲" : "▼"}</button>
          {owner && (
            <div className="owner-box">
              <p className="start-sub">Only your account&apos;s <b>primary user</b> can switch AI agents on. It takes them a minute, once. Send them this:</p>
              <pre className="owner-msg">{OWNER_MSG}</pre>
              <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn small" onClick={() => copy(OWNER_MSG, "owner")}>{copied === "owner" ? "Copied ✓" : "Copy message"}</button>
                <a className="btn ghost small" href={`sms:&body=${encodeURIComponent(OWNER_MSG)}`}>Text it</a>
              </div>
              <p className="fine">Meanwhile: send me a report file (Seller Central → Reports → download) and I&apos;ll work from that.</p>
            </div>
          )}
          <Nav back={back} next={next} nextLabel="Done →" skip={next} />
        </div>
      )}

      {step === "ask" && (
        <div className="start-card">
          <h2>Now just ask</h2>
          <p className="start-sub">Say <b>&ldquo;{ASK}&rdquo;</b>. Claude pulls your numbers from Amazon, I find the waste, and you get fixes to approve with one reply.</p>
          <a className="btn start-main" href={CHAT} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => go("daily"), 400)}>Open Claude and ask ↗</a>
          <Nav back={back} next={next} nextLabel="I asked →" />
        </div>
      )}

      {step === "daily" && (
        <div className="start-card">
          <h2>Make it daily</h2>
          <p className="start-sub">If your Claude plan has scheduled tasks, add one: <b>&ldquo;{ASK}&rdquo;</b> every weekday at 8:00. If not, skip it: I&apos;ll text you a one-tap link each morning and push the numbers to your team the moment it runs.</p>
          <button className="btn start-main" onClick={() => copy(ASK, "daily")}>{copied === "daily" ? "Copied ✓" : `Copy “${ASK}”`}</button>
          <p className="fine">You&apos;ll get a 🔔 text the moment I&apos;m on.</p>
          <Nav back={back} next={next} nextLabel="Done →" skip={next} />
        </div>
      )}

      {step === "done" && (
        <div className="start-card">
          <h2>You&apos;re set 🦝</h2>
          <p className="start-sub">Every morning, say &ldquo;{ASK}&rdquo; in Claude (or let your team text me). Fixes, results and money saved show up {initial ? "right here" : "on your Rocco page"}.</p>
          <button className="linkbtn" onClick={() => go("rocco")}>Start over</button>
        </div>
      )}
    </section>
  );
}

function Nav({ back, next, nextLabel, skip, first }: { back: () => void; next: () => void; nextLabel: string; skip?: () => void; first?: boolean }) {
  return (
    <div className="start-nav">
      {first ? <span /> : <button className="linkbtn muted" onClick={back}>← Back</button>}
      {skip && <button className="linkbtn muted" onClick={skip}>Skip</button>}
      <button className="linkbtn" onClick={next}>{nextLabel}</button>
    </div>
  );
}
