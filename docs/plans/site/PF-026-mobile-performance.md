# PF-026 — Mobile performance back to 90

**Ticket**: PF-026 · **Refined requirement**: [PF-026-refined-requirement.md](PF-026-refined-requirement.md) · **Packages**: frontend · **Status**: Approved 2026-11-25 · **Last updated**: 2026-11-25

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

Bring the mobile Lighthouse performance score of the home page back to 90 or more, with margin, without changing how the site looks or reads. PF-022 grew the entry bundle (diagram kit and data on every page) and PF-015 measured mobile performance at 85 on `/` (86 on `main` at `99ce517`). Maps to `../portfolio-implementation-plan.md` §7 Phase 8 (Lighthouse ≥ 90) and frontend principle 13 (fast and findable). Keeps SITE-001: content never waits for the API.

## 2. Requirement analysis

| Need | Source | Frontend work |
|---|---|---|
| The home page does not download the case-study page | Backlog PF-026, D1 | `React.lazy` case-study route |
| Bytes requested before the first paint shrink | S0 measurements, D2, D3 | Contact form loads near the viewport; phones get a small portrait |
| The critical fonts start with the HTML | Principle 13 ("fonts are self-hosted or preloaded"), D4 | Font preload links in every built HTML page |
| Nothing changes visually; navigation, deep links, 404, and the contact form keep working | FR-12 of PF-015, D5 | Tests per AC |
| Score ≥ 90 on every run | AC-1 | Lighthouse in S5 |

## 3. Current state

- `frontend/src/app/routes.tsx:2` imports `CaseStudyPage` statically, which pulls `CaseStudyArticle`, `GlanceAside`, the diagram kit (`src/components/diagram/`, 15 kB minified) and the diagram data (`src/content/diagrams/`, 28.5 kB) into the entry chunk. `glyphs.tsx` is also used by `SystemPanel`.
- `frontend/src/sections/Contact.tsx:8` lazy-loads the form (PF-009), but the `Suspense` renders at once, so the 37.7 kB gzip chunk is requested during the first render on `/`.
- `frontend/src/sections/Hero.tsx:18` serves the 480×480 portrait (33.7 kB) at every width; phones show it at 80px.
- `frontend/src/main.tsx:4` imports the fontsource `opsz.css` files; their latin `woff2` files (Source Serif 4, 122 kB; Bricolage Grotesque, 77 kB) are requested only once JavaScript has rendered text.
- `frontend/src/content/caseStudies/types.ts:8` keeps the Featured work row and the page in one object (PF-003 P4), so the home page keeps the case-study text (27.5 kB minified).

**S0 baseline and spike (2026-11-25, Lighthouse 13.5.0 mobile, `vite preview`, origin/main `3e54fcd`)**. Lighthouse simulates slow 4G from the observed trace and charges the first paint for every request that started before it; on `/` that was the entry chunk, the contact chunk, the portrait, and both fonts.

| Build | Entry gzip | `/` score (3 runs) | `/` FCP · LCP | Case study |
|---|---|---|---|---|
| `main` | 152.7 kB | 84, 85, 85 | 3.0 s · 3.5 s | 90 |
| + lazy case-study route (D1) | 139.5 kB | 87, 87, 87 | 2.9 s · 3.4 s | 90 |
| + contact form near the viewport (D2) | 139.6 kB | 89, 89, 88 | 2.7 s · 3.2 s | 90 |
| + phone portrait (D3) | 139.6 kB | 90, 90, 90 | 2.7 s · 3.0 s | 90 |
| + font preload (D4) | 139.6 kB | 94, 94 | 1.7 s · 3.0 s | 92 |

TBT stayed 0 ms and CLS 0 throughout.

## 4. Approach

Four independent changes, each measured in S0, none adding a dependency:

