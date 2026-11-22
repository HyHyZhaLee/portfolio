# frontend/CLAUDE.md

> Written before the code (PF-001) as the working contract for `frontend/`. The commands were confirmed when PF-002 scaffolded the package; component names are confirmed from PF-003 on. Where this file and the code disagree, fix whichever is wrong in the same change.

## Quick Reference

| | |
|---|---|
| Runtime | Node 24.22.0, pinned in the root `.nvmrc` |
| Package manager | pnpm 11.0.9 through corepack, pinned in `packageManager` to corepack's default because commands run from the repository root (`docs/knowledge/tooling.md`); exact versions via `saveExact` in `frontend/pnpm-workspace.yaml` (`KNOWN-FE-004`) |
| Build | Vite 8, TypeScript 6.0 in strict mode with `noUncheckedIndexedAccess` (7.x waits for typescript-eslint, `KNOWN-FE-003`) |
| UI | React 19, Tailwind CSS v4 with design tokens in `@theme` (`src/index.css`), dark mode through `prefers-color-scheme` |
| Routing | React Router 8: `/` and a 404 today; `/work/:slug`, the Vercel SPA rewrite in `frontend/vercel.json`, and per-route `<title>` and meta description come with PF-003 |
| Data | TanStack Query for server state; `openapi-fetch` with types from `openapi-typescript` |
| Forms | react-hook-form with zod schemas |
| Analytics | `@vercel/analytics` (cookieless) plus the site's own visit tracking |
| Tests | Vitest, Testing Library, jest-dom, MSW |
| Hosting | Vercel Hobby; Root Directory `frontend` |

## Commands

Confirmed in PF-002. Agents run these from the repository root in exactly this form. `scripts/with-node.sh` selects the Node version from `.nvmrc` and fails clearly if it is not installed. People can run `nvm use`, `cd frontend`, and plain `pnpm …` instead.

```bash
scripts/with-node.sh pnpm --dir frontend install
scripts/with-node.sh pnpm --dir frontend dev              # http://localhost:5173; proxies /api to the backend
scripts/with-node.sh pnpm --dir frontend build            # type-check and production build
scripts/with-node.sh pnpm --dir frontend check:type
scripts/with-node.sh pnpm --dir frontend check:lint
scripts/with-node.sh pnpm --dir frontend check:format     # Prettier; a separate gate from lint
scripts/with-node.sh pnpm --dir frontend format
scripts/with-node.sh pnpm --dir frontend test --run       # add a file path to run one test file
scripts/with-node.sh pnpm --dir frontend coverage         # branch coverage ≥ 80%
scripts/with-node.sh pnpm --dir frontend gen:api          # regenerate src/api/schema.d.ts from the OpenAPI snapshot
```

## Code Style

- Prettier: semicolons, single quotes (JSX too), trailing commas, 4-space indentation, print width 160. Markdown and generated files are ignored.
- ESLint flat config with the type-checked and stylistic presets and the React hooks rules as errors. Test files may relax the `no-unsafe-*` rules only.
- No `any`. Prefer types derived from `components['schemas']` and `paths` in the generated schema.
- Named exports, one component per file. Components are `PascalCase.tsx`, hooks `useThing.ts`, other modules `camelCase.ts`, tests `*.test.ts(x)` next to the code they test.
- Tailwind utility classes with the theme's tokens (`bg-surface`, `text-muted`); no inline hex colours, no `style` props for colour or spacing, and no new CSS file without a reason.

## Project Structure _(PF-002 built `api/`, `app/`, `config/`, `i18n/`, `test/`, `index.css`, and the two pages; the rest is planned, PF-003 and later)_

```
frontend/
├── index.html                  # default title, meta description, Open Graph tags
├── vercel.json                 # SPA rewrite so /work/:slug loads on a hard refresh
├── public/                     # favicon, og-image.png, cv.pdf (public variant), robots.txt, sitemap.xml
└── src/
    ├── index.css               # Tailwind import and @theme design tokens
    ├── api/                    # schema.d.ts (generated, never edited) · client.ts · errors.ts
    ├── app/                    # providers, router, layout, theme
    ├── components/             # shared primitives: Section, Card, Button, Chip, Skeleton, StatusDot, ErrorNote
    ├── config/                 # test-ids.config.ts
    ├── content/                # typed static content: profile, skills, experience, howIWork, education, featuredWork, caseStudies/{slug}.ts, fallbackRepos
    ├── features/               # API-backed: visits, stats, contact, projects, api-status
    ├── pages/                  # HomePage, CaseStudyPage, NotFoundPage, RouteErrorPage
    ├── sections/               # Hero, About, FeaturedWork, HowIWork, Skills, Experience, OpenSource, Education, Contact, Footer
    ├── i18n/                   # en.ts and t() for UI strings
    ├── test/                   # setup, renderWithProviders, MSW handlers
    └── utils/                  # format.ts
```

## Key Patterns

