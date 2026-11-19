/**
 * Outside the US: Boardy's "Your AI knows you" section, Rocco's way: Amazon already emails reports; point them at
 * Rocco's inbox once and he reads every one. Left: steps. Right: the email from Amazon + Rocco's text back.
 */
export function ReportsInbox() {
  return (
    <div className="two">
      <div className="two-text">
        <span className="kicker">No Claude needed</span>
        <h2 className="big-h">Amazon emails your reports.<br /><span className="blue">I read every one.</span></h2>
        <p className="two-lede">Amazon&apos;s Ads console can email reports on a schedule. Send them to your Rocco inbox once, and I turn each one into fixes and text your team.</p>
        <ol className="hsteps static">
          <li><span className="hsteps-n">01</span><div><b>Schedule your reports to me.</b><p>Ads console → Reports → Schedule → add your Rocco inbox. Once, about 3 minutes.</p></div></li>
          <li><span className="hsteps-n">02</span><div><b>I read them as they land.</b><p>Search terms, campaigns, placements, business and inventory reports.</p></div></li>
          <li><span className="hsteps-n">03</span><div><b>You approve, I give you the clicks.</b><p>Exact steps for each change. Text DONE and I check the result next week.</p></div></li>
        </ol>
        <p className="lock">🔒 I never log in to your Amazon account. I only read what Amazon sends to your inbox.</p>
      </div>

      <div className="two-vis">
        <div className="hchat">
          <div className="hchat-bar"><span /><span /><span /><b>✉️ New message</b><em>EXAMPLE</em></div>
          <div className="mail-rows">
            <p><span>From</span>Amazon Ads</p>
            <p><span>To</span>r7k2qx@in.rocco.works</p>
            <p><span>Subject</span>Scheduled report: Sponsored Products · Search term</p>
          </div>
          <div className="hchat-body">
            <p className="mail-file">📎 Sponsored_Products_Search_term_report.csv <small>2,140 rows</small></p>
            <p className="mail-note">Your scheduled report for Nov 18, 2026 is attached.</p>
          </div>
          <div className="hchat-foot"><span>Delivered daily, 6:00 AM</span><span>Read by Rocco</span></div>
        </div>
        <div className="toast">
          <span className="toast-av">🦝</span>
          <div><b>Rocco</b><p>Got today&apos;s report. 3 fixes worth ~$270/mo. Top one: “plastic chopping mat”, 41 clicks, 0 orders. Reply YES N1.</p></div>
        </div>
      </div>
    </div>
  );
}
