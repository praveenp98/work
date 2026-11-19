import { CopyLink } from "@/components/dash/CopyLink";
import { AppIcon } from "@/components/home/RoccoStage";

/**
 * Boardy's "Your AI knows you. I know people." for Rocco: Claude knows Amazon (official connectors), Rocco knows
 * your account (memory + a senior manager's judgment). Left: three steps + one-tap Claude + copy box. Right: a
 * Claude chat with Amazon tool calls and Rocco's memory toast.
 */
export function YourAI() {
  return (
    <div className="two">
      <div className="two-text">
        <span className="kicker">Works in Claude</span>
        <h2 className="big-h">Claude knows Amazon.<br /><span className="blue">I know your account.</span></h2>
        <p className="two-lede">Claude has Amazon&apos;s official Seller Central and Ads connectors. I plug into Claude and bring the memory and the judgment: what happened, what worked, what to do next.</p>
        <ol className="hsteps static">
          <li><span className="hsteps-n">01</span><div><b>Claude pulls the numbers.</b><p>Signed in with your own Amazon login. No passwords shared, no scraping.</p></div></li>
          <li><span className="hsteps-n">02</span><div><b>I decide what to do.</b><p>Against everything I remember about your account.</p></div></li>
          <li><span className="hsteps-n">03</span><div><b>You approve, Claude does it.</b><p>Amazon shows a preview first. Nothing changes without you.</p></div></li>
        </ol>
        <div className="ai-copy">
          <span>Add me to Claude in 2 minutes:</span>
          <code>rocco.works/mcp/login</code>
          <CopyLink value="https://rocco.works/mcp/login" label="Copy" />
        </div>
        <p className="lock">🔒 Nothing changes in Amazon until you approve it.</p>
      </div>

      <div className="two-vis">
        <div className="hchat">
          <div className="hchat-bar"><span /><span /><span /><b><AppIcon app="claude" size={16} /> Claude</b><em>EXAMPLE</em></div>
          <div className="hchat-body">
            <p className="hchat-me">Rocco, morning check</p>
            <div className="hchat-tools">
              <span>⚙️ Amazon Selling Partner · sales &amp; inventory</span>
              <span>⚙️ Amazon Ads · search term report</span>
              <span className="rr">🦝 Rocco · analyze &amp; compare with memory</span>
            </div>
            <div className="hchat-ai">
              <p><b>3 fixes worth ~$3,170</b> for Bamboo &amp; Co:</p>
              <ul>
                <li><b>S1</b> Send 340 units of Kitchen Set Blue (9 days left)</li>
                <li><b>N1</b> Negate “plastic chopping mat” ($63/mo, 0 orders)</li>
                <li><b>B1</b> Bid +12% on “bamboo cutting board”</li>
              </ul>
              <p>Approve all three?</p>
            </div>
          </div>
          <div className="hchat-foot"><span>🔒 Yours to approve</span><span>Memory by Rocco</span></div>
        </div>
        <div className="toast">
          <span className="toast-av">🦝</span>
          <div><b>Rocco</b><p>Last month you cut “plastic cutting mat” and saved $58/mo. Same pattern on N1, so I&apos;m confident.</p></div>
        </div>
      </div>
    </div>
  );
}
