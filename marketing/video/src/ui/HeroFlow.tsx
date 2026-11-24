import React from "react";

/**
 * Port of components/home/HeroFlow.tsx (.hf): the four steps above the fold. Same markup and copy; the active
 * step comes from the scene instead of a timer. `step` 0 to 3 lights that step, 4 marks all four done.
 */
export const FLOW_WIDTH = 520;
export const HeroFlow: React.FC<{ step: number; channel?: { ic: string; pre: string; name: string; reply: string } }> = ({ step, channel = { ic: "💬", pre: "in", name: "iMessage", reply: "YES" } }) => {
  const cls = (i: number) => (step === i ? "on" : step > i ? "done" : "");
  return (
    <div className="hf">
      <ol>
        <li className={cls(0)}><span className="hf-ic">🔌</span><span className="hf-t">Connect Seller Central + Ads <b>once</b></span></li>
        <li className={cls(1)}><span className="hf-ic">☀️</span><span className="hf-t">Every morning I find <b>what to fix</b></span></li>
        <li className={`hf-approve ${cls(2)}`}>
          <span className="hf-ic">👍</span>
          <span className="hf-t">You approve {channel.pre} <b className="hf-ch">{channel.ic} {channel.name}</b></span>
          {step >= 2 && <em className="hf-bub">{channel.reply}</em>}
        </li>
        <li className={cls(3)}><span className="hf-ic">{step >= 3 ? "✅" : "🛠️"}</span><span className="hf-t">I make it live, <b>then check it worked</b></span></li>
      </ol>
    </div>
  );
};
