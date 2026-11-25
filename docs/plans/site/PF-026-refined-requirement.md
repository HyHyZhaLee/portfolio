# PF-026 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-026 — Mobile performance back to 90 · **Plan**: [PF-026-mobile-performance.md](PF-026-mobile-performance.md) · **Master plan section**: `../portfolio-implementation-plan.md` §7 Phase 8 · **Status**: Confirmed · **Last updated**: 2026-11-25

## 1. Problem and goal

Recruiters and hiring managers often open the site on a phone first, so mobile load speed is part of the pitch. Mobile Lighthouse performance on `/` fell to 85 (86 on `main` at `99ce517`) after PF-022 grew the entry bundle from 127 to 152.7 kB gzip. On 2026-11-25 the owner asked to "do PF-026 the same way" as PF-015: full plan, build, review, PR, and merge without asking for permission. The goal is performance of 90 or more on every mobile run of `/` and of case-study pages, with margin, and no visible change.

## 2. Scope

**In scope**

- Frontend loading behaviour only: a lazy case-study route, the contact form loading near the viewport, a smaller portrait for phones, and a font preload.
- The pre-existing scroll-position key collision (fresh page loads share the location key `default`) is fixed in this ticket (D11, FR-7).

**Out of scope (deferred)**

- Copy or design changes: the design was approved in PF-003 and content is owner-reviewed (Non-Negotiable 2).
- Font changes or subsetting: the owner approved the design.
- Splitting the case-study text from the row data: it contradicts PF-003 P4 for about 9 kB gzip.
- Prefetching the case-study chunk on hover or idle: not needed, because the transition keeps the current page visible.
- Prerendering the home page HTML: a large SSR change.
- Backend changes: none needed.
- robots.txt and SEO 92: that belongs to PF-012.

**Known limitations (accepted)**

- Holding Tab down faster than the case-study chunk loads can skip the contact form once.
- After a jump to Contact on a throttled slow-4G phone, the placeholder shows for about 1.3 s, while the links beside it work at once.
- The route error page keeps the previous document title, as on `main`.

## 3. Functional requirements

- **FR-1**: The home page does not download the case-study page, the diagram kit, or the diagram data. Source: backlog PF-026
- **FR-2**: A case-study deep link paints the layout (skip link, header, footer) at once and the article when its chunk arrives. In-app navigation never shows an empty page while the case-study chunk loads: the current page stays on screen until the case study renders. Source: clarified 2026-11-25
- **FR-3**: The contact form loads when its card is within one screen of the viewport, or at once in a browser without IntersectionObserver, and the placeholder is as tall as the form (30rem below 640px, 24rem from 640px), so nothing moves when the form replaces it. Source: clarified 2026-11-25
- **FR-4**: Phones get a portrait sized for 80px; other widths keep a sharp portrait. Source: clarified 2026-11-25
- **FR-5**: Every built HTML page preloads the two critical latin fonts, and each font file is downloaded once. Source: clarified 2026-11-25
- **FR-6**: Nothing else changes: page titles and meta descriptions, the 404 page for an unknown slug, the route error page, layout, and tests. Source: clarified 2026-11-25
- **FR-7**: A case study opened by URL or in a new tab starts at the top, and Back to the home page restores the home position; in-app history, reload, and hash links behave as before. Context: QA found that every fresh page load shares React Router's location key `default`, so a case study opened by URL after scrolling the home page opened that far down (3,000px on `main`), and fresh loads are now keyed by path. Source: clarified 2026-11-25 (S5 QA pass)

## 4. Product rules and edge cases

- **SITE-001**: content never waits for the API. Unchanged; the layout of a case-study deep link paints before its chunk arrives.
- **API down or asleep:** unchanged; this ticket touches no API-backed section.
- **Privacy:** unchanged. Nothing new is stored or sent, and there are no new cookies or storage.
- **Abuse:** not applicable, because there are no new endpoints or forms.
- **Failed chunk load:** a failed case-study chunk load throws to the route error page, as any render error does.
- **Deep link `/#contact`:** it scrolls the contact card into range, so the form starts loading and appears.
- **Build safety:** the font preload step fails the build unless it finds exactly two latin font files, so a fontsource upgrade cannot silently drop the preload.

## 5. Interface decisions

**API**: none.

