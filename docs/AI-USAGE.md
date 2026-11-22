# Where Rocco uses AI (Claude), what it costs, and what it's allowed to do

Model: Claude Opus 5.5 (`claude-opus-5-5`) via `ANTHROPIC_API_KEY`. Without the key, everything still works: the rules
engine ranks fixes and the dashboard shows them; only the AI extras switch off.

## The rule: AI judges and talks, the rules engine decides
Every fix, every number and every Amazon change comes from the **rules engine** (`lib/rules/`, `lib/jobs.ts`) and
Amazon's own reports. Claude never invents a fix, never computes money, never makes a change. That's why it can't
suggest an action Rocco can't take as a job: it can only pick from fix codes the engine produced, and any code or
number not in the input is thrown away (`checkPlan` in `lib/manager.ts`, `guardNumbers` in `lib/history.ts`).

## Every place Claude is called
| Where | When | How often | Guard rails |
|---|---|---|---|
| **Morning manager** (`lib/manager.ts` curate) | After the daily data pull, per brand, **only if today's fixes changed** | ≤ 1 call per brand per day (paying teams only) | Picks only existing codes; numbers must appear in the input; structured output |
| **Ask Rocco** (dashboard box, texts, Slack) | When someone asks | Max **40 per team per day** across all three (`spend("ask")`) | Amazon-only scope (`lib/prompts/scope.ts`); can't change anything; ≤ 900 output tokens |
| **Texted screenshots/files** | When a paying team texts a picture | Same 40/day limit | Paying teams only |
| **Before Rocco read** (`lib/history.ts`) | Once per Amazon account, at connect | 1 call per account, ever | Sees only the rules-made summary; numbers checked |
| **Free text replies by iMessage** (`lib/brain.ts`) | Texts that aren't a command | Same 40/day limit | Amazon-only scope |

Not AI: the daily pull, every fix, approvals, Tidy, restock/listing/Buy Box alerts, results a week later, the change log.

## Off-topic questions
`lib/prompts/scope.ts` is added to every prompt that answers a person: anything that isn't the seller's Amazon
business gets one sentence ("I only work on your Amazon account") plus an Amazon suggestion. Short, low-effort calls,
so an off-topic attempt costs a fraction of a cent, and the 40/day limit caps abuse.

## When the best move is something Rocco can't do
- **Morning plan:** impossible by design (codes only).
- **Ask Rocco:** the prompt lists exactly what Rocco can do in Amazon, what it only flags, and what it doesn't do. For
  anything outside, it says "I can't do that one for you yet" and gives the manual steps. It never claims an action.
- **Data we don't pull** (e.g. Sponsored Brands, Display, pricing reports): Rocco says it doesn't have that data.
- **Learning what to build next:** these questions show up in the Vercel logs (`[ai] Their question` lines); review
  weekly and add the most-asked job types one at a time (each new job = a rules function + an Action + scope.ts line).

## Cost (see docs/COSTS.md for the full table)
- Estimate at 100 sellers: **~$250/month** (morning manager + Ask), about $2.50 per seller, ~2% of revenue. AI/API
  costs don't count against hackathon profit.
- What keeps it low: manager only reruns when fixes change; prompts are cached; Ask capped at 40/day/team; history
  read once; no AI for unpaid visitors (all AI routes check the plan).
- **Measure the real number:** every call logs `[ai] <label> in=… out=… cached=…` in Vercel → Logs. The Anthropic
  Console → Usage page shows the bill. Set a monthly spend limit there (suggested: $400) so a bug can never run away.

## Changing the AI
- Prompts live in `lib/prompts/` (versioned). Bump the version string when wording changes.
- Model is set in `lib/manager.ts` and `lib/brain.ts` (`MODEL`).
