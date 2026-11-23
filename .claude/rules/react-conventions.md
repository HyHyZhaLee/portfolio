---
paths:
  - "frontend/**/*"
---

# React / TypeScript conventions

Applies to everything under `frontend/`. The principles behind these rules are in `docs/architecture/frontend.md`; commands are in `frontend/CLAUDE.md`. Content files under `src/content/` also follow `.claude/rules/content-conventions.md`.

## Structure

- Static portfolio content is typed data in `src/content/`. Page sections in `src/sections/` render it; pages in `src/pages/` compose sections.
- API-backed features get one folder each in `src/features/{feature}/` (`visits`, `stats`, `contact`, `projects`, `api-status`): `api.ts`, `queries.ts`, `types.ts`, `validation.ts` when there is a form, the components, and co-located `*.test.ts(x)` files. Other code imports a feature from its `index.ts` only.
- Shared primitives live in `src/components/`. Reuse them first, and add a new one only when a second caller needs it.

## Data

- All server state goes through TanStack Query hooks with keys from the feature's query-key factory. Never copy server data into component state or a global store.
- Every call uses the client in `src/api/client.ts`. Request and response types come only from the generated `src/api/schema.d.ts`, which is never edited by hand.
- Queries do not retry 4xx responses. Mutations never retry automatically.

## The page never waits for the API (Non-Negotiable 1)

- No route or section blocks rendering on a request. Static content renders first; API-backed parts fill in.
- Every API-backed view handles loading, fallback, and error states. A slow first response (the backend waking up) shows a short hint after about 3 seconds. A failed or absent response falls back to static data (`fallbackRepos`) or hides the element quietly (the visit counter); it never shows a broken section.
- The visit beacon is fire-and-forget and runs only in production builds; it honors `?notrack=1` and Global Privacy Control (Non-Negotiable 3).

## UI

- Style with Tailwind utility classes and the design tokens in `src/index.css` (`@theme`). No inline hex colors, no arbitrary values where a token exists, and no new CSS files without a reason. The site uses the light colour scheme only (PF-003 D9); the dark palette waits for a toggle.
- Layout works from 360 px wide upward without horizontal scrolling.
- Every interactive element has a `data-test-id` from `getTestIdProp(TestIds.{feature}.{element})` and an accessible name. Images have meaningful `alt` text, or `alt=""` when decorative.
- Respect `prefers-reduced-motion`. Keep visible focus styles.
- UI strings (buttons, labels, form errors, status messages) come from `t('key')`. Long-form portfolio copy comes from `src/content/`. JSX has no literal user-facing strings other than punctuation.
- Each route sets its own `<title>` and meta description.

## Code

- Strict TypeScript: no `any`, no non-null assertions on API data, no `@ts-ignore`.
- Derive values during render. Effects only synchronize with things outside React, list their real dependencies, and never set state they depend on.
- No `console.log` in committed code.

## Forms

- react-hook-form with `zodResolver`. Schemas in `validation.ts` mirror the server's limits.
- After a `VALIDATION_FAILED` response, map `ApiError.errors` onto the form fields. A `RATE_LIMITED` response shows a "try again later" message.
- The submit button disables itself while the request is pending.

## Tests

- Vitest, Testing Library, jest-dom, and MSW. Render with `renderWithProviders` and find elements by test ID or role.
- Cover the success, fallback (API down or slow), and problem-response paths of every hook, and the main interaction of every section.

## Before handing back

- Run `scripts/with-node.sh pnpm --dir frontend check:type`, then `check:lint` and `check:format`. If `check:format` fails, run `format` and check again.
