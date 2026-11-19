import { RoccoHead } from "@/components/Rocco";
import { AppIcon } from "@/components/home/RoccoStage";

/**
 * How Rocco and Claude split the job. Claude is the hands: it holds Amazon's official connectors, pulls the data
 * and makes the changes you confirm. Rocco is the manager: the memory of your account and a senior manager's playbook.
 */
export function HandsAndBrain() {
  return (
    <div className="hb">
      <div className="hb-row" aria-hidden>
        <div className="hb-node">
          <span className="hb-badge amz">🛒</span>
          <b>Your Amazon</b>
          <small>Seller Central + Ads</small>
        </div>
        <div className="hb-wire"><i /><i /><i /></div>
        <div className="hb-node">
          <span className="hb-badge"><AppIcon app="claude" size={26} /></span>
          <b>Claude</b>
          <small>the hands</small>
        </div>
        <div className="hb-wire rev"><i /><i /><i /></div>
        <div className="hb-node rocco">
          <span className="hb-badge"><svg width="34" height="28" viewBox="15 5 170 140" aria-hidden><RoccoHead mood="smirk" id="hb" /></svg></span>
          <b>Rocco</b>
          <small>the manager</small>
        </div>
      </div>

      <div className="hb-cols">
        <div className="hb-col">
          <h3><AppIcon app="claude" size={18} /> Claude does</h3>
          <ul>
            <li>Signs in to Amazon with <b>Amazon&apos;s official connectors</b>. No passwords shared, no scraping.</li>
            <li>Pulls your ads, sales, stock and listings every morning.</li>
            <li>Makes the changes you approve, after Amazon shows you a preview.</li>
          </ul>
        </div>
        <div className="hb-col me">
          <h3>🦝 I do</h3>
          <ul>
            <li><b>Remember everything</b> about your account: every change, every result, what you told me.</li>
            <li>Think like a senior Amazon manager: what to cut, what to push, what to restock, in what order.</li>
            <li>Check every change a week later and tell you if it worked.</li>
          </ul>
        </div>
      </div>
      <p className="hb-note">Claude without me forgets your account every chat. Me without Claude can&apos;t touch Amazon. Together: a manager who never forgets and never sleeps.</p>
    </div>
  );
}
