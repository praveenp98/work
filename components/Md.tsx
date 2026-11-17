import { Fragment } from "react";

/** Tiny Markdown renderer for Rocco's tool output: headings, bullets, bold, italics, code, fenced blocks. */
function inline(t: string, key: string) {
  const parts = t.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((p, i) => {
    const k = `${key}-${i}`;
    if (p.startsWith("**") && p.endsWith("**")) return <b key={k}>{p.slice(2, -2)}</b>;
    if (p.startsWith("_") && p.endsWith("_") && p.length > 2) return <i key={k}>{p.slice(1, -1)}</i>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={k} className="code">{p.slice(1, -1)}</code>;
    return <Fragment key={k}>{p}</Fragment>;
  });
}

export function Md({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  let fence: string[] | null = null;
  const flush = (i: number) => { if (list.length) { out.push(<ul key={`ul${i}`}>{list}</ul>); list = []; } };
  lines.forEach((l, i) => {
    if (l.startsWith("```")) {
      if (fence) { out.push(<pre key={`f${i}`} className="code">{fence.join("\n")}</pre>); fence = null; } else { flush(i); fence = []; }
      return;
    }
    if (fence) { fence.push(l); return; }
    if (/^\s*- /.test(l)) { list.push(<li key={i} style={{ marginLeft: l.startsWith("  ") ? 18 : 0 }}>{inline(l.replace(/^\s*- /, ""), `l${i}`)}</li>); return; }
    flush(i);
    if (l.startsWith("### ")) out.push(<h4 key={i}>{inline(l.slice(4), `h${i}`)}</h4>);
    else if (l.startsWith("## ")) out.push(<h3 key={i}>{inline(l.slice(3), `h${i}`)}</h3>);
    else if (l.trim()) out.push(<p key={i}>{inline(l, `p${i}`)}</p>);
  });
  flush(lines.length);
  return <div className="md">{out}</div>;
}
