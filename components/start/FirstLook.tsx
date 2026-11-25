"use client";
import { useEffect, useState } from "react";
import { LoadingText } from "@/components/LoadingText";
import type { FirstLook as Look } from "@/lib/first-look";
import { track } from "@/lib/analytics";

type Row = { name: string; country: string; look: Look | null };

/** Instant first look: live findings from the listings snapshot while Amazon's history loads (lib/first-look.ts). */
export function FirstLook({ token }: { token: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let tries = 0, stop = false;
    const go = async () => {
      const d = await fetch("/api/w/amazon/first-look", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null);
      if (stop) return;
      if (!d?.ok) { setErr(d?.error ?? "Couldn't reach Amazon right now."); return; }
      setRows(d.looks);
      const n = (d.looks as Row[]).reduce((t, r) => t + (r.look?.findings.length ?? 0), 0);
      if (n) track("first_look_ready", { findings: n });
      // Listings not in yet: try again (the route caps fresh looks at 4 an hour).
      if ((d.looks as Row[]).some((r) => !r.look || r.look.error) && ++tries < 4) setTimeout(go, 4 * 60_000);
    };
    go();
    return () => { stop = true; };
  }, [token]);

  if (err) return null;
  if (!rows) return (
    <section className="fl">
      <h2>First look, live from Amazon</h2>
      <LoadingText steps={["Reading every listing live…", "Checking stock at Amazon for each SKU…", "Asking Amazon which listings have errors…"]} every={4000} />
    </section>
  );
  return (
    <section className="fl">
      <h2>First look, live from Amazon</h2>
      <p className="fine">While your history loads, here&apos;s what I can already see. Facts only: counts and the products they are.</p>
      {rows.map((r) => (
        <div key={r.name + r.country}>
          {rows.length > 1 && <b className="fl-acct">{r.name}</b>}
          {!r.look || r.look.error ? <p className="fine">{r.look?.error ?? "Amazon hasn't sent your listings yet. I'll try again in a few minutes."}</p>
            : !r.look.findings.length ? <p className="fl-ok">✓ {r.look.active} active listings, none out of stock, no errors on the {r.look.checked} I checked. The ad jobs come with your history.</p>
            : (
              <>
                <p className="fl-sum">{r.look.skus} SKUs · {r.look.active} active · {r.look.checked} checked with Amazon just now</p>
                <ul className="fl-list">
                  {r.look.findings.map((f) => (
                    <li key={f.id} className={`sev-${f.severity}`}>
                      <button onClick={() => setOpen((o) => (o === f.id ? null : f.id))} aria-expanded={open === f.id}>
                        <span aria-hidden>{f.icon}</span><b>{f.title}</b><i aria-hidden>{open === f.id ? "▴" : "▾"}</i>
                      </button>
                      {open === f.id && (
                        <div className="fl-d">
                          <p>{f.detail}</p>
                          <ul>{f.items.map((it) => <li key={it.sku}>{it.name} <small>{it.sku}</small></li>)}</ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
        </div>
      ))}
    </section>
  );
}
