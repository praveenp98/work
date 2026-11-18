"use client";
import { useEffect, useState } from "react";
import { autopilotCron, SELLING_PARTNER_URL } from "@/lib/connectors";

/**
 * Boardy-style setup: one card, one action, one step at a time. Used on a person's Rocco page (/w/<key>)
 * and on /setup. Nothing to scroll, no wall of URLs: tap, paste, done.
 */
type AI = "claude" | "chatgpt" | "claude_code";
type Step = "ai" | "rocco" | "seller" | "ask" | "daily" | "done";
const ORDER: Step[] = ["ai", "rocco", "seller", "ask", "daily", "done"];
const ASK = "Rocco, morning check";

const AIS: { id: AI; label: string; sub: string }[] = [
  { id: "claude", label: "Claude", sub: "web, desktop or phone" },
  { id: "chatgpt", label: "ChatGPT", sub: "Plus, Pro or Team" },
  { id: "claude_code", label: "Claude Code", sub: "terminal" },
];

const OPEN = {
  claude: { connectors: "https://claude.ai/settings/connectors", chat: `https://claude.ai/new?q=${encodeURIComponent(ASK)}` },
  chatgpt: { connectors: "https://chatgpt.com/", chat: `https://chatgpt.com/?q=${encodeURIComponent(ASK)}` },
};

function store(key: string, v?: string): string | null {
  try {
    if (v === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, v);
  } catch { /* private mode: fine */ }
  return null;
}

