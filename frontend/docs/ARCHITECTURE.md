# Frontend Architecture Guide

> The design reference for `frontend/`. `/plan` designs against it, `/dev` builds to it, and `/review` and the `code-reviewer` agent check diffs against it. It was written before the code (PF-001) as the design contract. Paths in the Key Directories Reference arrive with the ticket named next to them.

## Purpose

1. State the principles every frontend change follows.
2. List known issues and anti-patterns (`KNOWN-FE-NNN`) so they are neither rediscovered nor re-litigated.
3. Give the evaluation checklist to run before writing a plan.
4. Provide the implementation plan template. Plans go to `frontend/docs/{domain}/PF-NNN-{title}.md`.
5. Point at the shared building blocks to reuse.

## Architecture Principles

### 1. Single responsibility per component and hook

A component renders one thing. A hook encapsulates one concern: one query, one mutation, or one piece of derived state. Pages compose sections; sections compose components and render content; neither fetches inline.

### 2. Reuse shared primitives first

`src/components/` holds the primitives every section uses: `Section`, `Card`, `Button`, `Chip`, `Skeleton`, `StatusDot`, and `ErrorNote` (PF-003). Reach for them before writing raw markup with a new set of classes. Add a primitive only when a second caller needs it.

### 3. Content is data

Every word of portfolio copy lives in a typed file under `src/content/`: the profile, skills, experience, how-I-work principles, education, featured-work cards, one file per case study in `content/caseStudies/{slug}.ts`, and the fallback repository list. The types make a missing field a compile error. Only text the owner has reviewed goes in; it follows the disclosure tiers and matches the CV (Non-Negotiable 2). Sections render content and own no copy. Changing what the site says is a content change, reviewed against `.claude/rules/content-conventions.md`, not a code change.

### 4. Static sections, API-backed features

A section in `src/sections/` is presentational and works with no network at all. A feature in `src/features/{feature}/` talks to the API and holds `api.ts` (typed calls), `queries.ts` (TanStack Query hooks and the query-key factory), `types.ts`, `validation.ts` (zod schemas, when there is a form), components, and co-located tests. A feature exposes what others may use through its `index.ts`, and other code imports only from there. The features are `visits`, `stats`, `contact`, `projects`, and `api-status`.

### 5. The page never waits for the API

The backend sleeps on the free tier and can take up to a minute to wake, so nothing a visitor reads depends on it (Non-Negotiable 1). Static content renders first and API-backed parts fill in. Every API-backed view has a loading state, a fallback, and an error state: the projects list starts from `content/fallbackRepos.ts` and swaps in live data; the visit counter and the status dot hide or grey out on failure; the contact form explains that the first send can take a while. After about 3 seconds of loading, a view shows the cold-start hint. Space for live data is reserved, so filling it in never shifts the layout.

### 6. The API contract is generated, never hand-written

Types come from `src/api/schema.d.ts`, generated from `backend/openapi/openapi.json` by `pnpm gen:api`. Every call goes through the single client in `src/api/client.ts`, which adds a correlation ID, applies a timeout, and turns problem responses into `ApiError`. When the backend changes, regenerate; a type error after regenerating is the contract reporting a real mismatch. The one exception is the actuator health endpoint, which is not part of the OpenAPI contract: `api-status` calls it through `createApiClient<LocalPaths>()`, with the same middleware, and keeps its response type in `features/api-status/types.ts`.

### 7. Server state lives in TanStack Query only

Server data is never copied into component state or a global store. Query keys come from a per-feature factory, such as `projectKeys.list()`. Queries do not retry 4xx responses, and mutations never retry automatically.

### 8. Errors are data

Errors render through `ErrorNote`, which shows a short message and, for API errors, the problem `code` and a copyable `correlationId`, so a report can be traced to the logs. UI logic branches on `code`, never on message text. An error in one feature never takes down a section or a page.

### 9. Forms validate early; the server decides

Forms use react-hook-form with a zod schema that mirrors the server's limits, so most mistakes are caught before a request is sent. A server `VALIDATION_FAILED` maps onto fields through `ApiError.errors`, and `RATE_LIMITED` shows a "try again later" message. The client never relaxes a server rule, and its checks are a convenience, not the defense (Non-Negotiable 4).

### 10. Every interactive element is testable and accessible

Each interactive element carries a `data-test-id` through `getTestIdProp(TestIds.{feature}.{element})`, plus an accessible name: a label, an `aria-label`, or visible text. Headings follow the page outline, images have meaningful `alt` text, focus stays visible, colour contrast meets WCAG AA in both colour schemes, and motion respects `prefers-reduced-motion`. Tests find elements by test ID or role, never by CSS class or DOM structure.

### 11. UI strings are translatable

UI strings (buttons, labels, form errors, status messages) come from `src/i18n/en.ts` through `t('key')`, with placeholders for values. Long-form copy comes from `src/content/` (principle 3). JSX contains no other string literals except punctuation.

### 12. Effects are a last resort

