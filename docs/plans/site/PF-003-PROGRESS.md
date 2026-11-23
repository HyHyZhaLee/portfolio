# PF-003 — Progress handoff

## §0 CURRENT STATE (read this first when resuming)

**Ticket**: PF-003 — Static site in the approved design, with the live API status panel · **Done means**: pull request #4 merged into `main` (done) · **Branch**: merged and deleted · **Updated**: 2026-11-23 17:00

### Where things stand

- PF-003 is built, reviewed, and committed: `7cc8f4b` (the site) and `cb15c30` (`/create-pr` runs without a draft approval), both in pull request #4 against `main`. The backlog row says Done (2026-11-23).
- Last checks: frontend type, lint, and format pass; 58 tests pass with 92.4% branch coverage; the production build passes; disclosure scrub 0. Checked by eye on the local stack at 1366×768 and 390 px (plan §8, Tests).
- Pull request #4 was merged on 2026-11-23 with CI green. PF-003 is complete; this file now carries the plan for what comes next.

### Source-of-truth docs (read these; don't re-derive them)

| Doc | What it holds |
|---|---|
| [PF-003-static-site.md](PF-003-static-site.md) | How the site is built, as built: tokens, components, the F1 health-check flow, test IDs, and the content table |
| [PF-003-refined-requirement.md](PF-003-refined-requirement.md) | What it must do: FR-1 to FR-22, AC-1 to AC-12, decisions D1 to D9 |
| [backlog.md](../../prd/backlog.md) | Every ticket, its status, and the next free ID (PF-013) |
| `../portfolio-implementation-plan.md` §7 Phases 3 to 8 and §8 (private) | The remaining build phases and the deployment runbook |
| `../cv-portfolio-content-plan.md` §6 and §7 (private) | The content pack that replaces the placeholders, and its order of work |

### Decisions and why

- All portfolio copy is `todo(...)` placeholder text (D2): no owner-reviewed content pack exists yet, and only reviewed text may enter `frontend/src/content/`.
- The API status panel and footer dot moved here from PF-005 (D3); PF-005 keeps visits, stats, and the visit counter.
- No deploy in PF-003 (D4); PF-012 does the reviewed copy, `cv.pdf`, and the first Vercel deploy together (D6), so nothing public ever shows placeholders.
- No prerendering until PF-009 (D7); each route sets its title and description in the browser.
- Light scheme only, whatever the system setting, and no toggle (D8, D9); the approved dark palette stays in plan P1 for a possible toggle.
- Built differently from the first plan text, and recorded in the plan: the mobile menu switches at 1024 px (`lg`); `ChipList`, `DownloadIcon`, `CaseStudyArticle`, and `statusTone.ts` are file splits; a selected skill tints and bars its rows instead of fading the others, because faded rows failed WCAG AA.

### Gotchas (verified; don't relearn them)

- Vitest runs in Node, where openapi-fetch's `new Request()` rejects a relative URL, so `frontend/vite.config.ts` sets `test.env.VITE_API_URL` to `http://api.test` (`docs/knowledge/tooling.md`).
- Every page renders the health check, so `frontend/src/test/handlers.ts` keeps a default healthy `GET */actuator/health`; MSW fails any unhandled request. A test that renders the layout needs a `QueryClientProvider`, because the footer dot runs a query.
- jsdom has neither `window.scrollTo` nor `scrollIntoView`; `frontend/src/test/setup.ts` stubs both for `ScrollRestoration`.
- Fontsource registers the families as `'Bricolage Grotesque Variable'` and `'Source Serif 4 Variable'`.
- Browser checks: the Playwright tool saves screenshots in the private CV folder root, so delete them afterwards; send one browser action per step, because actions batched in one message can run out of order.

### What's next (in order)

1. ~~Merge pull request #4~~: done 2026-11-23; local `main` is pulled and the branch deleted.
2. **PF-004 — Backend platform**, in a fresh session: `/plan PF-004`, answer its questions, approve the plan, then `/dev PF-004`, `/review PF-004`, and `/create-pr`. Scope: error model, correlation IDs, CORS, security chain, client info and visitor hashing, bot filter, rate limiting, and a Dockerfile that runs locally; the first Render and Neon deploy moved to PF-012 (PF-004 D2). Planned and in progress on `feature/PF-004-backend-platform` (`docs/plans/platform/PF-004-backend-platform.md`).
3. **PF-005, PF-006, PF-007**, one at a time with the same four steps: visit tracking and the footer counter; the contact form with Resend; the open-source section with GitHub. Each builds on PF-004's error model, rate limiting, and visitor hashing.
4. **Content pack**, in parallel and owner-led (content plan §7, Phase C): drafts reviewed into `../portfolio-content/`, which does not exist yet. PF-012 cannot start without it.
5. **PF-012 — Reviewed copy and first deploy**: swap every placeholder in `frontend/src/content/` for the reviewed pack, add `frontend/public/cv.pdf`, add the content test that fails on any `TODO:`, then the first Vercel deploy with analytics, `robots.txt`, `sitemap.xml`, and `og-image.png`. The owner creates the Vercel project and sets `VITE_API_URL`.
6. **PF-008** (CI hardening) and **PF-009** (polish and launch: README, Lighthouse ≥ 90, cross-browser check, uptime monitor, and the prerendering decision from D7).

### Open questions

- **Favicon:** none exists and no ticket covers it. Owner decides; the suggestion is to add it to PF-012's scope. Default: no favicon until then (the only console error on the local check).
- ~~CORS check in PF-004~~: settled in `/plan PF-004` (D2): the backend deploy moved to PF-012 with the frontend deploy; PF-004 proves CORS with integration tests.
- **Skill change in pull request #4:** `cb15c30` rides along with PF-003. Owner decides whether it moves to its own pull request; default: it stays.
- **`git push` prompt:** `git push` stays on "ask" in `.claude/settings.json`. Owner decides whether to move it to "allow"; default: unchanged.

### Resume recipe

```bash
cd portfolio
git switch main && git pull && git status --short
scripts/check-services.sh                                  # what is running locally
scripts/with-node.sh pnpm --dir frontend test --run        # last run: 58 passed, 92.4% branch coverage
./backend/gradlew -p backend testUnit testIT               # not run in PF-003: no backend change
```

Key files: `frontend/src/content/placeholder.ts` (every placeholder PF-012 replaces), `frontend/src/content/caseStudies/index.ts` (the seven studies), `frontend/src/features/api-status/useApiStatus.ts` (the status decision table), `frontend/src/index.css` (design tokens).

## Log

- **2026-11-23** — Pull request #4 merged with CI green; next is `/plan PF-004`.
- **2026-11-23** — Pull request #4 opened: `7cc8f4b` (PF-003) and `cb15c30` (`/create-pr` without a draft approval). No rebase was needed.
- **2026-11-23** — `/review PF-003`: one Critical (faded rows failed AA contrast) and two Warnings (two links without test IDs; the live check not yet run). All three fixed; the live check passed at 1366×768 and 390 px.
- **2026-11-23** — D9: light scheme only, at the owner's request after the build.
- **2026-11-23** — `/dev PF-003`: slices S1 to S4 built with a background test writer per slice; plan synced and three tooling facts recorded.
- **2026-11-23** — `/plan PF-003` approved; PF-011 (pull request #3) merged first, as D5 required.
