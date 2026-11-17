"use client";
import Link from "next/link";
import { useState } from "react";

const SHARED = "https://rocco.works/mcp";

function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="btn small"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1600); } catch { /* clipboard blocked */ }
      }}
    >
      {ok ? "Copied ✓" : label}
    </button>
  );
}

const STEPS = {
  claude: ["Connect Amazon's official Ads connector in Claude (Settings → Connectors), plus any Seller Central or other Amazon tools you use", "Click “Add custom connector”, name it Rocco, paste the URL above", "In a chat, turn on Amazon Ads + Rocco in the tools menu"],
  chatgpt: ["Turn on Developer mode (Settings → Apps & Connectors → Advanced) and connect Amazon's official Ads connector, plus your other Amazon tools", "Create a connector: name Rocco, paste the URL above, authentication none", "In a chat, pick Amazon Ads + Rocco from the tools"],
};

/** The hero's main action: copy the connector URL (shared or personal) and add it to Claude or ChatGPT. */
export function ConnectBox({ compact = false }: { compact?: boolean }) {
  const [app, setApp] = useState<"claude" | "chatgpt">("claude");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [err, setErr] = useState("");
  const url = token ? `${SHARED}/${token}` : SHARED;

  async function create() {
    setState("busy");
    const res = await fetch("/api/workspace", { method: "POST" }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (data?.ok) { setToken(data.token); setState("idle"); }
    else { setErr(data?.error || "Couldn't create a workspace right now."); setState("error"); }
  }

  return (
    <div className="connect">
      <div className="connect-tabs" role="tablist">
        <button role="tab" aria-selected={app === "claude"} className={app === "claude" ? "on" : ""} onClick={() => setApp("claude")}>Claude</button>
        <button role="tab" aria-selected={app === "chatgpt"} className={app === "chatgpt" ? "on" : ""} onClick={() => setApp("chatgpt")}>ChatGPT</button>
      </div>
      <label className="connect-label">{token ? "Your personal Rocco (with memory). Keep it private." : "Connector URL"}</label>
      <div className="connect-url">
        <code>{url}</code>
        <Copy value={url} />
      </div>
      {!token && (
        <div className="connect-personal">
          <button className="linkbtn" onClick={create} disabled={state === "busy"}>
            {state === "busy" ? "Creating…" : "＋ Get my personal Rocco with memory"}
          </button>
          <span className="fine"> remembers your changes, checks results, briefs you daily. Free, no signup.</span>
          {state === "error" && <p className="err">{err}</p>}
        </div>
      )}
      {token && (
        <p className="fine" style={{ margin: "8px 0 0" }}>
          Your dashboard: <Link href={`/w/${token}`}>rocco.works/w/{token.slice(0, 7)}…</Link> · bookmark it. Anyone with this URL can use your workspace.
        </p>
      )}
      {!compact && (
        <ol className="connect-steps">
          {STEPS[app].map((s) => <li key={s}>{s}</li>)}
          <li>Say <b>&ldquo;Rocco, morning check.&rdquo;</b> That&apos;s it.</li>
        </ol>
      )}
    </div>
  );
}
