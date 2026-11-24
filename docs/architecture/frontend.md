# Frontend Architecture Guide

> The companion design guide for `frontend/`. The docs focus on the backend (`docs/README.md`), so this guide stays short, and frontend work is planned in the compact section 6 of the one plan template. `/plan` designs against it, `/dev` builds to it, and `/review` and the `code-reviewer` agent check diffs against it. It was written before the code (PF-001) as the design contract. Paths in the Key Directories Reference arrive with the ticket named next to them.

## Purpose

1. State the principles every frontend change follows.
2. List known issues and anti-patterns (`KNOWN-FE-NNN`) so they are neither rediscovered nor re-litigated.
3. Give the evaluation checklist to run before writing a plan.
4. Set what section 6 *Frontend* of every plan specifies (template in `docs/plans/README.md`): the components and routes, the content table with tiers, the loading, fallback, and error states, the forms, and the test IDs.
5. Point at the shared building blocks to reuse.

## Architecture Principles

### 1. Single responsibility per component and hook

A component renders one thing. A hook encapsulates one concern: one query, one mutation, or one piece of derived state. Pages compose sections; sections compose components and render content; neither fetches inline.

### 2. Reuse shared primitives first

`src/components/` holds the primitives every section uses: `Section`, `ChipList`, `ButtonLink`, and `StatusDot` (PF-003), `ErrorNote` (PF-006, first caller the contact form), then `Card` and `Skeleton` when their first caller needs them (PF-007). Reach for them before writing raw markup with a new set of classes. Add a primitive only when a second caller needs it.

### 3. Content is data

Every word of portfolio copy lives in a typed file under `src/content/`: the profile, skills, experience, how-I-work principles, education, featured-work cards, one file per case study in `content/caseStudies/{slug}.ts`, and the fallback repository list. The types make a missing field a compile error. Only text the owner has reviewed goes in; it follows the disclosure tiers and matches the CV (Non-Negotiable 2). Sections render content and own no copy. Changing what the site says is a content change, reviewed against `.claude/rules/content-conventions.md`, not a code change.

### 4. Static sections, API-backed features

A section in `src/sections/` is presentational and works with no network at all. A feature in `src/features/{feature}/` talks to the API and holds `api.ts` (typed calls), `queries.ts` (TanStack Query hooks and the query-key factory), `types.ts`, `validation.ts` (zod schemas, when there is a form), components, and co-located tests. A feature exposes what others may use through its `index.ts`, and other code imports only from there. The features are `visits`, `stats`, `contact`, `projects`, and `api-status`.

### 5. The page never waits for the API

The backend sleeps on the free tier and can take up to a minute to wake, so nothing a visitor reads depends on it (Non-Negotiable 1). Static content renders first and API-backed parts fill in. Every API-backed view has a loading state, a fallback, and an error state: the visit counter and the status dot hide or grey out on failure; the contact form explains that the first send can take a while. After about 3 seconds of loading, a view shows the cold-start hint. Space for live data is reserved, so filling it in never shifts the layout.

### 6. The API contract is generated, never hand-written

Types come from `src/api/schema.d.ts`, generated from `backend/openapi/openapi.json` by `pnpm gen:api`. Every call goes through the single client in `src/api/client.ts`, which adds a correlation ID, applies a timeout, and turns problem responses into `ApiError`. When the backend changes, regenerate; a type error after regenerating is the contract reporting a real mismatch. The one exception is the actuator health endpoint, which is not part of the OpenAPI contract: `api-status` calls it through `createApiClient<LocalPaths>()`, with the same middleware, and keeps its response type in `features/api-status/types.ts`.

### 7. Server state lives in TanStack Query only

Server data is never copied into component state or a global store. Query keys come from a per-feature factory, such as `projectKeys.list()`. Queries do not retry 4xx responses, and mutations never retry automatically.

### 8. Errors are data

Errors render through `ErrorNote`, which shows a short message and, for API errors, the problem `code` and a copyable `correlationId`, so a report can be traced to the logs. UI logic branches on `code`, never on message text. An error in one feature never takes down a section or a page.

### 9. Forms validate early; the server decides

Forms use react-hook-form with a zod schema that mirrors the server's limits, so most mistakes are caught before a request is sent. A server `VALIDATION_FAILED` maps onto fields through `ApiError.errors`, and `RATE_LIMITED` shows a "try again later" message. The client never relaxes a server rule, and its checks are a convenience, not the defense (Non-Negotiable 4).

### 10. Every interactive element is testable and accessible

Each interactive element carries a `data-test-id` through `getTestIdProp(TestIds.{feature}.{element})`, plus an accessible name: a label, an `aria-label`, or visible text. Headings follow the page outline, images have meaningful `alt` text, focus stays visible, colour contrast meets WCAG AA in the light colour scheme (the only one since PF-003 D9), and motion respects `prefers-reduced-motion`. Tests find elements by test ID or role, never by CSS class or DOM structure. The Playwright smoke suite in `frontend/e2e/` follows the same rule (`testIdAttribute` is `data-test-id`), runs against `vite preview` with every API call aborted, and is run by `pnpm test:e2e` and the `e2e` workflow; Vitest collects only `src/**/*.test.{ts,tsx}`.

### 11. UI strings are translatable

