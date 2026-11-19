/** "A day with me": what having Rocco feels like, as a timeline of messages. */
const DAY = [
  { t: "8:00", who: "rocco", text: "☀️ Yesterday: $4,120 sales, ACoS 24%. 3 fixes ready, worth ~$270/mo. Reply YES N1 N2 B1." },
  { t: "8:03", who: "you", text: "yes N1 N2 B1" },
  { t: "8:04", who: "rocco", text: "Done ✅ Applied in Claude after your confirm. I'll check them next Monday." },
  { t: "12:40", who: "rocco", text: "📦 Kitchen Set Blue: 9 days of stock left. Send 340 units this week. Ease its ads until then? Reply YES A1." },
  { t: "Mon 9:00", who: "rocco", text: "📊 Last week's B1 worked: lower bid saved $86/mo and sales held. 2 of 3 changes paid off." },
];

export function DayWithRocco() {
  return (
    <ol className="day">
      {DAY.map((d) => (
        <li key={d.t} className={d.who}>
          <time>{d.t}</time>
          <p>{d.text}</p>
        </li>
      ))}
    </ol>
  );
}