- **D1 — Lazy case-study route.** `routes.tsx` declares `const CaseStudyPage = lazy(() => import('../pages/CaseStudyPage').then((module) => ({ default: module.CaseStudyPage })))` for `work/:slug`, and `RootLayout` wraps `<Outlet />` in `<Suspense fallback={null}>`. The layout (skip link, header, footer) paints at once on a deep link; `main` keeps `min-h-dvh`, so the footer does not jump. React Router 8's `RouterProvider` wraps navigations in `startTransition` (default `useTransitions`), and because the boundary is already on screen, React keeps the current page visible until the chunk arrives. A boundary created with the route element would show its empty fallback even inside a transition: the S5 QA pass saw an empty `main` for 0.4–1.5 s on a slow network with that first build. The 404 for an unknown slug stays inside `CaseStudyPage`.
- **D2 — Contact form near the viewport.** A new hook `useNearViewport(ref)` returns `true` once the element is within one viewport height below the screen (`IntersectionObserver`, `rootMargin: '0px 0px 100% 0px'`), and then stays `true`; where `IntersectionObserver` is missing it returns `true` at once. `Contact` mounts the lazy `ContactForm` only then, and shows a placeholder as tall as the form until then and while the chunk loads (`min-h-120 sm:min-h-96`: the form measured 30rem stacked below 640px and 24rem with the fields side by side, within 2px at every width; the old 28rem placeholder was 34px short on phones and 66px tall from 640px). Header links, the hero Contact button, and `/#contact` all scroll the card into range, so the form starts loading as the visitor heads there.
- **D3 — Phone portrait.** Two smaller copies of the existing portrait, `portrait-160.webp` (6 kB) and `portrait-288.webp` (13.7 kB), made from `portrait.webp` with `cwebp 1.6.0 -q 82 -m 6 -resize {w} {w}`. The `<img>` gets `srcSet` (160w, 288w, 480w) and `sizes='(min-width: 100rem) 11.25rem, (min-width: 64rem) 9rem, (min-width: 40rem) 8rem, 5rem'`, the rendered sizes per tier: 80px on phones, 128px at `sm`, 144px at `lg`, and up to 180px where the root font grows from 1600px. A 1x laptop gets the 160w file, a 2x laptop or tablet the 288w file, and a 3x phone the 288w file. `src`, `width`, `height`, and `fetchPriority` stay.
- **D4 — Font preload.** A small Vite plugin in `vite.config.ts` (`apply: 'build'`, `transformIndexHtml` with `order: 'post'`) adds `<link rel="preload" as="font" type="font/woff2" crossorigin href="{base}{file}">` for the two latin `opsz` files found in the bundle (`assets/(bricolage-grotesque|source-serif-4)-latin-opsz-normal-*.woff2`) and fails the build unless it finds exactly two. The prerender step copies `dist/index.html`, so every case-study page carries the same links. `crossorigin` matches the CSS font fetch, so each file downloads once. The dev server is unaffected.
- **D11 — Scroll positions of fresh page loads keyed by path** (found in the S5 QA pass, present on `main`). React Router gives every fresh page load the location key `default`, so `ScrollRestoration` saved the home page's position and the case study's under one key: a case study opened by URL or in a new tab after scrolling the home page opened that far down (3,000px on `main`, clamped to about 200px with the lazy route), and Back then restored the wrong position. `RootLayout` passes `getKey` returning the path for `default` keys and the entry key otherwise, so in-app history, reload, hash links, and the brand link behave as before.
- **D5 — Out of scope.** Splitting the case-study text from the row data (contradicts PF-003 P4 for about 9 kB gzip), changing or subsetting the fonts (the owner approved the design), prefetching the case-study chunk on hover or idle (14 kB, and the transition keeps the current page visible), and prerendering the home page HTML (a large SSR change).

| Alternative | Why not |
|---|---|
| React Router route `lazy` instead of `React.lazy` | The router waits for matched lazy routes before its first render, so a case-study deep link would paint nothing, not even the header, until the chunk loads |
| Load the contact chunk on idle after load | Idle can come before the first paint finishes on a fast machine, putting the chunk back on the simulated critical path; near-viewport is the standard pattern |
| `loading='lazy'` on the portrait | It is above the fold and the LCP candidate on desktop; it keeps `fetchPriority='high'` |
| A manual `<link rel="preload">` in `index.html` | The font file names carry a content hash that changes with fontsource upgrades; the plugin reads them from the bundle and fails loudly |

**Reuse**: the PF-009 `React.lazy` pattern and placeholder; the PF-009 prerender step; `useActiveSection`'s guard for a missing `IntersectionObserver`. **Single responsibility**: `useNearViewport` reports one latch, `Contact` decides what to mount, the plugin only writes preload tags.

## 6. Frontend

### Components and routes

- `routes.tsx` (changed): `/work/:slug` renders the lazy `CaseStudyPage`; `RootLayout` (changed) holds the `Suspense` boundary around `<Outlet />`. Titles and meta descriptions are unchanged; the prerendered case-study HTML gains the font preloads.
- `Contact` (changed): mounts `ContactForm` once `useNearViewport` reports `true`.
  - `useNearViewport` (new, `src/sections/useNearViewport.ts`).
- `Hero` (changed): portrait `srcSet` and `sizes`.
- `vite.config.ts` (changed): the `preloadFonts` plugin.

### Data and states

| View | Loading | Fallback | Error |
|---|---|---|---|
| Case-study route, deep link | Layout visible, `main` empty until the chunk arrives (`fallback={null}`) | n/a (static content) | A failed chunk load throws to `RouteErrorPage`, as any render error does |
| Case-study route, from another page | Current page stays visible (transition) | n/a | As above |
| Contact form | A placeholder as tall as the form until near the viewport and while the chunk loads | Unchanged | Unchanged |

### Test IDs

None new.

## 8. Files, order, risks, tests

**New**: `frontend/src/sections/useNearViewport.ts`, `frontend/src/sections/Contact.test.tsx`, `frontend/src/assets/portrait-160.webp`, `frontend/src/assets/portrait-288.webp`, `frontend/e2e/performance.spec.ts`.

