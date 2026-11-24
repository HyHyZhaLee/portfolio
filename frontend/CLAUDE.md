# frontend/CLAUDE.md

> Written before the code (PF-001) as the working contract for `frontend/`. The commands were confirmed when PF-002 scaffolded the package; component names are confirmed from PF-003 on. Where this file and the code disagree, fix whichever is wrong in the same change. This package has no docs folder: its design guide is `docs/architecture/frontend.md`, and its work is planned in the frontend section of each ticket's plan in `docs/plans/`.

## Quick Reference

| | |
|---|---|
| Runtime | Node 24.22.0, pinned in the root `.nvmrc` |
| Package manager | pnpm 11.0.9 through corepack, pinned in `packageManager` to corepack's default because commands run from the repository root (`docs/knowledge/tooling.md`); exact versions via `saveExact` in `frontend/pnpm-workspace.yaml` (`KNOWN-FE-004`) |
| Build | Vite 8, TypeScript 6.0 in strict mode with `noUncheckedIndexedAccess` (7.x waits for typescript-eslint, `KNOWN-FE-003`) |
| UI | React 19, Tailwind CSS v4 with design tokens in `@theme` (`src/index.css`), light scheme only, whatever the system setting (PF-003 D9) |
| Routing | React Router 8: `/`, `/work/:slug` (an unknown slug renders the 404 page), and `*`; per-route title and meta description through `useDocumentMeta`; the Vercel SPA rewrite in `frontend/vercel.json` |
| Data | TanStack Query for server state; `openapi-fetch` with types from `openapi-typescript` |
| Forms | react-hook-form with zod schemas |
| Analytics | `@vercel/analytics` (cookieless, PF-012) plus the site's own visit tracking (PF-005) |
| Tests | Vitest, Testing Library, jest-dom, MSW |
| Hosting | Vercel Hobby; Root Directory `frontend`; production is deployed by the `deploy` job in `.github/workflows/frontend.yml` after the checks pass, with Vercel's own Git deploys off and the install and build commands in `vercel.json` (PF-013) |

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
scripts/with-node.sh pnpm --dir frontend test:e2e         # Playwright smoke suite against the production build, no backend (PF-008); first run: exec playwright install chromium
scripts/with-node.sh pnpm --dir frontend gen:api          # regenerate src/api/schema.d.ts from the OpenAPI snapshot
```

## Code Style

- Prettier: semicolons, single quotes (JSX too), trailing commas, 4-space indentation, print width 160. Markdown and generated files are ignored.
- ESLint flat config with the type-checked and stylistic presets and the React hooks rules as errors. Test files may relax the `no-unsafe-*` rules only.
- No `any`. Prefer types derived from `components['schemas']` and `paths` in the generated schema.
- Named exports, one component per file. Components are `PascalCase.tsx`, hooks `useThing.ts`, other modules `camelCase.ts`, tests `*.test.ts(x)` next to the code they test.
- Tailwind utility classes with the theme's tokens (`bg-surface`, `text-muted`); no inline hex colours, no `style` props for colour or spacing, and no new CSS file without a reason.

## Project Structure _(PF-002 and PF-003 built everything below except the files marked with a later ticket and the `contact` feature; PF-005 built `utils/` and the `visits` and `stats` features; PF-006 built the `contact` feature and `ErrorNote`; PF-007's `projects` feature, `fallbackRepos`, and `OpenSource` were removed in PF-012)_

```
frontend/
├── index.html                  # default title, meta description, Open Graph tags
├── vercel.json                 # SPA rewrite for /work/:slug, pinned install and build commands, Git deploys off (PF-013)
├── public/                     # not created yet: og-image.png, robots.txt, sitemap.xml in PF-012; a favicon has no ticket yet
└── src/
    ├── index.css               # Tailwind import and @theme design tokens
    ├── api/                    # schema.d.ts (generated, never edited) · client.ts · errors.ts
    ├── app/                    # providers, router, layout, useDocumentMeta
    ├── components/             # shared primitives: Section, ChipList, ButtonLink, StatusDot, ErrorNote (PF-006); Card, Skeleton with their first caller
    ├── config/                 # test-ids.config.ts
    ├── content/                # typed static content: profile, site, skills, experience, howIWork, education, featuredWork, caseStudies/{slug}.ts
    ├── features/               # API-backed: visits, stats, contact, api-status
    ├── pages/                  # HomePage, CaseStudyPage, CaseStudyArticle, GlanceAside, NotFoundPage, RouteErrorPage
    ├── sections/               # Header, Hero, ProofPoints, About, FeaturedWork, WorkRow, HowIWork, Skills, Experience, Education, Contact, Footer
    ├── i18n/                   # en.ts and t() for UI strings
    ├── test/                   # setup, renderWithProviders, MSW handlers
    └── utils/                  # format.ts with formatCount (PF-005)
