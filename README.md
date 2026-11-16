# rocco.works

Rocco: an AI raccoon that roasts Amazon ad accounts and hands over the fixes. Built for the Ship or Die hackathon.

- App: Next.js 16 (App Router) + TypeScript. Tools live in `app/tools/<slug>`, registered in `lib/tools.ts`.
- Rules engine: `lib/rules/` (pure, unit-tested). Parsers: `lib/parsers/`. Fixtures: `fixtures/`.
- Go-live steps: `docs/GO-LIVE.md`. Plan: `docs/AMAZON-BRAIN-PLAN.md`. Log: `docs/PROGRESS.md`.

```bash
npm install && npm run dev
npm test
```
