import React from "react";
import { RoccoHead } from "./Mascot";

/**
 * A phone with a message thread in one of three generic looks. The frame is the site's phone (.hphone in
 * app/connect.css); the chat chrome is look-alike only: no app logos, no app names.
 */
export type ChatStyle = "imessage" | "whatsapp" | "slack";
export interface Msg { from: "rocco" | "you"; text: string }
export interface MsgView extends Msg { shown: number; typing?: boolean }

export const PHONE_WIDTH = 350;
const PHONE_HEIGHT = 500;

const LOOK = {
  imessage: { bg: "#ffffff", them: "#e9e9eb", themInk: "#111", me: "#2f7cf6", meInk: "#fff", input: "Text Rocco" },
  whatsapp: { bg: "#efe7dd", them: "#ffffff", themInk: "#111b21", me: "#d9fdd3", meInk: "#111b21", input: "Message" },
  slack: { bg: "#ffffff", them: "transparent", themInk: "#1d1c1d", me: "transparent", meInk: "#1d1c1d", input: "Message Rocco" },
} as const;

const Dots: React.FC<{ t: number; color?: string }> = ({ t, color = "#8e8e93" }) => (
  <span style={{ display: "inline-flex", gap: 5, padding: "4px 2px" }}>
    {[0, 1, 2].map((i) => <i key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t * 2 - i * 0.22) * Math.PI * 2)) }} />)}
  </span>
);

export const Phone: React.FC<{ look: ChatStyle; messages: MsgView[]; clock: number; time?: string }> = ({ look, messages, clock, time = "Today 8:00 AM" }) => {
  const L = LOOK[look];
  const avatar = <span className="hphone-av" style={{ width: 44, height: 44 }}><svg width="30" height="25" viewBox="15 5 170 140"><RoccoHead mood="smirk" id={`ph-${look}`} /></svg></span>;
  return (
    <div className="hphone" style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, background: L.bg }}>
      <div className="hphone-notch" />
      {look === "imessage" && <div className="hphone-top" style={{ background: "#fdfcfa" }}>{avatar}<b style={{ fontSize: 13 }}>Rocco ›</b></div>}
      {look === "whatsapp" && (
        <div style={{ padding: "44px 14px 10px", display: "flex", alignItems: "center", gap: 10, background: "#f6f5f3", borderBottom: "1px solid #e2ddd5" }}>
          <span style={{ fontSize: 20, color: "#5d6676" }}>‹</span>{avatar}
          <div style={{ display: "grid", lineHeight: 1.25 }}><b style={{ fontSize: 15 }}>Rocco</b><small style={{ fontSize: 11.5, color: "#5d6676" }}>online</small></div>
        </div>
      )}
      {look === "slack" && (
        <div style={{ padding: "44px 14px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e2ddd5" }}>
          <span style={{ fontSize: 20, color: "#5d6676" }}>‹</span>
          <div style={{ display: "grid", lineHeight: 1.25 }}><b style={{ fontSize: 15 }}># amazon</b><small style={{ fontSize: 11.5, color: "#5d6676" }}>Rocco and your team</small></div>
        </div>
      )}
      <div className="hphone-body" style={{ padding: "12px 12px", gap: look === "slack" ? 14 : 9, alignContent: "end" }}>
        <p className="hphone-time" style={{ fontSize: 11.5 }}>{time}</p>
        {messages.map((m, i) => {
          const mine = m.from === "you";
          const wrap: React.CSSProperties = { opacity: m.shown, transform: `translateY(${(1 - m.shown) * 10}px) scale(${0.97 + 0.03 * m.shown})`, transformOrigin: mine ? "100% 100%" : "0 100%" };
          if (look === "slack") {
            return (
              <div key={i} style={{ ...wrap, display: "grid", gridTemplateColumns: "34px 1fr", gap: 9, alignItems: "start" }}>
                {mine ? <span style={{ width: 34, height: 34, borderRadius: 9, background: "#1c2433", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>Y</span> : <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg2)", display: "grid", placeItems: "center" }}><svg width="26" height="22" viewBox="15 5 170 140"><RoccoHead mood="smirk" id={`sl-${i}`} /></svg></span>}
                <div style={{ fontSize: 15, lineHeight: 1.42, color: L.themInk }}>
                  <b style={{ fontSize: 14.5 }}>{mine ? "You" : "Rocco"}</b>{!mine && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#ece9e3", color: "#5d6676" }}>APP</span>}
                  <div>{m.typing ? <Dots t={clock} /> : m.text}</div>
                </div>
              </div>
            );
          }
          return (
            <p key={i} className={`bub${mine ? " mine" : ""}`} style={{ ...wrap, fontSize: 15.5, lineHeight: 1.4, padding: "10px 13px", maxWidth: "84%", background: mine ? L.me : L.them, color: mine ? L.meInk : L.themInk, fontWeight: mine && look === "imessage" ? 600 : 400, boxShadow: look === "whatsapp" ? "0 1px 1px rgba(17,27,33,.12)" : undefined, whiteSpace: "pre-wrap" }}>
              {m.typing ? <Dots t={clock} /> : m.text}
              {look === "whatsapp" && mine && !m.typing && <span style={{ marginLeft: 8, fontSize: 11, color: "#3b8fd9" }}>✓✓</span>}
            </p>
          );
        })}
      </div>
      <div className="hphone-input" style={{ fontSize: 13.5, background: "#fff" }}><span>{L.input}</span><i>↑</i></div>
    </div>
  );
};
