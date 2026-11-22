"use client";
import { track } from "@/lib/analytics";
import { useState } from "react";

/**
 * Team card: who's on this Rocco, add a teammate by email, remove, hand over, reset the private link, leave.
 * Teammates sign in with Google using the email they were added with and land on this same Rocco.
 */
interface Person { email: string; role: "owner" | "member"; name?: string; joined: boolean }
type Me = { email: string; role: "owner" | "member" | null } | null;

export function TeamCard({ token, me: me0, people: people0, google }: { token: string; me: Me; people: Person[]; google: boolean }) {
  const [people, setPeople] = useState(people0);
  const [me, setMe] = useState(me0);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [invite, setInvite] = useState("");
  const [copied, setCopied] = useState(false);
  const owner = me?.role === "owner";

  async function act(action: string, target?: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action + (target ?? "")); setMsg(null); setInvite(""); setCopied(false); track(`team_${action}`);
    const d = (await fetch("/api/w/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, action, email: target }) }).then((r) => r.json()).catch(() => null)) as { ok?: boolean; error?: string; people?: Person[]; me?: Me; url?: string; invite?: string } | null;
    setBusy("");
    if (!d?.ok) { setMsg({ ok: false, text: d?.error ?? "No connection. Try again." }); return; }
    if (action === "leave") { window.location.href = "/"; return; }
    if (d.people) setPeople(d.people);
    if (d.me) setMe(d.me);
    if (action === "add") { setEmail(""); setInvite(d.invite ?? ""); setMsg({ ok: true, text: `Added ${target}. Send them this:` }); }
    if (action === "transfer") setMsg({ ok: true, text: `${target} owns this Rocco now. You're still on the team.` });
    if (d.url) { setMsg({ ok: true, text: action === "reset" ? "New private link made. Old copies no longer work. Moving you to it…" : `Removed ${target}. I also made a new private link, so their copy stops working. Moving you to it…` }); setTimeout(() => { window.location.href = d.url!; }, 1600); }
  }

  if (!me?.role) {
    return (
      <section className="rd-card tm">
        <h3>Your team</h3>
        <p className="fine">Add teammates by email: they sign in with Google and land right here. Sign in first so I know who you are.</p>
        {google && <a className="btn small" href="/api/auth/google?intent=signin" rel="nofollow">Sign in with Google</a>}
      </section>
    );
  }

  return (
    <section className="rd-card tm">
      <h3>Your team</h3>
      <ul className="tm-list">
        {people.map((p) => (
          <li key={p.email}>
            <span className="tm-av" aria-hidden>{(p.name || p.email)[0].toUpperCase()}</span>
            <div className="tm-who">
              <b>{p.name || p.email.split("@")[0]}{p.email === me.email && <em> (you)</em>}</b>
              <small>{p.email}</small>
            </div>
            <span className={`tm-role ${p.role}`}>{p.role === "owner" ? "Owner" : p.joined ? "Member" : "Invited"}</span>
            {owner && p.role === "member" && (
              <span className="tm-acts">
                {p.joined && <button className="linkbtn" disabled={!!busy} onClick={() => act("transfer", p.email, `Make ${p.email} the owner? They'll manage people and the plan. You stay on as a member.`)}>Make owner</button>}
                <button className="linkbtn danger" disabled={!!busy} onClick={() => act("remove", p.email, `Remove ${p.email}? I'll also make a new private link so their copy stops working.`)}>Remove</button>
              </span>
            )}
          </li>
        ))}
      </ul>

      {owner && (
        <form className="tm-add" onSubmit={(e) => { e.preventDefault(); if (email.trim()) act("add", email.trim()); }}>
          <label htmlFor="tm-email" className="sr-only">Teammate&apos;s email</label>
          <input id="tm-email" type="email" placeholder="teammate@brand.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          <button className="btn small" disabled={!!busy || !email.trim()}>{busy === "add" + email.trim() ? "Adding…" : "Add"}</button>
        </form>
      )}

      {msg && <p className={msg.ok ? "tm-ok" : "tm-err"} role="status">{msg.text}</p>}
      {invite && (
        <div className="tm-invite">
          <p>{invite}</p>
          <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(invite); setCopied(true); } catch { /* select manually */ } }}>{copied ? "Copied ✓" : "Copy message"}</button>
        </div>
      )}

      <p className="fine tm-how">{owner
        ? "Teammates see and approve today's jobs, ask Rocco, and see the change log; every approval shows who made it. Handing over? Add them, wait until they've signed in once, then Make owner. Billing stays on the card that paid."
        : "You can see and approve today's jobs. The owner manages people and the plan."}</p>
      <div className="tm-foot">
        {owner
          ? <button className="linkbtn" disabled={!!busy} onClick={() => act("reset", undefined, "Make a new private link? Old copies (forwarded or bookmarked) stop working. Teammates just sign in with Google again.")}>Reset private link</button>
          : <button className="linkbtn danger" disabled={!!busy} onClick={() => act("leave", undefined, "Leave this Rocco? You'll need a new invite to come back.")}>Leave this Rocco</button>}
      </div>
    </section>
  );
}