Derive values during render, handle user actions in event handlers, and use an effect only to synchronize with something outside React, such as the visit beacon or the document title. Every effect lists its real dependencies; an effect that sets state it depends on loops (`KNOWN-FE-002`).

### 13. Fast and findable

The site is judged in its first ten seconds. The home page scores 90 or more in every Lighthouse category on the production URL. Images below the fold are lazy-loaded with explicit dimensions, fonts are self-hosted or preloaded, and no dependency is added where the platform suffices. Every route sets its own `<title>` and meta description; `index.html` carries the default title, description, and Open Graph tags; `public/` holds `robots.txt`, `sitemap.xml`, and `og-image.png`. `vercel.json` rewrites unknown paths to `index.html`, so `/work/:slug` survives a hard refresh.

### 14. Privacy in the browser

Visit tracking runs only in production builds, once per page load and route change. It honors `?notrack=1` (stored in `localStorage`) and Global Privacy Control, never sets a cookie, and sends only `{path, referrer, ref}` (Non-Negotiable 3). `@vercel/analytics` is cookieless. Nothing about a visitor is written to the browser console.

## Known Issues & Anti-Patterns

> When an issue is listed here, apply its rule; there is no need to explore alternatives. Add an entry when a trap costs real time or a review finding recurs. Numbers are permanent. Entries 001 to 006 were verified in the owner's earlier React and Vite scaffold on 2026-11-11; re-check each one when the code that depends on it lands. PF-002 re-checked 001, 003, and 004 on 2026-11-22. Evidence: `docs/knowledge/tooling.md`.

### KNOWN-FE-001: The shell's default Node can be too old for Vite

Vite 8 requires Node `^20.19.0 || >=22.12.0`. **Rule.** Run Node commands through `scripts/with-node.sh`, which selects the `.nvmrc` version and fails with a clear message otherwise.

### KNOWN-FE-002: An effect that sets its own dependency loops

**Rule.** Derive the value during render instead. If an effect is unavoidable, guard the state update so it converges.

### KNOWN-FE-003: TypeScript 7 is not usable with typescript-eslint yet

TypeScript 7 is the native compiler and has no JavaScript API, and typescript-eslint supported only `typescript <6.1.0` when this was checked. **Rule.** Stay on TypeScript 6.0.x until typescript-eslint supports 7, even when a template pins 7.

### KNOWN-FE-004: pnpm 11 ignores `save-exact` in `.npmrc`

With pnpm 11, installs write `^` ranges even with `save-exact=true` in `.npmrc`. **Rule.** Keep `saveExact: true` and `engineStrict: true` in `frontend/pnpm-workspace.yaml`, and check that `pnpm add` wrote an exact version.

### KNOWN-FE-005: openapi-fetch captures `fetch` when the client is created

A client created before MSW patches `globalThis.fetch` sends real requests in tests. **Rule.** Keep the late-bound `fetch` in `createApiClient` (`fetch: (request) => globalThis.fetch(request)`).

### KNOWN-FE-006: A `DOWN` health status arrives as a 503 with a useful body

Spring Boot answers the health endpoint with 503 when the overall status is `DOWN`, and the body still lists every component. **Rule.** In `api-status`, create the client with `createApiClient<LocalPaths>({ tolerateStatus: [503] })`; the body then comes back as `error` and is rendered as data, not as a network failure.

## Evaluation Checklist

Run this before writing a plan. Record anything that fails as a risk or a decision in the plan.

### Duplication

- [ ] Searched `src/components/`, `src/sections/`, and existing features for a component or hook that already does this
- [ ] Checked the feature's `api.ts` and query-key factory for an existing call
- [ ] Checked `src/content/` for an existing content type before adding a new one

### Single responsibility

- [ ] Each new component and hook has one purpose, statable in one sentence
- [ ] New copy lives in `src/content/` or `src/i18n/en.ts`, not in a component

### Simplicity

- [ ] No new dependency where the platform or an existing library suffices; its bundle cost is stated
- [ ] No global state added

### Consistency

- [ ] Section and feature folder shapes followed; types come from the generated schema only
- [ ] Styling uses theme tokens; light and dark schemes both checked

### API alignment

- [ ] `pnpm gen:api` run after the backend change; no hand-written request or response types
- [ ] The error codes handled are the ones the backend plan lists

### States, accessibility, test IDs, i18n

- [ ] Loading, fallback, and error states designed for each new API-backed view
- [ ] Every interactive element has a `data-test-id` and an accessible name
- [ ] Every UI string is an i18n key; every route sets its title and meta description

### Fallback, privacy, disclosure

- [ ] The page renders fully with the backend asleep or down (Non-Negotiable 1)
- [ ] Nothing new is sent about a visitor beyond `{path, referrer, ref}`; tracking still honors `?notrack=1` and Global Privacy Control; no cookies (Non-Negotiable 3)
- [ ] New content is owner-reviewed, within its disclosure tier, and consistent with the CV; nothing is invented (Non-Negotiable 2)
- [ ] No secret in a `VITE_` variable; nothing about a visitor is logged to the console (Non-Negotiable 9)

