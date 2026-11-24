# PF-008 — Quality gates and CI hardening

**Ticket**: PF-008 · **Refined requirement**: [PF-008-refined-requirement.md](PF-008-refined-requirement.md) · **Packages**: frontend (plus CI and repository configuration) · **Status**: Approved 2026-11-24 · **Last updated**: 2026-11-24

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary
Make the existing quality gates explicit and add the missing ones that live in the repository: a Playwright smoke test of the production build with no backend, a separate `e2e` workflow, and Dependabot for the three ecosystems. Branch protection and secret scanning are GitHub settings that only the owner changes, so they are written as exact steps below. Maps to implementation plan §7 Phase 7. The README badges arrive with PF-009.

Verified, unchanged: the backend gate is JaCoCo `BRANCH` minimum 0.80 in `backend/build.gradle.kts` (`tasks.check` depends on `jacocoTestCoverageVerification`), run by `.github/workflows/backend.yml`; the frontend gate is `coverage.thresholds.branches: 80` in `frontend/vite.config.ts`, run as `pnpm coverage` by `.github/workflows/frontend.yml` (92.1% branches on 2026-11-24).

## 4. Approach
Decisions, all pre-approved by the owner (blanket approval, 2026-11-24):

- **D1 Playwright included**, Chromium only, `@playwright/test` pinned to 1.65.1 (published 2026-11-13, older than a week; 1.66 is alpha only).
- **D2 Production build, no backend**: the suite runs against `vite preview` on port 4174 after `pnpm build`; a `beforeEach` route aborts every `/api/` and `/actuator/` request, so the API is unreachable (Non-Negotiable 1). Specs stay content-agnostic because the case-study text is still placeholder: they assert the `h1#case-study-title` element and that the document title is not the 404 title.
- **D3 Four tests**: the home page renders every section; `/work/scheduling-platform` renders its title; `/no-such-page` shows the 404 page; the contact form shows the three field errors for invalid input. Specs find elements by `data-test-id` (`testIdAttribute` set in the config).
- **D4 Separate workflow** `.github/workflows/e2e.yml`, job `e2e` (check name `e2e`), on pull requests touching `frontend/**`; it caches `~/.cache/ms-playwright` keyed by the Playwright version, installs Chromium only, and uploads traces on failure. `frontend.yml` is not edited (owner pull request #8 changes it).
- **D5 Isolation from other gates**: Vitest `include` is limited to `src/**/*.test.{ts,tsx}`; the specs live in `frontend/e2e/` and are type-checked and linted through `tsconfig.node.json`; test output goes to `node_modules/.tmp/test-results`, which Prettier, ESLint, and git already ignore, so `.prettierignore` is not edited.
- **D6 Script** `test:e2e` = `pnpm build && playwright test`, so a local run never tests a stale build.
- **D7 Dependabot**: weekly on Mondays; gradle `/backend`, npm `/frontend`, github-actions `/`; minor and patch updates grouped per ecosystem, majors as separate pull requests; open pull request limits 3, 3, and 2; npm `versioning-strategy: increase` so a bump keeps the pinned-version style. Review each npm pull request for an exact version (KNOWN-FE-004).

| Alternative | Why not |
|---|---|
| Add the e2e job to `frontend.yml` | Owner pull request #8 edits that file; a separate workflow also gives its own required check |
| Run the suite against `vite dev` | It would not test the production bundle that ships |
| Run against a real backend | Slower, needs Postgres, and the point is to prove the site works without it |
| Playwright on Firefox and WebKit | Larger cache and run time for a smoke test; Chromium only |

**Reuse**: `data-test-id` attributes and the section ids. **Single responsibility**: `playwright.config.ts` starts the server and sets the browser; `e2e/smoke.spec.ts` holds the four tests; `e2e.yml` runs them.

## 6. Frontend
**Test IDs used** (all existing): `home-title-heading`, `contact-form-region`, `contact-name-input`, `contact-email-input`, `contact-message-input`, `contact-submit-button`, `not-found-home-link`. No UI change, no new component, route, or content.

## 8. Files, order, risks, tests
**New**: `.github/dependabot.yml`, `.github/workflows/e2e.yml`, `frontend/playwright.config.ts`, `frontend/e2e/smoke.spec.ts`. **Modified**: `.github/workflows/backend.yml` (job display name only), `frontend/package.json` and `pnpm-lock.yaml` (the pinned dev dependency and `test:e2e`), `frontend/vite.config.ts` (Vitest `include`), `frontend/tsconfig.node.json`, `frontend/CLAUDE.md`, `docs/architecture/frontend.md`, `docs/knowledge/tooling.md`, `docs/prd/backlog.md`.

| Risk | Mitigation |
|---|---|
| Specs break when placeholder content is replaced | They assert structure and the 404 text, not case-study copy |
| Chromium download slows CI | Browser cache keyed by the Playwright version |
| Dependabot writes a `^` range | `versioning-strategy: increase` and the review rule in D7; the lockfile stays frozen in CI |
| `e2e` is required but skipped on a pull request with no frontend change | See owner step 1: the required check is added only after it has run once, and a path-filtered workflow stays pending on pull requests that do not touch `frontend/**` |

**Tests**: the four Playwright tests are the deliverable; run with `scripts/with-node.sh pnpm --dir frontend test:e2e` (first time: `scripts/with-node.sh pnpm --dir frontend exec playwright install chromium`).

### Owner-only steps (agents never change GitHub settings)
1. **Branch protection on `main`**: GitHub, repository **Settings → Branches → Add branch ruleset** (or **Add classic branch protection rule**), target `main`. Enable **Require a pull request before merging**, **Require status checks to pass before merging** with **Require branches to be up to date**, and add the checks `backend`, `frontend`, and `e2e` (pick them from the search box after each has run once). A check is named after its job, not its workflow, and the jobs in `backend.yml` and `frontend.yml` were both called `check`: PF-008 gives the backend job `name: backend` and the new job is `e2e`, but `frontend.yml` is owned by pull request #8, so after that merges add `name: frontend` under its `check:` job (one line) or the required check stays the ambiguous `check`. Enable **Block force pushes** and **Restrict deletions**. Because `backend.yml`, `frontend.yml`, and `e2e.yml` filter by path, a pull request that touches none of their paths never reports that check and would stay blocked: either keep the path filters and let the owner bypass for docs-only pull requests, or remove the path filters from the workflows in a later ticket.
2. **Secret scanning with push protection**: **Settings → Advanced Security** (named **Code security and analysis** on older plans): enable **Secret scanning** and **Push protection** (free for public repositories; a private repository needs GitHub Secret Protection). Optionally enable **Dependabot alerts** and **Dependabot security updates** on the same page.
3. After merge, confirm **Insights → Dependency graph → Dependabot** shows the three ecosystems without errors.
