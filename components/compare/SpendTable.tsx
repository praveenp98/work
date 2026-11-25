import { costAt, DRPPC, ROCCO, TYPICAL_SPENDS } from "@/lib/competitors";

const $ = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const cell = (c: { month: number; year: number }) => <>{$(c.month)}/mo<br /><small>{$(c.year)}/yr</small></>;

/**
 * Dr. PPC vs Rocco at typical monthly ad spend ($2k, $5k, $10k). Every number is computed from Dr. PPC's listed price
 * in lib/competitors.ts ($299/mo + 2% of ad spend; 2% only on Full Circle Partner) and Rocco's PLAN.
 * Mobile: cells carry data-label, shown by the .cmp-t CSS captions in app/connect.css.
 */
export function SpendTable() {
  const rows = TYPICAL_SPENDS.map((s) => costAt(s));
  return (
    <section className="pr-sec">
      <h2>What it costs at typical ad spend</h2>
      <div className="cmp-wrap">
        <table className="cmp-t cmp-spend">
          <thead><tr><th>Monthly ad spend</th><th>Dr. PPC</th><th>Dr. PPC on Full Circle Partner</th><th>Rocco yearly</th><th>Rocco monthly</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.adSpend}>
              <th scope="row">{$(r.adSpend)} a month in ads</th>
              <td data-label="Dr. PPC">{cell(r.drppc)}</td>
              <td data-label="Dr. PPC, Partner plan">{cell(r.partner)}</td>
              <td data-label="Rocco yearly" className="us"><b>{cell(r.roccoYearly)}</b></td>
              <td data-label="Rocco monthly" className="us"><b>{cell(r.roccoMonthly)}</b></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="fine">
        Dr. PPC: $299 a month plus 2% of ad spend, month-to-month; on Full Circle Partner the $299 base is waived and you pay 2% of ad spend only ({DRPPC.url.replace("https://", "")}, checked {DRPPC.checked}). At all three spends the Partner plan costs less than Rocco; it costs more than Rocco&apos;s yearly plan only above about {$(Math.round(ROCCO.annual / 12 / DRPPC.pctOfSpend / 100) * 100)} a month in ads. Rocco&apos;s price is the same at every spend. Prices change; check theirs before you decide.
      </p>
    </section>
  );
}