- **Content is data.** Every word of portfolio copy lives in a typed file under `src/content/`: one file per section, one file per case study in `content/caseStudies/{slug}.ts`. Sections and pages render it; they hold no copy of their own. Only text the owner has reviewed goes in, it follows the disclosure tiers, and it matches the CV (Non-Negotiable 2, `.claude/rules/content-conventions.md`). UI strings such as button labels, form errors, and status messages come from `t('key')` instead.
- **Sections vs features.** A section (`src/sections/`) is presentational and renders static content. A feature (`src/features/{feature}/`) talks to the API: `api.ts` for typed calls, `queries.ts` for hooks and the query-key factory, `types.ts`, `validation.ts` for zod schemas when there is a form, then components and their tests. Other code imports a feature only from its `index.ts`. A section may embed a feature component, as `OpenSource` embeds the projects list and `Footer` embeds the visit counter and the API status dot.
- **The page never waits for the API.** Every API-backed view has a loading state, a fallback, and an error state, and nothing above it waits for it (Non-Negotiable 1). The projects list starts from `content/fallbackRepos.ts` and swaps in live data; the counter and the status dot hide or grey out on failure. After about 3 s of loading, a view shows the cold-start hint ("Waking up the free-tier API…").
- **API calls.** Use the client from `src/api/client.ts` only. Its base URL is `import.meta.env.VITE_API_URL` (empty in development, where the Vite proxy forwards `/api`, `/actuator`, `/v3/api-docs`, and `/swagger-ui` to `localhost:8080`). It adds `X-Correlation-Id`, applies a timeout (15 s by default, 75 s for the contact form so it survives a cold start), and throws `ApiError` (`status`, `code`, `detail`, `correlationId`, `errors`) for problem responses, `code: 'UNEXPECTED_RESPONSE'` for an error without problem JSON or a 2xx body that is not JSON, and `code: 'NETWORK_ERROR'` when no usable response arrives. It falls back when the browser lacks `AbortSignal.any` or `crypto.randomUUID`. The health endpoint is outside the OpenAPI contract; `api-status` calls it through `createApiClient<LocalPaths>({ tolerateStatus: [503] })` with types in its `types.ts`, and treats the 503 body as data (`KNOWN-FE-006`).
- **Queries.** One hook per query, keys from the feature's factory, no retry on 4xx. Live data never replaces content the visitor is reading mid-scroll with a layout jump: reserve its space.
- **Mutations.** Creating mutations (a visit, a contact message) never retry on their own.
- **Visit tracking.** `useTrackPageView` in `features/visits` runs once per page load and once per route change, only in production builds. It reads `?ref=`, keeps it in `sessionStorage`, removes it from the address bar with `history.replaceState`, and posts `{path, referrer, ref}` with `keepalive: true`. It does nothing when `localStorage.notrack === '1'` (set by visiting `?notrack=1`) or when `navigator.globalPrivacyControl` is true (Non-Negotiable 3). It never sets a cookie.
- **Forms.** react-hook-form with `zodResolver`. Schemas mirror the server's limits. Map `ApiError.errors` onto fields after a `VALIDATION_FAILED` response; show a friendly message for `RATE_LIMITED`. The contact form's honeypot field is visually hidden, skipped by keyboard focus, and labelled so screen readers ignore it.
- **Routing and SEO.** `/` is the home page, `/work/:slug` a case study whose slug must exist in `content/caseStudies/` (anything else renders the 404 page), and every route sets its own `<title>` and meta description. A page that throws while rendering is replaced by `RouteErrorPage` inside the layout (`buildRoutes` in `src/app/routes.tsx`); it never shows the error itself. `vercel.json` rewrites unknown paths to `index.html`.
- **Errors.** Render with `ErrorNote`, which shows a short message and, for API errors, the `code` and a copyable `correlationId`. Branch on `code`, never on text.
- **Test IDs.** Every interactive element: `{...getTestIdProp(TestIds.contact.submitButton)}`, which renders `data-test-id="contact-submit-button"`. Naming is `{feature}-{element}-{type}`.
- **Performance.** Images below the fold are lazy-loaded with explicit `width` and `height`; fonts are self-hosted or preloaded; the home page stays within a Lighthouse score of 90 or more in every category.

## Formatting Values

| Value | On the wire | Display with |
|---|---|---|
| Instant | ISO-8601 UTC string | `formatInstant` (local time zone) |
| Date | `YYYY-MM-DD` | `formatDate` |
| Count | integer | `formatCount` (`Intl.NumberFormat`, grouped digits) |
| Period in content | `{start: 'YYYY-MM', end: 'YYYY-MM' \| null}` | `formatPeriod` ("06/2026 – Present") |

## Testing

- Vitest with jsdom, Testing Library, and jest-dom; the setup file configures `data-test-id` as the test ID attribute.
- `renderWithProviders` wraps the query client and a memory router.
- MSW handlers emulate the API: defaults in `src/test/handlers.ts`, per-test overrides with `server.use(...)`. MSW 3's unhandled-request option is `onUnhandledFrame`. Cover the success, fallback, and problem-response paths of every hook, and the main interaction of every page.
- Content tests check shape, not wording: every case study slug referenced by a card exists, every skill link points at an existing case study, and no content string is empty.
- Find elements by test ID or role, never by CSS class or DOM structure.
- Branch coverage stays at or above 80%.

## Important Notes

- `VITE_API_URL` is set in the Vercel project settings, which are the owner's; agents never change them. Anything prefixed `VITE_` is public in the bundle, so it never holds a secret.
- After a backend API change, run `make openapi` (or `gen:api`). Never edit `src/api/schema.d.ts` by hand.
- Do not start the dev server unless asked; type-checking and tests are enough for self-review.
- Agents never read or print `.env` or `.env.local` files.