export function StartSteps({ token: initial, compact }: { token?: string | null; compact?: boolean }) {
  const [token, setToken] = useState<string | null>(initial ?? null);
  const [ai, setAi] = useState<AI>("claude");
  const [step, setStep] = useState<Step>("ai");
  const [copied, setCopied] = useState("");
  const [err, setErr] = useState("");
  const key = `rocco-start-${token ?? "anon"}`;

  useEffect(() => {
    if (!initial) {
      const t = new URLSearchParams(window.location.search).get("t");
      if (t && /^rw_[A-Za-z0-9]{24}$/.test(t)) setToken(t);
    }
    const saved = store(`rocco-start-${initial ?? "anon"}`);
    if (saved) {
      const [a, s] = saved.split(":") as [AI, Step];
      if (AIS.some((x) => x.id === a)) setAi(a);
      if (ORDER.includes(s)) setStep(s);
    }
  }, [initial]);
  useEffect(() => { store(key, `${ai}:${step}`); }, [key, ai, step]);

  // With a key (their Rocco page or a text link): the private URL, no sign-in. Otherwise: sign-in URL, and
  // Claude/ChatGPT open Rocco's Connect page, which creates their Rocco.
  const connector = token ? `https://rocco.works/mcp/${token}` : "https://rocco.works/mcp/login";
  const go = (s: Step) => { setStep(s); setCopied(""); setErr(""); };
  const next = () => go(ORDER[Math.min(ORDER.indexOf(step) + 1, ORDER.length - 1)]);
  const back = () => go(ORDER[Math.max(ORDER.indexOf(step) - 1, 0)]);

  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); }
    catch { window.prompt("Copy this:", text); setCopied(label); }
  }

  function pickAi(a: AI) {
    setAi(a);
    if (token) void fetch("/api/workspace/prefs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, ai: a }) }).catch(() => {});
    go("rocco");
  }

  const n = ORDER.indexOf(step);
  const name = AIS.find((x) => x.id === ai)!.label;

  return (
    <section className={`start${compact ? " compact" : ""}`} aria-live="polite">
      {step !== "done" && <div className="start-dots" aria-label={`Step ${n + 1} of 5`}>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i <= n ? "on" : ""} />)}</div>}

      {step === "ai" && (
        <div className="start-card">
          <h2>Where does your team use AI?</h2>
          <p className="start-sub">Rocco works inside it, next to Amazon&apos;s own connectors.</p>
          <div className="start-choices">
            {AIS.map((x) => (
              <button key={x.id} className="start-choice" onClick={() => pickAi(x.id)}>
                <b>{x.label}</b><span>{x.sub}</span>
              </button>
            ))}
          </div>
          {err && <p className="err">{err}</p>}
        </div>
      )}

      {step === "rocco" && (
        <div className="start-card">
          <h2>Add Rocco to {name}</h2>
          {ai === "claude_code" ? (
            <>
              <p className="start-sub">Paste this in your terminal.</p>
              <button className="btn start-main" onClick={() => copy(`claude mcp add --transport http rocco ${connector}`, "rocco")}>{copied === "rocco" ? "Copied ✓" : "Copy command"}</button>
            </>
          ) : (
            <>
              <p className="start-sub">
                {ai === "claude"
                  ? <>Copy your Rocco link, then in Claude: <b>Add custom connector</b> → name it <b>Rocco</b> → paste → <b>Add</b>.{token ? "" : <> Tap <b>Connect</b> when Rocco asks.</>}</>
                  : <>Copy your Rocco link, then in ChatGPT: <b>Settings → Apps &amp; Connectors → Advanced</b> → turn on <b>Developer mode</b> → <b>Create</b> → paste{token ? " (no sign-in)" : <>, then tap <b>Connect</b> when Rocco asks</>}.</>}
              </p>
              <button className="btn start-main" onClick={() => copy(connector, "rocco")}>{copied === "rocco" ? "Copied ✓ Now open " + name : "1. Copy my Rocco link"}</button>
              <a className="btn ghost start-second" href={OPEN[ai].connectors} target="_blank" rel="noreferrer">2. Open {name} connectors ↗</a>
            </>
          )}
          <p className="fine">{token ? "This link is your team's private Rocco." : "Connecting creates your team's private Rocco."} It remembers every change and checks if it worked.</p>
          <Nav back={back} next={next} nextLabel="I added Rocco →" />
        </div>
      )}

      {step === "seller" && (
        <div className="start-card">
          <h2>Plug in Seller Central</h2>
          {ai === "claude" && (
            <>
              <p className="start-sub">In Claude&apos;s connectors: <b>Browse connectors</b> → search <b>Amazon Selling Partner</b> → <b>Connect</b> → sign in to Seller Central.</p>
              <a className="btn start-main" href={OPEN.claude.connectors} target="_blank" rel="noreferrer">Open Claude connectors ↗</a>
            </>
          )}
          {ai === "chatgpt" && (
            <>
              <p className="start-sub">Same as Rocco: <b>Create</b> a connector with Amazon&apos;s link, then sign in to Seller Central.</p>
              <button className="btn start-main" onClick={() => copy(SELLING_PARTNER_URL, "sp")}>{copied === "sp" ? "Copied ✓" : "Copy Amazon's link"}</button>
            </>
          )}
          {ai === "claude_code" && (
            <>
              <p className="start-sub">Paste this, then type <b>/mcp</b> in Claude Code and sign in to Seller Central.</p>
              <button className="btn start-main" onClick={() => copy(`claude mcp add --transport http amazon-seller ${SELLING_PARTNER_URL}`, "sp")}>{copied === "sp" ? "Copied ✓" : "Copy command"}</button>
            </>
          )}
          <p className="fine">Amazon&apos;s official connector. Rocco never sees your password, and nothing changes without your approval. Have Amazon Ads API access? <a href="/setup#all">Add the Ads connector too</a>.</p>
          <Nav back={back} next={next} nextLabel="Done →" skip={next} />
        </div>
      )}

      {step === "ask" && (
        <div className="start-card">
          <h2>Now just ask</h2>
          <p className="start-sub">Say <b>&ldquo;{ASK}&rdquo;</b>. Rocco pulls your numbers, finds the waste and gives you fixes to approve with one reply.</p>
          {ai === "claude_code"
            ? <button className="btn start-main" onClick={() => copy(ASK, "ask")}>{copied === "ask" ? "Copied ✓" : "Copy “" + ASK + "”"}</button>
            : <a className="btn start-main" href={OPEN[ai].chat} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => go("daily"), 400)}>Open {name} and ask ↗</a>}
          <Nav back={back} next={next} nextLabel="I asked →" />
        </div>
      )}

      {step === "daily" && (
        <div className="start-card">
          <h2>Make it daily</h2>
          {ai === "claude_code" ? (
            <>
              <p className="start-sub">Add this to your crontab. Every weekday morning Claude Code runs the check, and I text everyone the numbers.</p>
              <button className="btn start-main" onClick={() => copy(autopilotCron(), "cron")}>{copied === "cron" ? "Copied ✓" : "Copy the cron line"}</button>
            </>
          ) : (
            <>
              <p className="start-sub">If {name} has scheduled tasks on your plan, add one: <b>&ldquo;{ASK}&rdquo;</b> every weekday at 8:00. If not, skip it: I&apos;ll text you a one-tap link each morning, and push the numbers to your team the moment it runs.</p>
              <button className="btn start-main" onClick={() => copy(ASK, "daily")}>{copied === "daily" ? "Copied ✓" : `Copy “${ASK}”`}</button>
            </>
          )}
          <p className="fine">You&apos;ll get a 🔔 text the moment I&apos;m on.</p>
          <Nav back={back} next={next} nextLabel="Done →" skip={next} />
        </div>
      )}

      {step === "done" && (
        <div className="start-card">
          <h2>You&apos;re set 🦝</h2>
          <p className="start-sub">Every morning, say &ldquo;{ASK}&rdquo; (or let your team text Rocco). Your change log, results and money saved show up {initial ? "right here" : "on your Rocco page (Rocco gives you the link in Claude)"}.</p>
          <button className="linkbtn" onClick={() => go("ai")}>Start over</button>
        </div>
      )}
    </section>
  );
}

function Nav({ back, next, nextLabel, skip }: { back: () => void; next: () => void; nextLabel: string; skip?: () => void }) {
  return (
    <div className="start-nav">
      <button className="linkbtn muted" onClick={back}>← Back</button>
      {skip && <button className="linkbtn muted" onClick={skip}>Skip</button>}
      <button className="linkbtn" onClick={next}>{nextLabel}</button>
    </div>
  );
}