UI strings (buttons, labels, form errors, status messages) come from `src/i18n/en.ts` through `t('key')`, with placeholders for values. Long-form copy comes from `src/content/` (principle 3). JSX contains no other string literals except punctuation.

### 12. Effects are a last resort

Derive values during render, handle user actions in event handlers, and use an effect only to synchronize with something outside React, such as the visit beacon or the document title. Every effect lists its real dependencies; an effect that sets state it depends on loops (`KNOWN-FE-002`).

### 13. Fast and findable

The site is judged in its first ten seconds. The home page scores 90 or more in every Lighthouse category on the production URL. Images below the fold are lazy-loaded with explicit dimensions, fonts are self-hosted or preloaded, and no dependency is added where the platform suffices. Every route sets its own `<title>` and meta description; `index.html` carries the default title, description, and Open Graph tags; `public/` holds `robots.txt`, `sitemap.xml`, and `og-image.png`. `vercel.json` rewrites unknown paths to `index.html`, so `/work/:slug` survives a hard refresh.

### 14. Privacy in the browser

Visit tracking runs only in production builds, once per page load and route change. It honors `?notrack=1` (stored in `localStorage`, removed again by `?notrack=0`) and Global Privacy Control, never sets a cookie, and sends only `{path, referrer, ref}`, with the referrer reduced to its origin so the previous page's path and query never leave the browser (Non-Negotiable 3, PF-005 P13). `@vercel/analytics` is cookieless. Nothing about a visitor is written to the browser console.

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
- [ ] Styling uses theme tokens; contrast checked in the light scheme (PF-003 D9)

### API alignment

- [ ] `pnpm gen:api` run after the backend change; no hand-written request or response types
- [ ] The error codes handled are the ones the plan's API table lists

### States, accessibility, test IDs, i18n

- [ ] Loading, fallback, and error states designed for each new API-backed view
- [ ] Every interactive element has a `data-test-id` and an accessible name
- [ ] Every UI string is an i18n key; every route sets its title and meta description

### Fallback, privacy, disclosure

- [ ] The page renders fully with the backend asleep or down (Non-Negotiable 1)
- [ ] Nothing new is sent about a visitor beyond `{path, referrer, ref}`; tracking still honors `?notrack=1` and Global Privacy Control; no cookies (Non-Negotiable 3)
- [ ] New content is owner-reviewed, within its disclosure tier, and consistent with the CV; nothing is invented (Non-Negotiable 2)
- [ ] No secret in a `VITE_` variable; nothing about a visitor is logged to the console (Non-Negotiable 9)

## Key Directories Reference

Rows marked _built_ exist; the others are planned until the ticket named has run.

| Path | Holds | Ticket |
|---|---|---|
| `src/api/` | `schema.d.ts` (generated), `client.ts`, `errors.ts` | PF-002, _built_ |
| `src/app/` | `App`, `AppProviders`, `queryClient`, `routes`, `RootLayout` (header, footer, scroll restoration since PF-003), `useDocumentMeta` | PF-002, PF-003, _built_ |
| `src/index.css` | Tailwind import, the `@theme` design tokens of the approved design (colours, fonts, type sizes, radii, animations), the `wrap` utility, and base styles | PF-002, PF-003, _built_ |
| `src/config/test-ids.config.ts` | `TestIds`, `getTestIdProp` | PF-002, _built_ |
| `src/i18n/en.ts` | UI strings and `t()` | PF-002, _built_ |
| `src/test/` | setup, `renderWithProviders`, `renderRoute`, MSW server and handlers | PF-002, _built_ |
| `src/utils/format.ts` | `formatCount` (grouped digits, fixed to English); `formatInstant` and `formatDate` wait for a caller, because the counter hides the since date (PF-005 D6); periods are display strings in content, so there is no `formatPeriod` (PF-003 P4) | PF-005, _built_ |
| `src/components/` | shared primitives: `Section`, `ChipList`, `ButtonLink`, `StatusDot`, `DownloadIcon`, `ErrorNote` (PF-006); `Card` and `Skeleton` come with their first caller | PF-003, PF-006, _built_ |
| `src/content/` | typed static content: `profile`, `site`, `featuredWork`, `howIWork`, `skills`, `experience`, `education`, `caseStudies/{slug}.ts` (the reviewed copy since PF-012) | PF-003, PF-012, _built_ |
| `src/sections/` | Header, Hero, ProofPoints, About, FeaturedWork, WorkRow, HowIWork, Skills, Experience, Education, Contact, Footer; OpenSource was removed in PF-012 | PF-003, PF-012, _built_ |
| `src/pages/` | `HomePage`, `CaseStudyPage` (resolves the slug), `CaseStudyArticle`, `GlanceAside`, `NotFoundPage`, `RouteErrorPage` | PF-002, PF-003, _built_ |
| `vercel.json` | SPA rewrite for `/work/:slug` | PF-003, _built_ |
| `src/features/visits/` | `useTrackPageView`, its 75 s API call, and `useVisitCounted` for the system panel's note | PF-005, _built_ |
| `src/features/stats/` | the footer visit counter (`VisitCounter`), asked for once the API is online | PF-005, _built_ |
| `src/features/api-status/` | the hero system panel and the footer API status dot, from one health check | PF-003, _built_ |
| `src/features/contact/` | the contact form, its schema, and its mutation | PF-006, _built_ |
