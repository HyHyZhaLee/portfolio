# PF-002 — Scaffold both packages

**Ticket**: PF-002 · **Refined requirement**: none (a chore; the scope is the backlog line and the master implementation plan, Phase 1) · **Packages**: backend and frontend · **Status**: Approved 2026-11-22 (the owner asked for the scaffold to be built directly, without a separate `/plan` round) · **Last updated**: 2026-11-22

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

Both packages exist, start locally, and pass the quality gates; no product feature yet. Done when `make up`, `make backend`, and `make frontend` start everything, the backend connects to local PostgreSQL, `make check` passes, and both GitHub Actions workflows are green. Source: `portfolio-implementation-plan.md` §7 Phase 1 (private parent folder).

## 2. Decisions

| # | Decision | Why |
|---|---|---|
| D1 | Spring Boot 4.2.0 (the Initializr default on 2026-11-22), Java 21, Gradle wrapper 9.9.2, starter names exactly as generated | Latest GA; KNOWN-BE-003 |
| D2 | Libraries with no caller yet arrive with the ticket that first uses them: Bucket4j (PF-004), the validation and cache starters and Caffeine (PF-005; Initializr generated the two starters), Resilience4j (PF-006), WireMock and its shared integration-test support (PF-006 or PF-007, whichever adds the first adapter). This departs from the master plan's Phase 1 list | Non-Negotiable 8: each dependency is justified, checked for Boot 4 compatibility, and measured against real use; an unused starter only adds startup time on 0.1 CPU |
| D3 | springdoc-openapi 3.2.1 now | The OpenAPI snapshot and the generated frontend types are part of the scaffold |
| D4 | Spotless 8.12.0 with palantir-java-format 2.103.0 | 4-space indentation, like `.editorconfig` and the frontend |
| D5 | A minimal `SecurityConfig` now: stateless, CSRF off, no HTTP Basic or form login; `GET` allowed only on health, `/v3/api-docs`, and Swagger UI, `HEAD` on health for uptime monitors, and the `/error` dispatch permitted so a failure keeps its status; everything else denied. The generated in-memory user is excluded | With Spring Security on the classpath, the default chain puts HTTP Basic in front of the health check. PF-004 adds CORS, the API paths, and the rate-limit filter to this chain |
| D6 | `testUnit` excludes the JUnit tag `integration` and `testIT` includes it; both read the test source set; `test` is disabled and only depends on the two; JaCoCo merges both tiers and `check` enforces branch coverage ≥ 80% | KNOWN-BE-001, 002, 009. There are no branches yet, so the gate passes trivially until PF-004 |
| D7 | `OpenApiSnapshotIT` rewrites `backend/openapi/openapi.json` on every `testIT` run. The backend workflow fails when the result differs from the committed file; the frontend workflow regenerates `src/api/schema.d.ts` and fails on a diff | A forgotten `make openapi` is caught in CI instead of in production |
| D8 | Health shows component statuses (`show-components: always`), never their details | `scripts/check-services.sh` reports `db`; nothing internal is exposed |
| D9 | `application.yml` gives the datasource no default; `application-local.yml` derives it from the `POSTGRES_*` variables `compose.yaml` uses; `application-prod.yml` logs ECS JSON. `spring.mvc.problemdetails` stays off until PF-004's `GlobalExceptionHandler`. Forwarded headers use `server.request.header.forwarded.strategy: framework` | backend/CLAUDE.md: secrets have no default outside the local profile. Boot's problem-details handler puts framework text in `detail` (Non-Negotiable 5). Boot 4.2 deprecates `server.forward-headers-strategy`. No `app.*` properties yet: each arrives with the record that binds it. This departs from the master plan §5.3, which kept local defaults in `application.yml` |
| D10 | Frontend versions are exact, and where the newest release was only days old, the newest one at least a week old: react-router 8.5.1, vitest 5.1.0, msw 3.0.5, @tanstack/react-query 5.107.1, @testing-library/jest-dom 7.0.1. TypeScript stays on 6.0.3 | Supply-chain caution; KNOWN-FE-003 |
| D11 | React Router 8, the current major. The API used here (`createBrowserRouter`, `RouterProvider`, `createMemoryRouter`, `MemoryRouter`) is unchanged from 7 | Current release line; peer `react >=19.2.7` |
| D12 | `packageManager` is `pnpm@11.0.9`, the version corepack runs by default | `pnpm --dir frontend` from the repository root takes its version from the root, which has no `package.json`, and pnpm then rejects a different pin (`docs/knowledge/tooling.md`) |
| D13 | react-hook-form, zod, and @hookform/resolvers are installed now, as the master plan lists; `@vercel/analytics` comes with PF-003 | No runtime cost until imported |
| D14 | One `createApiClient<Paths>()` factory. Its middleware adds `X-Correlation-Id` and a timeout (15 s default; a 75 s client for the contact form) and throws only `ApiError` (`status`, `code`, `detail`, `correlationId`, `errors`): no usable response (including a body that breaks off) is `NETWORK_ERROR`; an error without problem JSON, or a 2xx body that is not JSON, is `UNEXPECTED_RESPONSE`. A `tolerateStatus` option returns listed statuses as `error` data (KNOWN-FE-006). It falls back when `AbortSignal.any` (Safari before 17.4) or `crypto.randomUUID` (plain-http pages) is missing. Queries never retry a 4xx; mutations never retry | `docs/architecture/frontend.md` principles 6–8; openapi-fetch routes only `fetch` failures to `onError` (`docs/knowledge/tooling.md`) |
| D15 | Routes `/` (a placeholder with the name and title from the product guide) and a 404. Per-route `<title>` and meta, sections, content files, and the full design tokens are PF-003 | Scope of PF-003 |
| D16 | The Dockerfile and the `bootJar` naming stay with PF-004; Dependabot, actions pinned by commit SHA, and branch protection stay with PF-008. Actions are pinned to exact release tags for now | Backlog scope |
| D17 | `make backend`, `make frontend`, and `make status` load the repository's `.env`, with variables already exported by the shell winning; `vite.config.ts` reads the same file with `loadEnv`. `make check` and `make test` do not load it | The documented `.env` overrides now reach the backend, Vite, and the helper scripts, as they already reached compose; a local `SPRING_PROFILES_ACTIVE` never reaches the test suites |
| D18 | Pages render under a pathless route with `errorElement: <RouteErrorPage />` (`buildRoutes`), so a page that throws leaves the layout in place and never shows the error text | frontend principle 8, Non-Negotiable 1 |
| D19 | `testIT` declares `openapi/openapi.json` as an output | Otherwise an edited or reverted snapshot leaves `testIT` UP-TO-DATE and `make openapi` does nothing |

