"use client";
import { useState } from "react";
import styles from "../LeadCapture.module.css";

/**
 * Partner application form: the only client JS on the partner pages. Posts to /api/partners/apply, which saves a
 * pending partner and a lead for Praveen. No call booking. Types and reach bands come from lib/partners.ts as props
 * so this file stays tiny.
 */
type Field = "name" | "email" | "website" | "type" | "reach" | "how";

export function PartnerApply({ types, reach, defaultType, title }: { types: { id: string; label: string }[]; reach: readonly string[]; defaultType?: string; title: string }) {
  const [v, setV] = useState({ name: "", email: "", website: "", type: defaultType ?? "", reach: "", how: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<{ field?: Field; msg: string } | null>(null);
  const [dupe, setDupe] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErr(null);
    const res = await fetch("/api/partners/apply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...v, page: location.pathname }) }).catch(() => null);
    const d = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string; field?: Field; duplicate?: boolean } | null;
    if (res?.ok && d?.ok) { setDupe(!!d.duplicate); setState("done"); return; }
    setErr({ field: d?.field, msg: d?.error ?? "Couldn't send that. Check your connection and try again." });
    setState("idle");
    if (d?.field) document.getElementById(`pa-${d.field === "website" ? "web" : d.field}`)?.focus();
  }

  if (state === "done") {
    return (
      <div className={`${styles.box} ${styles.done}`} role="status" id="apply">
        <p className={styles.title}>{dupe ? "You've already applied." : "Thanks. Application in."}</p>
        <p>{dupe ? "We have your application. Praveen will email you once he's read it." : "Praveen reads every application and emails you either way. Once you're approved you get your code and your page."}</p>
        <p className="fine">Meanwhile, the <a href="/free">free tools</a> are open to anyone.</p>
      </div>
    );
  }
  const bad = (f: Field) => (err?.field === f ? { "aria-invalid": true as const, "aria-describedby": "pa-err" } : {});
  return (
    <form className={styles.box} onSubmit={submit} id="apply" noValidate>
      <p className={styles.title}>{title}</p>
      <div className={styles.row}><label htmlFor="pa-name">Your name or business</label><input id="pa-name" required autoComplete="organization" value={v.name} onChange={set("name")} {...bad("name")} /></div>
      <div className={styles.row}><label htmlFor="pa-email">Email</label><input id="pa-email" type="email" required autoComplete="email" placeholder="you@yoursite.com" value={v.email} onChange={set("email")} {...bad("email")} /></div>
      <div className={styles.row}><label htmlFor="pa-web">Website or profile (optional)</label><input id="pa-web" inputMode="url" autoComplete="url" placeholder="yoursite.com" value={v.website} onChange={set("website")} {...bad("website")} /></div>
      <div className={styles.row}>
        <label htmlFor="pa-type">What describes you best</label>
        <select id="pa-type" required value={v.type} onChange={set("type")} {...bad("type")}>
          <option value="">Pick one</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div className={styles.row}>
        <label htmlFor="pa-reach">How many US Amazon sellers you reach</label>
        <select id="pa-reach" required value={v.reach} onChange={set("reach")} {...bad("reach")}>
          <option value="">Pick a range</option>
          {reach.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className={styles.row}><label htmlFor="pa-how">How would you share Rocco?</label><textarea id="pa-how" required rows={3} maxLength={600} placeholder="e.g. a post in my sellers group, a line in my newsletter, to my clients" value={v.how} onChange={set("how")} {...bad("how")} style={{ width: "100%", padding: "13px 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", font: "inherit", resize: "vertical" }} /></div>
      <div className={styles.hp} aria-hidden="true"><label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" value={v.company} onChange={set("company")} /></label></div>
      <button className={`btn ${styles.cta}`} disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my application →"}</button>
      {err && <p className={styles.err} role="alert" id="pa-err">{err.msg}</p>}
      <p className="fine" style={{ margin: 0 }}>No call, no fee. We only use your email about the partner program. <a href="/privacy">Privacy</a>.</p>
    </form>
  );
}
