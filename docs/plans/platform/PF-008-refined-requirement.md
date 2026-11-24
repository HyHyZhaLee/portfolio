# PF-008 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-008 — Quality gates and CI hardening · **Plan**: [PF-008-quality-gates.md](PF-008-quality-gates.md) · **Master plan section**: `../portfolio-implementation-plan.md` §7 Phase 7 · **Status**: Confirmed · **Last updated**: 2026-11-24

## 1. Problem and goal

The owner needs every pull request to be checked automatically and dependencies to stay current without breaking the exact-version policy. The audience is the owner as sole maintainer, and indirectly a hiring manager reading the repository: visible gates show engineering discipline.

## 2. Scope

**In scope**

- Verify and record the existing coverage gates (JaCoCo 80% branches, Vitest 80% branches).
- Dependabot for gradle, npm, and github-actions.
- A Playwright smoke suite with its own workflow.
- Exact owner steps for branch protection and secret scanning.

**Out of scope (deferred)**

- CI badges: the README arrives in PF-009, which adds them.
- Changing GitHub settings: only the owner does this.
- Edits to `frontend.yml`, `vercel.json`, `.prettierignore`, `docs/knowledge/README.md`, and `docs/plans/README.md`: owner pull request #8 (PF-013) changes them.
- Multi-browser or backend-backed end-to-end tests.

## 3. Functional requirements

- **FR-1**: The backend and frontend coverage gates stay as they are and are documented. Source: backlog
- **FR-2**: `.github/dependabot.yml` updates gradle (`/backend`), npm (`/frontend`), and github-actions (`/`) weekly, with minor and patch updates grouped and a small open pull request limit. Source: backlog, clarified 2026-11-24
- **FR-3**: A Chromium Playwright suite runs against the production build served by `vite preview` with every API call intercepted. Source: clarified 2026-11-24
- **FR-4**: The suite checks that the home page renders every section with the API unreachable, a case-study route renders its title, an unknown route shows the 404 page, and the contact form shows field errors for invalid input. Source: clarified 2026-11-24
- **FR-5**: A new `e2e` workflow runs the suite on pull requests touching `frontend/**`, with the browser cached. Source: clarified 2026-11-24
- **FR-6**: Playwright specs are not collected by Vitest and are covered by type-check, lint, and format gates. Source: clarified 2026-11-24

## 4. Product rules and edge cases

- **API down or asleep:** the suite proves it: all `/api/` and `/actuator/` requests are aborted and every page still renders (Non-Negotiable 1).
- **Privacy:** nothing about a visitor is stored; the suite sends no real data and no backend exists.
- **Abuse:** not applicable; the contact test submits only invalid input and never reaches the network.
- Pinned versions: `@playwright/test` is an exact version at least a week old; Dependabot must not turn pins into ranges (KNOWN-FE-004).

## 5. Interface decisions

**API**: none.

**UI**: no change.

**Content**: none; specs assert structure, not placeholder copy.

## 6. Open questions

None.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | Include the Playwright smoke test, Chromium only (pre-approved by the owner (blanket approval, 2026-11-24)) | The recommended default; proves Non-Negotiable 1 against the shipped bundle |
| D2 | 2026-11-24 | `@playwright/test` 1.65.1 (pre-approved by the owner (blanket approval, 2026-11-24)) | Newest stable release at least a week old |
| D3 | 2026-11-24 | A separate `e2e.yml`, not an edit of `frontend.yml` (pre-approved by the owner (blanket approval, 2026-11-24)) | Owner pull request #8 edits `frontend.yml`; a separate file also gives its own required check |
| D4 | 2026-11-24 | Weekly Dependabot on Mondays, grouped minor and patch, limits 3, 3, 2 (pre-approved by the owner (blanket approval, 2026-11-24)) | Small review load for a solo project |
| D5 | 2026-11-24 | Branch protection and secret scanning are written as owner steps (pre-approved by the owner (blanket approval, 2026-11-24)) | Agents never change GitHub settings |

## 8. Acceptance criteria (refined)

- **AC-1**: `pnpm test:e2e` passes four tests with no backend running.
- **AC-2**: `pnpm coverage`, `check:type`, `check:lint`, and `check:format` pass, and Vitest runs no Playwright spec.
- **AC-3**: `.github/dependabot.yml` and `.github/workflows/e2e.yml` exist, and `frontend.yml` is unchanged.
- **AC-4**: The plan lists the exact owner steps for branch protection and secret scanning.