## 3. Built

**Backend**: `build.gradle.kts` (tiers, JaCoCo, Spotless, the snapshot as a `testIT` output, `bootRun` defaults to the `local` profile), the Gradle wrapper, `PortfolioApplication`, `platform/security/SecurityConfig`, `platform/openapi/OpenApiConfig`, `application.yml`, `application-local.yml`, `application-prod.yml`, `openapi/openapi.json`. Tests: `support/IntegrationTest` (constructor injection through `@TestConstructor`), `support/TestcontainersConfiguration` (`postgres:17-alpine`), `TestPortfolioApplication` (`bootTestRun`), `HealthIT` (health, HEAD, denied paths, error status kept), `platform/openapi/OpenApiSnapshotIT`.

**Frontend**: `package.json` scripts (`dev`, `build`, `check:type`, `check:lint`, `check:format`, `format`, `test`, `coverage`, `gen:api`), `pnpm-workspace.yaml` (KNOWN-FE-004), `vite.config.ts` (Tailwind, dev proxy for `/api`, `/actuator`, `/v3/api-docs`, `/swagger-ui`, Vitest with an 80% branch threshold), TypeScript project configs (strict, `noUncheckedIndexedAccess`), ESLint flat config (type-checked and stylistic presets, React hooks rules as errors), Prettier. Source: `src/api/` (`client.ts`, `errors.ts`, generated `schema.d.ts`), `src/app/` (`App`, `AppProviders`, `queryClient`, `routes` with `buildRoutes`, `RootLayout` with a skip link), `src/pages/` (`HomePage` placeholder, `NotFoundPage`, `RouteErrorPage`), `src/config/test-ids.config.ts`, `src/i18n/en.ts`, `src/content/profile.ts`, `src/index.css` (tokens with a dark scheme and reduced motion). Tests: `src/test/` (setup, MSW server and handlers, `renderWithProviders`, `renderRoute`, `apiClientFixtures`), and tests for the client (`client.test.ts`, `client.compat.test.ts`), the retry policy, `t()`, the routes and the error boundary, and `App`.

**Root**: `Makefile` (`LOAD_ENV` for the run and status targets). The four skills and the `code-reviewer` agent now say where to run, so they also work in a session started in the private parent folder, whose `.claude/skills/`, `.claude/agents/`, and `.claude/settings.json` link to this repository's (outside the repository); `CLAUDE.md` describes both ways to start.

**CI**: `.github/workflows/backend.yml` (`./gradlew check`, snapshot diff) and `.github/workflows/frontend.yml` (frozen install, type check, lint, format, coverage, build, generated-types diff), each filtered by path.

## 4. Verification (2026-11-22, local, after the review fixes)

| Check | Result |
|---|---|
| `make check` | Passes: Spotless, 6 integration tests, JaCoCo gate; frontend type check, lint, format, 26 tests, branch coverage 91.2% |
| `make up` + `make backend` | Starts in about 2.5 s with the `local` profile; `/actuator/health` reports `db UP` against the compose PostgreSQL 17 |
| `make frontend` | Serves `/`; the Vite proxy reaches `/actuator/health`, `/v3/api-docs`, and Swagger UI on the backend |
| `bootTestRun` | Starts against a Testcontainers PostgreSQL with no compose |
| `make openapi` | Regenerates the snapshot and `schema.d.ts`; after the snapshot is overwritten it reruns `testIT` and restores an identical file |
| Non-default ports | With `POSTGRES_PORT=5433 SERVER_PORT=8081 FRONTEND_PORT=5174` exported, compose, the backend (connected to 5433), the Vite proxy, and `make status` all follow |
| `pnpm build` | Builds; JS 107 kB gzip before any section exists |
| Unknown path, `POST` to health | 403 |
| `HEAD /actuator/health`; a missing Swagger asset | 200; 404 with Boot's default body, no framework message |
| GitHub Actions | Not run yet: nothing has been pushed |

## 5. Review

`/code-review` on 2026-11-22 raised 15 findings. 14 are fixed in this ticket (D2, D5, D9, D14, D17–D19, docs, constructor injection in tests). The 15th, that `ForwardedHeaderFilter` trusts a client-supplied `X-Forwarded-For`, has no consumer yet and moves to PF-004 (`docs/architecture/backend.md`, principle 9).

## 6. Follow-ups

- PF-004: trust only Render's proxy hop before the visitor hash and the rate limits use the client address; the first unit tests; extend `SecurityConfig` (CORS, API paths, rate limit, problem JSON for 401/403) and replace Boot's default error body with `GlobalExceptionHandler`; the Dockerfile.
- PF-005 to PF-007: add each deferred library from D2 with its first caller.
- PF-008: Dependabot, actions pinned by commit SHA, branch protection.
- After the first push: confirm both workflows are green.
