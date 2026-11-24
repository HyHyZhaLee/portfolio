# PF-009 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-009 — Polish and launch, in-repo parts · **Plan**: [PF-009-polish.md](PF-009-polish.md) · **Master plan section**: `../portfolio-implementation-plan.md` §7 Phase 8 · **Status**: Confirmed · **Last updated**: 2026-11-24

## 1. Problem and goal
A recruiter or hiring manager opening the repository or a shared link should find a clear README, a fast and accessible site, a site that works in the major browsers, and a link preview that names the page. This ticket finishes everything of that which does not need the live site.

## 2. Scope

**In scope**

- README rewrite with a Mermaid architecture diagram, stack, local setup, design decisions, quality gates, CI badges, and links to `docs/`.
- Lighthouse measurement of `/` and one case study (desktop and mobile) and code fixes for any category under 90.
- Smoke suite run in Firefox and WebKit locally.
- Build-time per-route HTML for case studies (title, description, `og:title`, `og:description`).

**Out of scope (deferred)**

- `robots.txt`, `sitemap.xml`, `og-image`, and the live-URL check: PF-012.
- Screenshots in the README: the copy is placeholder until PF-012.
- Uptime monitor, production Lighthouse, smoke checklist, `?notrack=1` on the owner's devices, links from the CV, LinkedIn, and GitHub: they need the live site (owner steps in the plan).
- Firefox and WebKit in CI: the workflow is not changed (an open owner pull request edits it).

## 3. Functional requirements

- **FR-1**: `README.md` states what the site is, has a live-link placeholder, a Mermaid diagram of browser, Vercel, Render, Neon, GitHub API, and Resend, the stack, the local commands, the Swagger UI link, the design decisions, the gates with three CI badges, and links to `docs/`. Source: backlog PF-009
- **FR-2**: The README says nothing about the owner's work beyond name, title, and GitHub URL. Source: public text rules
- **FR-3**: Lighthouse performance, accessibility, best practices, and SEO are each at least 90 for `/` and a case study, desktop and mobile, with the API unreachable, except for causes owned by PF-012 or the intentionally refused API calls. Source: backlog PF-009
- **FR-4**: The smoke suite can run in Firefox and WebKit with `E2E_ALL_BROWSERS=1`; CI is unchanged. Source: clarified 2026-11-24
- **FR-5**: `pnpm build` writes `dist/work/<slug>/index.html` for each case study with that route's title, description, `og:title`, and `og:description` from the same modules the app uses, and keeps `dist/index.html`. An unknown slug still shows the 404 page. Source: PF-003 D7
- **FR-6**: Adding no new dependency. Source: clarified 2026-11-24

## 4. Product rules and edge cases

- **API down or asleep:** unchanged; Lighthouse is measured with the API unreachable (Non-Negotiable 1).
- **Privacy:** no new data; the README describes the existing rules.
- **Abuse:** unchanged.
- A missing tag in `index.html` fails the build instead of shipping an unchanged preview.

## 5. Interface decisions

**UI**: the contact form loads lazily behind a fixed-height placeholder; a favicon is added; routes and titles are unchanged.

**Content**: README text is Tier A site description; prerendered tags reuse the current placeholder titles and descriptions.

## 6. Open questions

None; all answered by default, pre-approved by the owner (blanket approval, 2026-11-24).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | README has no screenshots yet and a live-URL placeholder | Copy is placeholder until PF-012; pre-approved by the owner (blanket approval, 2026-11-24) |
| D2 | 2026-11-24 | Lighthouse 13.5.0 with Playwright's Chromium, against `vite preview` with the API refused | A version over a week old; reproducible and independent of the backend; pre-approved by the owner (blanket approval, 2026-11-24) |
| D3 | 2026-11-24 | Prerender the head only, at build time, no SSR (PF-003 D7 revisited) | Link previews read only the head; recommended default, pre-approved by the owner (blanket approval, 2026-11-24) |
| D4 | 2026-11-24 | A Vite SSR build of `routeMeta.ts` plus a small Node script, no new dependency | Under 30 lines and shares the content modules; pre-approved by the owner (blanket approval, 2026-11-24) |
| D5 | 2026-11-24 | Firefox and WebKit through an env switch in `playwright.config.ts`, CI untouched | The workflow belongs to an open owner pull request; pre-approved by the owner (blanket approval, 2026-11-24) |
| D6 | 2026-11-24 | Firefox could not launch here, so it is recorded as an environment limit and left as an owner step | Playwright Firefox 159 exits with "Could not find profile folder" even with a hand-made profile |

## 8. Acceptance criteria (refined)

- **AC-1**: The README renders the diagram and three badges and passes the public text rules.
- **AC-2**: Every Lighthouse category is at least 90 on both pages and both form factors, or the exception is recorded in the plan.
- **AC-3**: The smoke suite passes in Chromium and WebKit; the Firefox result is recorded.
- **AC-4**: After `pnpm build`, each `dist/work/<slug>/index.html` has its own title and `og:title`, and `/work/<unknown>` shows the 404 page.
- **AC-5**: All frontend gates pass.
