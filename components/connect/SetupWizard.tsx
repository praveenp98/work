"use client";
import Link from "next/link";
import { useState } from "react";
import { claudeCodeCommands, CONNECTORS, mcpJson, MORNING_CHECK_COMMAND, REGIONS, type Client, type Region } from "@/lib/connectors";

function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* blocked */ } }}>
      {ok ? "Copied ✓" : label}
    </button>
  );
}

function Block({ title, code }: { title: string; code: string }) {
  return (
    <div className="setup-block">
      <div className="setup-block-head"><b>{title}</b><Copy value={code} /></div>
      <pre className="code">{code}</pre>
    </div>
  );
}

const CLIENTS: { id: Client; label: string }[] = [
  { id: "claude", label: "Claude (web & desktop)" },
  { id: "claude_code", label: "Claude Code" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "cursor", label: "Cursor / other MCP apps" },
];

/** Pick app + region → exact steps, URLs and config for Amazon Ads + Seller Central + Rocco. */
export function SetupWizard() {
  const [client, setClient] = useState<Client>("claude");
  const [region, setRegion] = useState<Region>("na");
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function personal() {
    setBusy(true); setErr("");
    const res = await fetch("/api/workspace", { method: "POST" }).catch(() => null);
    const d = res ? await res.json().catch(() => null) : null;
    if (d?.ok) setToken(d.token); else setErr(d?.error || "Couldn't create a workspace right now. The shared URL works too.");
    setBusy(false);
  }

  return (
    <div className="setup">
      <div className="setup-pick">
        <div>
          <span className="connect-label">1 · Your AI app</span>
          <div className="play-picks">{CLIENTS.map((c) => <button key={c.id} className={`chipbtn${client === c.id ? " on" : ""}`} onClick={() => setClient(c.id)}>{c.label}</button>)}</div>
        </div>
        <div>
          <span className="connect-label">2 · Your Amazon marketplace</span>
          <div className="play-picks">{(Object.keys(REGIONS) as Region[]).map((r) => <button key={r} title={REGIONS[r].markets} className={`chipbtn${region === r ? " on" : ""}`} onClick={() => setRegion(r)}>{REGIONS[r].label}</button>)}</div>
          <p className="fine" style={{ margin: "6px 0 0" }}>{REGIONS[region].markets}</p>
        </div>
        <div>
          <span className="connect-label">3 · Rocco with memory (recommended)</span>
          {token ? <p className="ok" style={{ margin: 0 }}>Personal Rocco ready. Your URLs below include it. Keep them private. <Link href={`/w/${token}`}>Dashboard →</Link></p>
            : <><button className="btn small" onClick={personal} disabled={busy}>{busy ? "Creating…" : "Create my personal Rocco"}</button> <span className="fine">free, no signup</span>{err && <p className="err">{err}</p>}</>}
        </div>
      </div>

      <h3 style={{ marginTop: 26 }}>Your three connectors</h3>
      <div className="setup-conns">
        {CONNECTORS.map((c) => (
          <div className="card" key={c.id}>
            <span className="tag">{c.status} · by {c.by}</span>
            <h3>{c.name}</h3>
            <p className="muted" style={{ marginTop: 0 }}>{c.what}</p>
            <div className="connect-url"><code>{c.url(region, token)}</code><Copy value={c.url(region, token)} /></div>
            <p className="fine" style={{ marginBottom: 0 }}>Needs: {c.needs}</p>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 26 }}>Steps for {CLIENTS.find((c) => c.id === client)!.label}</h3>
      {client === "claude" && (
        <ol className="connect-steps">
          <li>Open <b>Settings → Connectors</b> (or Customize → Connectors).</li>
          <li><b>Amazon Selling Partner:</b> click <b>Browse connectors</b>, search &ldquo;Amazon Selling Partner&rdquo;, connect, and sign in to Seller Central. (Or add it as a custom connector with the URL above.)</li>
          <li><b>Amazon Ads:</b> <b>Add custom connector</b> → name &ldquo;Amazon Ads&rdquo;, paste the Amazon Ads URL above, then sign in with your Amazon Ads account.</li>
          <li><b>Rocco:</b> <b>Add custom connector</b> → name &ldquo;Rocco&rdquo;, paste the Rocco URL above. No sign-in.</li>
          <li>In a new chat, turn on all three in the tools menu and say <b>&ldquo;Rocco, morning check.&rdquo;</b></li>
        </ol>
      )}
      {client === "chatgpt" && (
        <ol className="connect-steps">
          <li><b>Settings → Apps &amp; Connectors → Advanced settings</b> → turn on <b>Developer mode</b>.</li>
          <li><b>Create</b> a connector for each URL above: Amazon Ads (sign in with your Amazon Ads account), Amazon Seller Central (sign in to Seller Central), and Rocco (authentication: none).</li>
          <li>In a new chat, choose <b>Developer mode</b>, enable the three connectors, and say <b>&ldquo;Rocco, morning check.&rdquo;</b></li>
          <li className="fine">Amazon lists Claude first for the Seller Central connector. If it won&apos;t connect in ChatGPT yet, Rocco still works with Amazon Ads alone.</li>
        </ol>
      )}
      {client === "claude_code" && (
        <>
          <ol className="connect-steps">
            <li>Run these in your terminal (or paste the <code className="code">.mcp.json</code> into your project folder).</li>
            <li>Start Claude Code, type <b>/mcp</b>, and sign in to Amazon Ads and Seller Central when asked.</li>
            <li>Save the morning-check command, then just type <b>/morning-check</b> every day.</li>
          </ol>
          <Block title="Terminal: add all three" code={claudeCodeCommands(region, token)} />
          <Block title=".mcp.json (project scope, alternative)" code={mcpJson(region, token)} />
          <Block title=".claude/commands/morning-check.md" code={MORNING_CHECK_COMMAND} />
        </>
      )}
      {client === "cursor" && (
        <>
          <ol className="connect-steps">
            <li>Paste this into <code className="code">~/.cursor/mcp.json</code> (or your app&apos;s MCP settings), then sign in to the Amazon connectors when prompted.</li>
            <li>Ask: <b>&ldquo;Rocco, morning check.&rdquo;</b></li>
          </ol>
          <Block title="mcp.json" code={mcpJson(region, token, "cursor")} />
        </>
      )}
      <p className="fine" style={{ marginTop: 14 }}>
        No Amazon Ads API access yet? Add Seller Central + Rocco now; Rocco works with what&apos;s connected and can read an exported ads report until your API access is approved.
        Rocco never asks for your Amazon password: you sign in to Amazon&apos;s own connectors directly.
      </p>
    </div>
  );
}
