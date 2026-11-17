/**
 * Small server-rendered SVG charts for Rocco's analytics (no client JS).
 * Rules (dataviz skill): one y-axis per chart, thin 2px lines, ≥8px markers, recessive grid, legend for ≥2 series
 * plus direct end labels, text in ink tokens (never series color), hover via enlarged hit targets with <title>,
 * and a table view for every chart. Colors come from CSS vars validated for light and dark (--series-1/2).
 */
import type { ReactNode } from "react";

export interface Point { x: string; y: number }
export interface Series { name: string; color: string; points: Point[] }

const W = 440, H = 220, PAD = { l: 46, r: 78, t: 12, b: 28 };

function nice(max: number): number {
  if (max <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  const n = max / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function LineChart({ title, series, format, target, caption, integer }: { title: string; series: Series[]; format: (n: number) => string; target?: { value: number; label: string }; caption?: ReactNode; integer?: boolean }) {
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort();
  // 4 even steps on a "nice" step size, so tick labels are round numbers.
  const raw = Math.max(...series.flatMap((s) => s.points.map((p) => p.y)), target?.value ?? 0) * 1.08;
  const step = Math.max(integer ? 1 : 0, nice(raw / 4));
  const top = step * 4;
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const X = (x: string) => PAD.l + (xs.length === 1 ? iw / 2 : (xs.indexOf(x) / (xs.length - 1)) * iw);
  const Y = (y: number) => PAD.t + ih - (y / top) * ih;
  const ticks = [0, 1, 2, 3, 4].map((i) => step * i);
  // Keep end labels apart: if a series' last value sits on the target line, move the target label below it.
  const ends = series.map((s) => [...s.points].sort((a, b) => a.x.localeCompare(b.x)).at(-1)).filter(Boolean).map((p) => Y(p!.y));
  const targetDy = target && ends.some((y) => Math.abs(y - Y(target.value)) < 14) ? 16 : 0;
  const multi = series.length > 1;

  return (
    <figure className="chart">
      <figcaption><b>{title}</b>{caption && <span>{caption}</span>}</figcaption>
      {multi && (
        <ul className="chart-legend">{series.map((s) => <li key={s.name}><i style={{ background: s.color }} />{s.name}</li>)}</ul>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={Y(t)} y2={Y(t)} className="chart-grid" />
            <text x={PAD.l - 8} y={Y(t) + 4} textAnchor="end" className="chart-axis">{format(t)}</text>
          </g>
        ))}
        {xs.map((x, i) => (xs.length <= 8 || i % Math.ceil(xs.length / 6) === 0 || i === xs.length - 1) && (
          <text key={x} x={X(x)} y={H - 8} textAnchor="middle" className="chart-axis">{shortDate(x)}</text>
        ))}
        {target && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={Y(target.value)} y2={Y(target.value)} className="chart-target" />
            <text x={W - PAD.r + 6} y={Y(target.value) + 4 + targetDy} className="chart-axis">{target.label}</text>
          </g>
        )}
        {series.map((s) => {
          const pts = [...s.points].sort((a, b) => a.x.localeCompare(b.x));
          const d = pts.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
          const last = pts.at(-1);
          return (
            <g key={s.name}>
              {pts.length > 1 && <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p) => (
                <g key={p.x} className="chart-pt">
                  <circle cx={X(p.x)} cy={Y(p.y)} r={4} fill={s.color} className="chart-dot" />
                  <circle cx={X(p.x)} cy={Y(p.y)} r={14} fill="transparent"><title>{`${s.name} · ${shortDate(p.x)}: ${format(p.y)}`}</title></circle>
                </g>
              ))}
              {last && <text x={X(last.x) + 10} y={Y(last.y) + 4} className="chart-label">{multi ? `${s.name} ` : ""}{format(last.y)}</text>}
            </g>
          );
        })}
      </svg>
      <details className="chart-table">
        <summary>Show as table</summary>
        <table>
          <thead><tr><th>Date</th>{series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead>
          <tbody>{xs.map((x) => <tr key={x}><td>{shortDate(x)}</td>{series.map((s) => { const p = s.points.find((q) => q.x === x); return <td key={s.name}>{p ? format(p.y) : "–"}</td>; })}</tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Horizontal bars for one measure (magnitude): label, bar, value. One hue; status color only with a label. */
export function BarList({ title, rows, format, caption, color = "var(--series-1)" }: { title: string; rows: { label: string; value: number; note?: string; status?: "critical" }[]; format: (n: number) => string; caption?: ReactNode; color?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <figure className="chart">
      <figcaption><b>{title}</b>{caption && <span>{caption}</span>}</figcaption>
      <ul className="bars">
        {rows.map((r) => (
          <li key={r.label} title={`${r.label}: ${format(r.value)}${r.note ? ` · ${r.note}` : ""}`}>
            <span className="bars-label">{r.label}{r.note && <em>{r.note}</em>}</span>
            <span className="bars-track"><span className="bars-fill" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: r.status === "critical" ? "var(--status-critical)" : color }} /></span>
            <span className="bars-val">{r.status === "critical" && "⚠ "}{format(r.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Alerts as a list (state, not magnitude): icon + label carry the status, never color alone. */
export function IssueList({ title, caption, rows }: { title: string; caption?: ReactNode; rows: { label: string; note: string }[] }) {
  return (
    <figure className="chart">
      <figcaption><b>{title}</b>{caption && <span>{caption}</span>}</figcaption>
      <ul className="issues">{rows.map((r) => <li key={r.label}><span aria-hidden>⚠</span><div><b>{r.label}</b><small>{r.note}</small></div></li>)}</ul>
    </figure>
  );
}

/** KPI tile: the number is the chart. Delta vs previous check, with arrow + words (never color alone). */
export function Stat({ label, value, delta, good }: { label: string; value: string; delta?: string | null; good?: boolean | null }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <b>{value}</b>
      {delta && <small className={good == null ? "" : good ? "up-good" : "up-bad"}>{delta}</small>}
    </div>
  );
}