**Modified**: `frontend/src/app/routes.tsx`, `frontend/src/app/RootLayout.tsx`, `frontend/src/app/routes.test.tsx`, `frontend/src/pages/CaseStudyPage.test.tsx`, `frontend/src/pages/HomePage.test.tsx` (if a test needs the form), `frontend/src/sections/Contact.tsx`, `frontend/src/sections/Hero.tsx`, `frontend/vite.config.ts`, `frontend/e2e/smoke.spec.ts`, `frontend/e2e/responsive.spec.ts`, `frontend/CLAUDE.md` (Performance pattern), `docs/architecture/frontend.md` (principle 13), `docs/knowledge/tooling.md`, `docs/prd/backlog.md`.

**Order** (frontend only; S1 to S3 are independent and run in parallel, each ending with type check, lint, format, and unit tests green):

1. **S1 — Lazy case-study route.** `routes.tsx`; tests that render `/work/:slug` through the real routes wait for the first element (`findBy…`). Tests: AC-2, AC-4.
2. **S2 — Contact form near the viewport.** `useNearViewport`, `Contact`. Tests: AC-3.
3. **S3 — Portrait and font preload.** The two webp files, `Hero`, the plugin. Tests: AC-5, AC-6.
4. **S4 — End-to-end.** `e2e/performance.spec.ts`; the smoke and responsive specs scroll to Contact before they use the form. Tests: AC-2 to AC-6.
5. **S5 — Measure and sync.** Lighthouse mobile and desktop on `vite preview`, 3 runs on `/`, one each on two case studies (AC-1); coverage ≥ 80%; docs updated.

| Risk | Mitigation |
|---|---|
| A test or a visitor uses the form before it loads | Near-viewport starts one screen early; Playwright scrolls Contact into view first; the placeholder keeps the height |
| A failed case-study chunk (deploy swapped the hash while a tab was open) | The router's error element shows `RouteErrorPage` with a home link, as for any render error; a reload fetches the new chunk |
| The preload and the CSS fetch use different modes and download twice | `crossorigin` on the link; AC-6 asserts each font file is requested once |
| A fontsource upgrade renames the files | The plugin fails the build unless it finds exactly two |
| The smaller portrait looks soft on a 3x phone | 80px × 3 = 240 picks the 288w file |
| The score is close to 90 on a slower runner | Measured margin: 94 locally; production adds Brotli and HTTP/2 |

**Tests** (within the test budget):

- `routes.test.tsx`: a case-study path renders its title through the lazy route. `CaseStudyPage.test.tsx`: the first assertion of each test that uses `renderRoute` waits with `findBy…`.
- `Contact.test.tsx`: with a stubbed `IntersectionObserver`, the form region is absent until the card intersects, then appears; without `IntersectionObserver` it appears at once.
- `e2e/performance.spec.ts` (Chromium, API calls aborted): AC-2 `/` loads one script and no case-study chunk; AC-3 the contact chunk is requested only after scrolling to Contact, and the form appears via `/#contact`; AC-4 home → work row → case study → next link, and a deep link shows the diagram; AC-5 at 390px and device scale 2 the portrait's `currentSrc` is the 160w file, at 1366px and scale 2 the 288w file; AC-6 `/` and a case study each carry exactly two font preloads with `crossorigin`, and each font file is requested once.
- `smoke.spec.ts`, `responsive.spec.ts`: scroll Contact into view before the form assertions. `smoke.spec.ts` also opens a case study by URL after scrolling the home page and expects it at the top, then Back at the home position (D11; it failed on the build before the fix).
- Checked at build time, not asserted: AC-1 Lighthouse.
- `performance.spec.ts` also blocks the case-study chunk on a deep link and expects the error page inside the layout (FR-6, the code review's one gap), and holds the chunk back during a click from `/` while sampling that the home page stays on screen (FR-2; this test failed on the first build and passes on the fixed one).

**Accepted trade-offs** (S5 QA and code review):

- Until the contact card nears the viewport the form is not in the DOM, so find-in-page or printing before scrolling does not see it; Tab and any scroll reach it, because the contact links come first in the same section (D2).
- Holding Tab down (about 25 ms per press) can pass the contact links before the chunk has loaded, so focus skips the form once; at normal pace (150 ms or more) focus lands on the name field.
- After a jump to Contact (End, the hero button) on a throttled slow-4G phone, the placeholder shows for about 1.3 s before the form; the note and the email, LinkedIn, and GitHub links beside it work at once.
- The route error page keeps the previous document title, as it does on `main` for any render error.

**Results (S5, 2026-11-25)**:

| Check | Result |
|---|---|
| Entry chunk | 152.7 kB → 139.6 kB gzip; `CaseStudyPage` chunk 13.8 kB gzip, loaded only on `/work/:slug` |
| Lighthouse mobile, `/` | Performance 94, 93, 93 on the final build (was 84, 85, 85); FCP 1.7 s, LCP 3.0–3.2 s, TBT 0 ms, CLS 0. Accessibility 100, best practices 100, SEO 92 (robots.txt is PF-012) |
| Lighthouse mobile, case studies | 92 (`legacy-app-web-port`), 92 (`this-site`); was 90 |
| Lighthouse desktop | `/` 100, 100, 100, 92; a case study 100, 100, 100, 91 |
| Unit tests | 21 files, 146 tests; branch coverage 89.8% |
| End-to-end | 49 tests green; `performance.spec.ts` and `smoke.spec.ts` stable over three repeats |
