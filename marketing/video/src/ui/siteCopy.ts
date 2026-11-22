/**
 * Copy lifted word for word from the site, for pieces that are inline JSX there (not importable components).
 * If the site changes, change it here. Sources are app/page.tsx unless noted.
 */

/** The "Other tools give you data. I give you decisions." table (VS in app/page.tsx). A category, never a named product. */
export const VS_HEAD = { left: "Amazon data tools", right: "Rocco" } as const;
export const VS_ROWS: [string, string, string][] = [
  ["Who notices the problem", "You, if you think to ask", "Me, every morning"],
  ["Who decides what to do", "You, from a pile of numbers", "Me, with the reason shown"],
  ["Who makes the change", "You, in Seller Central", "Me, after you tap approve"],
  ["Who checks it worked", "Nobody", "Me, a week later, measured"],
  ["Remembers your account", "Starts fresh every chat", "Every change before and after me, every result, your style"],
];
export const VS_TITLE = ["Other tools give you data.", "I give you decisions."] as const;

/** "Why skip this?" card (.hlearn). */
export const SKIP = {
  question: "Why skip this?",
  chips: ["✅ Already done", "🧭 Not my strategy", "⚠️ Too risky", "⏰ Not now"],
  picked: 1,
  noted: "🧠 Noted. Say it twice for this kind of fix and I'll stop suggesting it.",
  roiLabel: "Rocco has saved you",
} as const;

/** Tidy page copy (components/dash/TidyClient.tsx). */
export const TIDY = {
  title: "Tidy your campaigns",
  button: "Tidy my campaigns",
  busy: "Tidying in Amazon…",
  fine: "Checked with Amazon first, logged, and one tap to undo (old names back, paused ones back on). Bids, budgets and targeting don't change.",
  doneTail: "Sort by name in the Ads console and see the difference.",
} as const;

/** Job card copy (components/dash/JobCards.tsx). */
export const JOB = { head: "Today's work", pick: "Rocco's pick", making: "Making it in Amazon…", skip: "Skip", checkLater: "I'll check the results in a week." } as const;
