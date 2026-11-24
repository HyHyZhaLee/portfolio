# PF-009 — Polish and launch (in-repo parts)

**Ticket**: PF-009 · **Refined requirement**: [PF-009-refined-requirement.md](PF-009-refined-requirement.md) · **Packages**: frontend · **Status**: Approved 2026-11-24 · **Last updated**: 2026-11-24

> No complex flows.

## 1. Requirement summary
Finish what can be done in the repository before the live deployment (PF-012): a README that explains the site and its engineering, Lighthouse scores of at least 90, a cross-browser run of the smoke suite, and per-route HTML for link previews (PF-003 D7). Maps to `../portfolio-implementation-plan.md` §7 Phase 8. Every clarifying question was decided with its recommended default, pre-approved by the owner (blanket approval, 2026-11-24); the decisions are D1 to D5 in the refined requirement.

## 2. Requirement analysis
| Need | Source | Frontend work |
|---|---|---|
| README with architecture, stack, setup, decisions, badges | Backlog PF-009 | Rewrite `README.md` (Mermaid diagram, badges, links to `docs/`) |
| Lighthouse at least 90 | Backlog PF-009 | Measure, then fix in code |
| Cross-browser check | Backlog PF-009 | Optional Firefox and WebKit projects in `playwright.config.ts`, run locally |
| Prerendered meta for link previews | PF-003 D7 | `src/app/routeMeta.ts`, `scripts/prerender.mjs`, build script |

## 3. Current state
`useDocumentMeta` sets the title and description after JavaScript runs, so a crawler reads the static tags in `index.html` for every route (`frontend/index.html`). `vercel.json` rewrites everything to `/index.html` and serves real files first. The smoke suite runs Chromium only (`frontend/playwright.config.ts`).

## 4. Approach
**Prerender (D3, D4)**: `src/app/routeMeta.ts` holds `homeMeta`, `caseStudyMeta`, and `prerenderedRoutes`; `HomePage` and `CaseStudyArticle` call the first two, so the tags cannot drift from the page. The build script adds `vite build --ssr src/app/routeMeta.ts --outDir node_modules/.tmp/ssr` and `node scripts/prerender.mjs`, which copies `dist/index.html` to `dist/work/<slug>/index.html` with the title, description, `og:title`, and `og:description` replaced (HTML-escaped; the build fails if a tag is missing). No new dependency, about 30 lines. `dist/index.html` stays as is for `/` and as the SPA fallback, so an unknown slug still shows the 404 page.

**Lighthouse (D2)**: baseline on a production build served by `vite preview` with the API unreachable. Only the mobile performance score of `/` and `/work/*` was under 90 (88); the fixes are the lazy contact-form chunk, a favicon, and source maps.

**Cross-browser (D5)**: `E2E_ALL_BROWSERS=1` adds Firefox and WebKit projects; CI is unchanged and keeps Chromium only.

| Alternative | Why not |
|---|---|
| `vite-plugin-prerender`, `react-snap`, or full SSR | A new dependency or a second render pipeline for seven static tags |
| Prerender the full DOM of each route | Needs a DOM renderer at build time; the previews only need the head |
| Lazy-load whole routes | Does not shrink the home page, which is what scored under 90 |

**Reuse**: the content modules and `t()`. **Single responsibility**: `routeMeta.ts` names each route's tags; `prerender.mjs` writes the files.

## 6. Frontend
### Components and routes
`Contact` loads `ContactForm` with `React.lazy` and a `Suspense` fallback of fixed height (28rem), so the form's libraries (react-hook-form, zod) leave the entry chunk. Routes are unchanged; each case-study route now also exists as `dist/work/<slug>/index.html` (served at `/work/<slug>` by Vercel; `vite preview` serves it at `/work/<slug>/`).
### Content
README text describes the site and its engineering only; no new claim about the owner's work (Tier A). Prerendered tags reuse the existing case-study titles and meta descriptions, which are still placeholders until PF-012.
### Test IDs
None new.

## 8. Files, order, risks, tests
**New**: `frontend/src/app/routeMeta.ts`, `routeMeta.test.ts`, `frontend/scripts/prerender.mjs`, `frontend/public/favicon.svg`. **Modified**: `README.md`, `frontend/package.json` (build script), `frontend/vite.config.ts` (source maps), `frontend/index.html` (favicon link), `frontend/playwright.config.ts`, `frontend/e2e/smoke.spec.ts`, `frontend/src/sections/Contact.tsx`, `CaseStudyArticle.tsx`, `HomePage.tsx`, `docs/prd/backlog.md`, `docs/knowledge/tooling.md`.

| Risk | Mitigation |
|---|---|
| A template change in `index.html` breaks the tag replacement | The script throws when a pattern does not match, which fails the build |
| Placeholder meta text published in the HTML | Same text as today's client-side tags; replaced with the content pack in PF-012 |
| The lazy form shifts the layout | Fixed-height fallback; Lighthouse reports CLS 0 |
| Source maps expose source | The repository is public; maps help the Lighthouse best-practices audit |

**Tests**: `routeMeta.test.ts` (one route per slug, titles, description from content); two smoke tests (case-study HTML source carries its own title; an unknown slug still shows the 404 page). Existing tests cover the lazy form.

## Results
**Lighthouse 13.5.0**, Chromium for Testing (Playwright), headless, `vite preview` of the production build, API unreachable. Scores are performance / accessibility / best practices / SEO.

| Page and form factor | Before | After |
|---|---|---|
| `/` desktop | 100 / 100 / 96 / 91 | 100 / 100 / 96 / 91 |
| `/` mobile | 88 / 100 / 96 / 91 | 90 / 100 / 96 / 91 |
| `/work/scheduling-platform` desktop | 100 / 100 / 96 / 91 | 100 / 100 / 100 / 91 |
| `/work/scheduling-platform` mobile | 88 / 100 / 96 / 91 | 92 / 100 / 100 / 91 |

All four categories are at least 90 after the change. The entry bundle went from 538 kB (164 kB gzip) to 417 kB (127 kB gzip). Remaining findings, none a code issue here: the `/` best-practices 96 is the console error from the refused API calls the test setup causes on purpose; SEO 91 is the missing `robots.txt` (PF-012). The new "agentic browsing" category (50) is outside the four tracked categories (`llms-txt` and an agent schema; not planned). The mobile home score sits at the threshold, so re-measure on the production URL.

**Cross-browser** (smoke suite, `E2E_ALL_BROWSERS=1`): Chromium 6/6, WebKit 6/6. Firefox could not run: the Playwright Firefox build (159) exits at launch with "Could not find profile folder" even when started by hand with a fresh profile, so this is an environment limit, not a site failure. Re-run it on another machine.

## Owner steps (need the live site)
1. After PF-012: add the live URL to the README and run Lighthouse on the production URL.
2. Run the Firefox part of the cross-browser check where Firefox launches.
3. Set up the uptime monitor on `/actuator/health` (and the keep-warm ping if wanted).
4. Walk the smoke checklist on the production site.
5. Open the site once with `?notrack=1` on each of your own devices.
6. Add the site link to the CV, LinkedIn, and the GitHub profile.
7. Replace the placeholder titles and descriptions with the content pack (the prerendered HTML picks them up on the next build).