## Implementation Plan Template

Copy this into `frontend/docs/{domain}/PF-NNN-{title}.md`. Drop a section that does not apply instead of filling it with "n/a". Keep each paragraph on one line. `/plan` writes it with Status Draft and sets it to Approved when the user approves; `/dev` builds only from an Approved plan.

```markdown
# PF-NNN — {Title} (frontend)

**Ticket**: PF-NNN · **Refined requirement**: {link, next to the plan of the package that carries most of the work} · **Backend plan**: `backend/docs/{domain}/PF-NNN-{title}.md` or "none" · **Status**: Draft | Approved {YYYY-MM-DD} · **Last updated**: {YYYY-MM-DD}

> ⚠️ **Review these flows first** — {links to the subsections under section 6, or "No complex flows"}

## 1. Requirement summary
{Two to five lines, linking the product rules (SITE-NNN) this presents or enforces and the master plan section it maps to.}

## 2. Requirement analysis
| Need | Source | Frontend work |
|---|---|---|

## 3. Current state
{Existing components, sections, hooks, content files, and routes this touches or reuses, with `path:line` references.}

## 4. Approach
{The chosen approach and why.}

| Alternative | Why not |
|---|---|

## 5. Build
### Component hierarchy
{Indented list from page to section to components, marking each as new or reused.}
### Content
{New or changed content types and files in `src/content/`.}

| Block | Source | Tier | Status |
|---|---|---|---|

{Source is the master CV section or the approved content-pack item. Tier is A, or B with the owner's approval noted. Status is placeholder or reviewed; only reviewed blocks ship (Non-Negotiable 2). Every new route gets its own `<title>` and meta description.}
### Hooks and data layer
| Hook | Query key | Endpoint | Fallback |
|---|---|---|---|
### Forms and validation
{Schema, fields, limits mirrored from the server, server error mapping.}
### States
| View | Loading | Fallback | Error |
|---|---|---|---|
### data-test-id plan
| Element | Test ID | Type | Purpose |
|---|---|---|---|
### Routes and SEO
{Routes added or changed, their titles and meta descriptions, sitemap entries.}
### User flow
{Numbered steps of the main interaction.}

## 6. Complex flows
{Only for hooks or components that merge several queries or derive state in several steps: diagram, steps, why, simplest alternative.}

## 7. Files, order, risks, tests
**New**: {paths}. **Modified**: {paths}.

**Order**: `pnpm gen:api` → content types → `api.ts` → `queries.ts` → components → section or route → tests.

| Risk | Mitigation |
|---|---|

**Tests**: {hook tests against MSW (success, fallback, problem response), component tests, content shape tests, the scenarios they cover}.
```

The diagram conventions in `backend/docs/ARCHITECTURE.md` apply here too.

## Key Directories Reference

Rows marked _built_ exist; the others are planned until the ticket named has run.

| Path | Holds | Ticket |
|---|---|---|
| `src/api/` | `schema.d.ts` (generated), `client.ts`, `errors.ts` | PF-002, _built_ |
| `src/app/` | `App`, `AppProviders`, `queryClient`, `routes`, `RootLayout` | PF-002, _built_ |
| `src/index.css` | Tailwind import and `@theme` design tokens (a minimal palette; PF-003 extends it) | PF-002, _built_ |
| `src/config/test-ids.config.ts` | `TestIds`, `getTestIdProp` | PF-002, _built_ |
| `src/i18n/en.ts` | UI strings and `t()` | PF-002, _built_ |
| `src/test/` | setup, `renderWithProviders`, `renderRoute`, MSW server and handlers | PF-002, _built_ |
| `src/utils/format.ts` | `formatInstant`, `formatDate`, `formatCount`, `formatPeriod` | PF-003 |
| `src/components/` | shared primitives: `Section`, `Card`, `Button`, `Chip`, `Skeleton`, `StatusDot`, `ErrorNote` | PF-003 |
| `src/content/` | typed static content, including `caseStudies/{slug}.ts` and `fallbackRepos.ts` (`profile.ts` holds only the name and title so far) | PF-003 |
| `src/sections/` | Hero, About, FeaturedWork, HowIWork, Skills, Experience, OpenSource, Education, Contact, Footer | PF-003 |
| `src/pages/` | `HomePage`, `CaseStudyPage`, `NotFoundPage`, `RouteErrorPage` (`HomePage` is a placeholder; `NotFoundPage` and `RouteErrorPage` exist since PF-002) | PF-003 |
| `vercel.json` | SPA rewrite for `/work/:slug` | PF-003 |
| `src/features/visits/` | `useTrackPageView` and its API call | PF-005 |
| `src/features/stats/` | the footer visit counter | PF-005 |
| `src/features/api-status/` | the footer API status dot | PF-005 |
| `src/features/contact/` | the contact form, its schema, and its mutation | PF-006 |
| `src/features/projects/` | the open-source list with its fallback | PF-007 |