**UI**: no visible change. The contact card shows its existing placeholder until the form loads. No new UI strings, and page titles and meta descriptions are unchanged.

**Content**: no new public content blocks; disclosure tiers are unaffected.

## 6. Open questions

None. The approach was measured in the plan's S0 spike and decided by best practice.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-25 | The case-study route loads lazily with `React.lazy` inside `Suspense`, not with React Router's route `lazy`. | Plan S0 measurements: the home score rose from 85 to 87. Route `lazy` makes the router wait before its first render, so a deep link would paint nothing until the chunk loads. |
| D2 | 2026-11-25 | The contact form mounts only when its card is within one viewport height of the screen, with the existing placeholder until then. | Plan S0 measurements: the score rose to 89. Loading on idle can fall inside the first paint on a fast machine. |
| D3 | 2026-11-25 | Phones get smaller portrait variants (160w and 288w) made from the existing portrait with cwebp 1.6.0, served through `srcSet` and `sizes`. | Plan S0 measurements: the score reached 90 and LCP fell from 3.2 s to 3.0 s. |
| D4 | 2026-11-25 | The two critical latin fonts are preloaded by a Vite plugin that reads the hashed file names from the bundle and fails the build unless it finds exactly two. | Plan S0 measurements: the score reached 94 and FCP fell to 1.7 s. Hashed names change with fontsource upgrades, so a hand-written link would rot. |
| D5 | 2026-11-25 | Out of scope: splitting case-study text from row data, font changes or subsetting, prefetching on hover or idle, and prerendering the home page. | Owner instruction 2026-11-25 to keep the design as approved; each item costs more than it gains. |
| D6 | 2026-11-25 | The owner asked for no permission prompts, so the plan was approved by the orchestrating session on 2026-11-25. | Owner instruction 2026-11-25. |
| D7 | 2026-11-25 | In-app navigation keeps the current page on screen until the case-study chunk renders; the Suspense boundary is held in the layout. | S5 QA pass: the first build showed an empty main for 0.4 to 1.5 s on a slow network. |
| D8 | 2026-11-25 | The contact placeholder is as tall as the form: 30rem below 640px, 24rem from 640px. | S5 QA pass: nothing moves when the form replaces the placeholder. |
| D9 | 2026-11-25 | Phones and laptops use the sizes tiers 80px, 128px at 640px, 144px at 1024px, and up to 180px from 1600px; the 160w file serves a 1x laptop. | S5 QA pass: `sizes` follows the rendered size per tier, so the AC-5 file choice follows the rendered size. |
| D10 | 2026-11-25 | Three trade-offs are accepted and listed under Known limitations: a fast Tab hold can skip the form once, a slow-4G jump to Contact shows the placeholder for about 1.3 s, and the route error page keeps the previous title. | S5 QA pass: each costs less than the fix it would need. |
| D11 | 2026-11-25 | The pre-existing scroll-position key collision is fixed in this ticket: fresh page loads are keyed by path, not `default`. | S5 QA pass: the lazy route changed what a fresh case-study load showed, and the fix is one line. |

## 8. Acceptance criteria (refined)

- **AC-1**: Lighthouse 13.5.0 mobile performance is at least 90 on each of 3 runs of `/` and on two case studies, on `vite preview` (checked at build time and recorded in the plan).
- **AC-2**: Opening `/` requests one script and no case-study chunk.
- **AC-3**: The contact chunk is requested only after scrolling toward Contact, and the form appears via `/#contact` and works.
- **AC-4**: Home, then a work row, then a case study, then its next link works; a deep link shows the diagram; an unknown slug shows the 404 page.
- **AC-5**: At 390px and device scale 2 the portrait uses the 160w file; at 1366px and device scale 2 it uses the 288w file. A 1x laptop gets the 160w file, because `sizes` follows the rendered size per tier: 80px, 128px at 640px, 144px at 1024px, up to 180px from 1600px.
- **AC-6**: `/` and a case study each carry exactly two font preloads with `crossorigin`, and each font file is requested once.
- **AC-7**: No regression: CLS 0, TBT 0, all unit and e2e tests pass, and branch coverage stays at 80% or more.
- **AC-8**: An e2e test in `smoke.spec.ts` opens `/`, scrolls to 3000, opens `/work/this-site` by URL, and `scrollY` is 0; Back restores 3000.
