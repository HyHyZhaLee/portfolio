# Backlog

Ticket registry. A ticket is registered here before work starts. Its plan, refined requirement, and progress docs live in `docs/plans/{domain}/` (one plan per ticket for both packages; see `docs/plans/README.md`), and the Plan column links to the plan once it exists. The Source column names the section of the private master plans (in the parent CV folder) that the ticket builds.

| ID | Title | Type | Source | Status | Plan |
|---|---|---|---|---|---|
| PF-001 | AI convention and repository foundation: `CLAUDE.md`, `.claude/` (rules, `/plan` `/dev` `/review` `/create-pr`, the `code-reviewer` agent, settings), package guides, docs skeleton, scripts, Makefile, compose | Chore | Adapted from the owner's earlier scaffold | Done (2026-11-22) | none |
| PF-002 | Scaffold both packages: Gradle Spring Boot app with health, Flyway, Testcontainers integration tier, Spotless, JaCoCo, and the OpenAPI snapshot; Vite React app with Tailwind, TanStack Query, React Router, Vitest and MSW, ESLint and Prettier; CI workflows | Chore | Implementation plan Phase 1 | In progress (built and verified locally 2026-11-22; awaiting review and the first CI run) | [PF-002-scaffold.md](../plans/platform/PF-002-scaffold.md) |
| PF-003 | Static site: layout and design tokens, sections rendered from `src/content/`, `/work/<slug>` case-study routes with per-page meta, SEO and accessibility, first Vercel deploy with Web Analytics | Feature | Implementation plan Phase 2; content plan §6 and §7.1 | Planned (placeholders until the content pack is approved) | — |
| PF-004 | Backend platform: error model, correlation IDs, CORS, security chain, client info and visitor hashing, bot filter, rate limiting, Dockerfile; first deploy to Render and Neon | Feature | Implementation plan Phase 3 | Planned | — |
| PF-005 | Visit tracking and stats: `page_view` table, `POST /api/v1/visits`, `GET /api/v1/stats/summary`, the frontend beacon with `?ref=` and `?notrack=1`, the footer counter | Feature | Implementation plan Phase 4 | Planned | — |
| PF-006 | Contact form: `contact_message` table, `POST /api/v1/contact-messages` with honeypot and rate limit, email delivery with retries, the form with field errors | Feature | Implementation plan Phase 5 | Planned | — |
| PF-007 | Open-source projects: GitHub client with cache, circuit breaker, and fallback, `GET /api/v1/projects`, the section with static fallback data | Feature | Implementation plan Phase 6 | Planned | — |
| PF-008 | Quality gates and CI hardening: coverage gates, branch protection, Dependabot, secret scanning, optional Playwright smoke test | Chore | Implementation plan Phase 7 | Planned | — |
| PF-009 | Polish and launch: README with architecture and decisions, Lighthouse ≥ 90, cross-browser check, uptime monitor, smoke test, links from the CV and LinkedIn | Chore | Implementation plan Phase 8 | Planned | — |
| PF-010 | One docs folder: move the package architecture guides and plans into `docs/` (`docs/architecture/backend.md`, `docs/architecture/frontend.md`, `docs/plans/{domain}/`), one backend-first plan template for both packages, and every reference updated | Chore | Owner request, 2026-11-23 | Done (2026-11-23) | none |

**Type**: Feature · Fix · Chore. **Status**: Planned · In progress · Done · Dropped.

Next free ID: **PF-011**.