```

## Key Patterns

- **Content is data.** Every word of portfolio copy lives in a typed file under `src/content/`: one file per section, one file per case study in `content/caseStudies/{slug}.ts`. Sections and pages render it; they hold no copy of their own. Only text the owner has reviewed goes in, it follows the disclosure tiers, and it matches the CV (Non-Negotiable 2, `.claude/rules/content-conventions.md`). UI strings such as button labels, form errors, and status messages come from `t('key')` instead.
- **Sections vs features.** A section (`src/sections/`) is presentational and renders static content. A feature (`src/features/{feature}/`) talks to the API: `api.ts` for typed calls, `queries.ts` for hooks and the query-key factory, `types.ts`, `validation.ts` for zod schemas when there is a form, then components and their tests. Other code imports a feature only from its `index.ts`. A section may embed a feature component, as `Hero` embeds the system panel, and `Footer` embeds the API status dot and the visit counter.
- **The page never waits for the API.** Every API-backed view has a loading state, a fallback, and an error state, and nothing above it waits for it (Non-Negotiable 1). The counter asks for data only once the shared health check says the API is online, and the visit beacon waits for it too (PF-022); the counter hides on failure, the status dot and the panel turn red when the API is unreachable after the retries, the system panel shows a calm waking state, and the contact form shows its cold-start hint while a send is pending.
- **API calls.** Use the client from `src/api/client.ts` only. Its base URL is `import.meta.env.VITE_API_URL` (empty in development, where the Vite proxy forwards `/api`, `/actuator`, `/v3/api-docs`, and `/swagger-ui` to `localhost:8080`). It adds `X-Correlation-Id`, applies a timeout (15 s by default, 100 s for the health check, the visit beacon, and the contact form so they survive a cold start (Render took 78.8 s on 2026-11-24)), and throws `ApiError` (`status`, `code`, `detail`, `correlationId`, `errors`) for problem responses, `code: 'UNEXPECTED_RESPONSE'` for an error without problem JSON or a 2xx body that is not JSON, and `code: 'NETWORK_ERROR'` when no usable response arrives. It falls back when the browser lacks `AbortSignal.any` or `crypto.randomUUID`. The health endpoint is outside the OpenAPI contract; `api-status` starts it when the app mounts, retries a failed attempt twice, and re-checks it every 60 s while the tab is visible for the first 15 minutes (PF-022), through `createApiClient<LocalPaths>({ tolerateStatus: [503], timeoutMs: COLD_START_TIMEOUT_MS })` with types in its `types.ts`, and treats the 503 body as data (`KNOWN-FE-006`).
- **Queries.** One hook per query, keys from the feature's factory, no retry on 4xx. Live data never replaces content the visitor is reading mid-scroll with a layout jump: reserve its space.
- **Mutations.** Creating mutations (a visit, a contact message) never retry on their own.
- **Visit tracking.** `useTrackPageView` in `features/visits`, called by `RootLayout`, posts one view per page load and one per route change, only in production builds (`import.meta.env.PROD`); its effect is keyed on the pathname, so anchors and query changes never count and the address-bar cleanup cannot re-trigger it (`KNOWN-FE-002`). It reads `?ref=` and keeps it in `sessionStorage`, applies `?notrack=1` (sets `localStorage.notrack = '1'`) and `?notrack=0` (removes it), then removes only those two parameters with the router's replace navigation and `preventScrollReset`, never `history.replaceState`, which would leave `useLocation` on the old address. It posts `{path, referrer, ref}`, with the referrer reduced to its origin, through its own 100 s client (`COLD_START_TIMEOUT_MS`) with `keepalive: true`, so the first view after an idle period survives a cold start and the visitor leaving. It does nothing after `?notrack=1` (`localStorage.notrack === '1'`, also kept in memory for the page load) or when `navigator.globalPrivacyControl` is true (Non-Negotiable 3), and never sets a cookie. Storage access is wrapped: when storage is blocked, the opt-out still holds for the rest of the page load and the ref tag goes with the first view only. `useVisitCounted` reads the mutation's outcome for the system panel's "counted" note.
- **Forms.** react-hook-form with `zodResolver`. Schemas mirror the server's limits. Map `ApiError.errors` onto fields after a `VALIDATION_FAILED` response; show a friendly message for `RATE_LIMITED`. The contact form's `website` honeypot sits off-screen (not `display: none`) inside an `aria-hidden` wrapper, with `tabIndex={-1}` and `autoComplete="off"`, and is sent as typed (PF-006 D17); the form shows its cold-start hint for the whole pending send (PF-006 D12).
- **Routing and SEO.** `/` is the home page, `/work/:slug` a case study whose slug must exist in `content/caseStudies/` (anything else renders the 404 page), and every route sets its own `<title>` and meta description. A page that throws while rendering is replaced by `RouteErrorPage` inside the layout (`buildRoutes` in `src/app/routes.tsx`); it never shows the error itself. `vercel.json` rewrites unknown paths to `index.html`.
- **Errors.** Render with `ErrorNote` (`role="alert"`), which shows a short message and, for API errors, the `code` and the `correlationId` as selectable text, so one click selects it to copy (PF-006 D18). Branch on `code`, never on text.
- **Test IDs.** Every interactive element: `{...getTestIdProp(TestIds.contact.submitButton)}`, which renders `data-test-id="contact-submit-button"`. Naming is `{feature}-{element}-{type}`.
- **Performance.** Images below the fold are lazy-loaded with explicit `width` and `height`; fonts are self-hosted or preloaded; the home page stays within a Lighthouse score of 90 or more in every category.

## Formatting Values

| Value | On the wire | Display with |
|---|---|---|
| Instant | ISO-8601 UTC string | `formatInstant` (local time zone) _(planned: waits for its first caller)_ |
| Date | `YYYY-MM-DD` | `formatDate` _(planned: waits for its first caller)_ |
| Count | integer | `formatCount` (`Intl.NumberFormat('en')`, grouped digits whatever the visitor's locale, PF-005) |
| Period in content | a display string written in content, such as `06/2026 – Present` | rendered as written (PF-003 P4) |

## Testing

- Vitest with jsdom, Testing Library, and jest-dom; the setup file configures `data-test-id` as the test ID attribute.
- `renderWithProviders` wraps the query client and a memory router.
- MSW handlers emulate the API: defaults in `src/test/handlers.ts` (a healthy `GET /actuator/health`, which every page renders, a 202 for `POST /api/v1/visits`, zero totals for `GET /api/v1/stats/summary`, which the footer counter asks for once health answers, a 202 with an `X-Correlation-Id` for `POST /api/v1/contact-messages`, which every page's contact form may send), per-test overrides with `server.use(...)`. Vitest sets `VITE_API_URL` to `http://api.test`, because openapi-fetch's `new Request()` rejects a relative URL in Node. MSW 3's unhandled-request option is `onUnhandledFrame`. Cover the success, fallback, and problem-response paths of every hook, and the main interaction of every page.
- Content tests check shape, not wording: every case study slug referenced by a card exists, every skill link points at an existing case study, and no content string is empty.
- Find elements by test ID or role, never by CSS class or DOM structure.
- Branch coverage stays at or above 80%.

## Important Notes

- `VITE_API_URL` is set in the Vercel project settings, which are the owner's; agents never change them. Anything prefixed `VITE_` is public in the bundle, so it never holds a secret.
- After a backend API change, run `make openapi` (or `gen:api`). Never edit `src/api/schema.d.ts` by hand.
- Do not start the dev server unless asked; type-checking and tests are enough for self-review.
- Agents never read or print `.env` or `.env.local` files.
