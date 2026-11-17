"use client";
import Papa from "papaparse";
import { useState } from "react";
import { readTables } from "@/lib/readTable";
import { Md } from "../Md";

const SAMPLES = [
  { id: "search", label: "Search terms", file: "/samples/sp-search-term-report.csv", says: "Analyze my search term report" },
  { id: "campaign", label: "Budgets", file: "/samples/sp-campaign-report.csv", says: "Which campaigns need budget changes?" },
  { id: "business", label: "Business Report", file: "/samples/business-report.csv", says: "Why aren't my listings converting?" },
  { id: "inventory", label: "Inventory", file: "/samples/restock-inventory.csv", says: "Am I about to run out of anything?" },
  { id: "bulk", label: "Bulk file", file: "/samples/sp-bulk-structure.csv", says: "Audit my campaign structure" },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  const res = await fetch("/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result.content.map((c: { text: string }) => c.text).join("\n");
}

/** Runs Rocco's real MCP tools (the same ones Claude/ChatGPT call) on sample reports or the visitor's own file. */
export function Playground() {
  const [active, setActive] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(label: string, says: string, csv: () => Promise<string>) {
    setActive(label); setSaid(says); setBusy(true); setOut("");
    try { setOut(await callTool("analyze_report", { report_csv: await csv() })); }
    catch (e) { setOut(`**Rocco couldn't read that.** ${e instanceof Error ? e.message : ""}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="play">
      <div className="play-picks">
        {SAMPLES.map((s) => (
          <button key={s.id} className={`chipbtn${active === s.label ? " on" : ""}`} disabled={busy}
            onClick={() => run(s.label, s.says, async () => (await fetch(s.file)).text())}>{s.label}</button>
        ))}
        <label className={`chipbtn${active === "yours" ? " on" : ""}`}>
          📎 Your own report
          <input type="file" accept=".csv,.tsv,.txt,.xlsx" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) run("yours", `Analyze ${f.name}`, async () => {
              const tables = await readTables(f);
              const best = tables.sort((a, b) => b.length - a.length)[0] ?? [];
              return Papa.unparse(best as unknown[][]);
            });
          }} />
        </label>
      </div>
      <div className="play-out">
        {!active && <p className="muted" style={{ margin: 0 }}>Pick a sample report. This runs the exact tool your AI calls (<code className="code">analyze_report</code>) and shows what Rocco sends back.</p>}
        {active && (
          <>
            <div className="chat-you" style={{ marginLeft: "auto" }}>{said}</div>
            <div className="chat-tool"><span>⚙︎</span> Rocco · <code>analyze_report</code>{busy ? " · working…" : ""}</div>
            {out && <Md text={out} />}
          </>
        )}
      </div>
      <p className="fine" style={{ marginTop: 8 }}>Your own file is sent to Rocco only for this answer and isn&apos;t stored. In your AI, Rocco also remembers and tracks changes (personal connector).</p>
    </div>
  );
}
