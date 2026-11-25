"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { acctLabel, type AccountHealth } from "@/lib/health";
import { ConnectButton } from "@/components/start/ConnectAmazon";
import { officeAct } from "@/lib/client/office";

const ICON: Record<string, string> = { ok: "✓", loading: "…", missing: "!", off: "○", error: "!" };
const ago = (iso?: string) => {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

/**
 * Data health: is Amazon connected, which of the 4 reports Rocco reads are in, and if one isn't, exactly why and what
 * to do. "Check connection now" asks DataDoe live and pulls fresh data (at most once an hour).
 */
export function DataHealth({ token, brand }: { token: string; brand?: string }) {
  const router = useRouter();
  const [acc, setAcc] = useState<AccountHealth[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const d = await fetch("/api/w/amazon/health", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null);
    if (d?.ok) setAcc(d.accounts);
    return d;
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const mine = acc?.find((a) => a.name === brand) ?? acc?.[0];
  const others = (acc ?? []).filter((a) => a !== mine);
  const needs = !!acc?.some((a) => !a.allOk);
  useEffect(() => { if (needs) setOpen(true); }, [needs]);

  async function check() {
    setBusy(true); setMsg("Asking Amazon for the latest status…");
    track("connection_checked");
    officeAct("dock", "Asking Amazon for fresh data…");
    await load();
    setMsg("Pulling fresh data from Amazon (up to a minute)…");
    const s = await fetch("/api/w/amazon/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token }) }).then((r) => r.json()).catch(() => null);
    const d = await load();
    setBusy(false);
    const n = s?.lastSync?.kinds?.length ?? 0, errs: string[] = s?.lastSync?.errors ?? [];
    if (s?.skipped) setMsg(s.failed ? `I just tried a moment ago. Try again in ${s.retryInMin} min.` : `Your data is fresh (pulled in the last hour). I can pull again in ${s.retryInMin} min, and I pull every morning by myself.`);
    else if (s?.ok && n) {
      officeAct("desk", `Pulled ${n} report${n === 1 ? "" : "s"}. Running the numbers…`);
      setMsg(`✓ Pulled ${n} report${n === 1 ? "" : "s"} just now${errs.length ? `; ${errs.length} still failed (details above)` : ". Today's jobs are updated"}.`);
      router.refresh();
    } else if (s?.ok) setMsg(errs.length ? `The pull ran but nothing came in. ${errs[0]}` : "The pull ran but Amazon sent nothing new.");
    else setMsg(s?.error ?? (d?.ok ? "Status refreshed. Details above." : "Couldn't reach Amazon right now. Try again in a few minutes."));
  }

  if (!acc) return <div className="dh dh-wait"><span className="dh-dot loading" /> Checking your Amazon connection…</div>;
  if (!mine) return null;
  const list = [mine, ...others];

  return (
    <section className={`dh${needs ? " warn" : ""}`} aria-label="Amazon connection">
      <button className="dh-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`dh-dot ${mine.allOk ? "ok" : mine.reports.some((r) => r.state === "loading") && !mine.reports.some((r) => r.state === "missing" || r.state === "error" || r.state === "off") ? "loading" : "warn"}`} />
        <span className="dh-sum"><b>Amazon connection</b><small>{mine.summary}{mine.lastPull ? ` · pulled ${ago(mine.lastPull)}` : ""}{others.length ? ` · +${others.length} account${others.length > 1 ? "s" : ""}` : ""}</small></span>
        <span className="dh-tog" aria-hidden>{open ? "Hide" : "Details"}</span>
      </button>
      {open && (
        <div className="dh-body">
          {list.map((a) => (
            <div key={a.id} className="dh-acct">
              <div className="dh-acct-h">
                <b>{acctLabel(a)}</b>
                <span className={`dh-pill ${a.sc.state}`}>Seller Central: {a.sc.state === "ok" ? "connected" : a.sc.state === "loading" ? "first load" : a.sc.state === "reauth" ? "reconnect" : "off"}</span>
                <span className={`dh-pill ${a.ads.state}`}>Amazon Ads: {a.ads.state === "ok" ? "connected" : a.ads.state === "loading" ? "first load" : a.ads.state === "reauth" ? "reconnect" : "not connected"}</span>
              </div>
              <ul className="dh-list">
                {a.reports.map((r) => (
                  <li key={r.kind} className={`s-${r.state}`}>
                    <span className="dh-ic" aria-hidden>{ICON[r.state]}</span>
                    <div>
                      <b>{r.name}</b> <small>· {r.powers}</small>
                      {r.state === "ok" ? <p className="dh-ok">In · updated {ago(r.at)}</p> : <><p className="dh-why">{r.why}</p>{r.fix && <p className="dh-fix">{r.fix}</p>}</>}
                    </div>
                  </li>
                ))}
              </ul>
              {(a.ads.state === "off" || a.ads.state === "reauth" || a.sc.state === "reauth") && <ConnectButton token={token} reconnect={a.id} label={a.ads.state === "off" ? "Connect Amazon Ads" : "Reconnect Amazon"} className="btn small" />}
            </div>
          ))}
          <div className="dh-act">
            <button className="btn small" disabled={busy} onClick={check}>{busy ? "Checking…" : "Check connection now"}</button>
            <span className="fine">The first full load takes up to 48 hours after connecting (DataDoe emails when it&apos;s done). After that I pull every morning by myself.</span>
          </div>
          {msg && <p className="fine" role="status">{msg}</p>}
        </div>
      )}
    </section>
  );
}
