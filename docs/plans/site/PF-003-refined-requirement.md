# PF-003 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-003 — Static site: design tokens and layout, sections rendered from src/content/, /work/<slug> case-study routes, per-route meta, accessibility, and the API status panel · **Plan**: [PF-003-static-site.md](PF-003-static-site.md) · **Master plan section**: `../portfolio-implementation-plan.md` §6.1 and §7 Phase 2; `../cv-portfolio-content-plan.md` §6 and §7.1 · **Status**: **Confirmed** · **Last updated**: 2026-11-23 (D9: light by default)

## 1. Problem and goal

A recruiter scanning the site must pass the 10-second test (product guide §2): see who Will Ly is, what stack he uses, three proof points, and two actions (Download CV and Contact) without scrolling on a laptop. A hiring manager reading the site must reach a case study in one click. PF-003 builds the static site that does this, in the owner-approved visual design, rendering all copy from typed files in `frontend/src/content/` so the site never depends on the backend (Non-Negotiable 1).

## 2. Scope

**In scope**

- Design system from the owner-approved design mockup (kept machine-local): the light palette used by default whatever the system colour scheme (no theme toggle, D8, D9); two typefaces, Bricolage Grotesque for headings and UI and Source Serif 4 for reading text, both self-hosted so there is no Google Fonts request at runtime; status colours (green, amber, grey) used only for live status.
- Layout: a sticky header with the wordmark, anchor navigation (Work, How I work, Skills, Experience, Contact), a Download CV button, and a mobile menu; on desktop each home section has its heading in a sticky left rail.
- Hero: name, title, a one-line pitch, stack chips, three proof points that each link to the case study backing them, and the actions View work, Download CV, and Contact; all visible without scrolling at 1366×768.
- Live system panel in the hero ("This page is a live full-stack app"): four rows (your browser, React frontend, Spring Boot API, PostgreSQL) where the API and database rows show live status from the health check, plus a one-line note; one short load animation that respects reduced motion.
- api-status feature, moved from PF-005 into PF-003 (decision D3): one health check per page load feeding both the hero panel and a footer status dot.
- Home sections: About (prose plus a short facts list); Featured work (rows grouped "At Xolv" with five case studies, then "My own projects" with this site and Smart Pole, in the order of content plan §6.4: ai-assessment-integration, scheduling-platform, legacy-app-web-port, postgres-rls-multi-tenancy, client-intake-platform, this-site, smart-pole; each row shows title, role, one-line problem, one outcome, three tech chips, and a link to its case study); How I work (six principles, each with one example); Skills (grouped; each skill is a toggle that lists the case studies that used it as links and highlights the matching Featured work rows; toggling again or choosing another skill clears it); Experience (a timeline of three roles); Education and awards; Contact (LinkedIn and GitHub links only in PF-003); Footer (API status dot, View source link, one-line privacy note).
- Case-study route `/work/:slug` for the seven slugs above, following content plan §6.3: an "At a glance" aside (role, period, team context, stack chips, up to three outcomes, links), then Context, The problem, My role and scope, What I built, Deep dive, Outcome, What I learned, Tech used, and a link to the next case study. An unknown slug renders the existing 404 page.
- Per-route `<title>` and meta description; `index.html` keeps a default title, description, and Open Graph title and description tags.
- `vercel.json` SPA rewrite so `/work/:slug` survives a hard refresh (config only; no deploy).
- Accessibility: semantic headings in page order, visible focus, WCAG AA contrast in both schemes, reduced motion respected, every interactive element with an accessible name and a `data-test-id`; the site works at 390 px wide with no horizontal scroll.

**Out of scope (deferred)**

- The contact form: PF-006 builds it.
- The visit beacon and the visit counter: PF-005 keeps visits and stats.
- The Open source section: PF-007 builds it.
- Real copy: PF-012 swaps the placeholders for owner-reviewed text from the content pack (D6).
- The first Vercel deploy, `@vercel/analytics`, `robots.txt` and `sitemap.xml` with absolute URLs, `og-image.png`, and the public `cv.pdf`: PF-012 takes them together with the reviewed copy (D6).
- Prerendering routes for link previews: not in PF-003; link previews show the site's default title until it is revisited at launch (PF-009, D7).
- A theme toggle: not built; the site uses the light scheme only (D8, D9), and a toggle for the approved dark palette is not built.

## 3. Functional requirements

- **FR-1**: The home page renders every section from `src/content/` with the backend stopped, and no request blocks rendering. Source: SITE-001, backlog
- **FR-2**: The hero shows the name, title, one-line pitch, stack chips, three proof points, and the actions View work, Download CV, and Contact above the fold at 1366×768. Source: product guide §2, content plan §7.1
- **FR-3**: Each proof point links to the case study that backs it, at `/work/<slug>`. Source: product guide §2, clarified 2026-11-23
- **FR-4**: Featured work lists the seven case studies in content plan §6.4 order, grouped "At Xolv" (five) and "My own projects" (two); each row shows title, role, one-line problem, one outcome, three tech chips, and a link to `/work/<slug>`. Source: content plan §6.4
- **FR-5**: `/work/:slug` renders for each of the seven slugs with an "At a glance" aside and the sections Context, The problem, My role and scope, What I built, Deep dive, Outcome, What I learned, Tech used, and a link to the next case study. Source: content plan §6.3
- **FR-6**: Each case-study route sets its own `<title>` ("{case-study title} | Will Ly") and meta description in the browser, with no prerendering; the home route sets "Will Ly - Full-stack Software Engineer". Source: backlog, clarified 2026-11-23, D7
- **FR-7**: An unknown slug under `/work/` renders the 404 page with the title "Page not found | Will Ly". Source: backlog, clarified 2026-11-23
- **FR-8**: Selecting a skill lists the case studies that used it as links and highlights the matching Featured work rows; selecting it again, or selecting another skill, clears the first selection. Source: content plan §7.1, clarified 2026-11-23
- **FR-9**: The health check runs once per page load against `GET /actuator/health` and feeds both the hero panel and the footer status dot. Source: backlog, clarified 2026-11-23
- **FR-10**: The panel and the footer dot show "checking" (grey) on load, "waking" (amber, with a cold-start note) when the check is still waiting after about 3 seconds, "online" (green) when the API answers, and "unreachable" (grey) when the check fails or gives up after about 75 seconds. Source: clarified 2026-11-23
- **FR-11**: The database row shows "connected" when the health body reports the database up and "unavailable" when it reports it down (the API answers 503 with a body in that case). Source: clarified 2026-11-23
- **FR-12**: The "online" note does not mention visit counting in PF-003. Source: clarified 2026-11-23
- **FR-13**: The site uses the light palette whatever the system colour scheme, with no toggle, and nothing about the scheme is stored in the browser. Source: clarified 2026-11-23, D8, D9
- **FR-14**: The sticky header holds the wordmark, anchor navigation, and the Download CV button; below the desktop breakpoint a mobile menu opens and closes by keyboard and pointer. Source: backlog, clarified 2026-11-23
- **FR-15**: Download CV links to `/cv.pdf`; the file itself arrives in PF-012. Source: clarified 2026-11-23, D6
- **FR-16**: The site works at 390 px wide with no horizontal scroll; headings are in page order; focus is visible; contrast meets WCAG AA in both schemes; every interactive element has an accessible name and a `data-test-id`. Source: backlog, product guide §3
- **FR-17**: The panel animation runs once and does not run when the visitor prefers reduced motion. Source: clarified 2026-11-23
- **FR-18**: Fonts are served from the site's own origin; no request goes to Google Fonts. Source: clarified 2026-11-23
- **FR-19**: `vercel.json` rewrites unknown paths to `index.html` so a hard refresh on `/work/<slug>` loads the app. Source: backlog
- **FR-20**: `index.html` carries a default title, description, and Open Graph title and description tags. Source: backlog
- **FR-21**: `pnpm build` produces a site that works with no backend. Source: SITE-001, clarified 2026-11-23
- **FR-22**: Every portfolio text block is a placeholder in the form "TODO: {block} (content pack C)" with realistic length, except the name, title, GitHub URL, and the seven slugs. Source: content plan §7.1, clarified 2026-11-23

## 4. Product rules and edge cases

- **SITE-001**: content never waits for the API. The health check starts after first render and never gates any section.
- The check runs once per page load and never retries in a loop. Waking starts at about 3 seconds; the check gives up at about 75 seconds. The free-tier API sleeps after 15 minutes idle and can take up to about a minute to wake.
- The "unreachable" note says everything on the page still works.
- Copy: every portfolio text block is a clearly marked placeholder in the format "TODO: {block} (content pack C)" with realistic length. Section headings, navigation labels, button labels, and status texts are UI strings, not portfolio copy. No Tier B or Tier C content.
- Download CV links to `/cv.pdf`, the public variant of the master CV without the phone number. PF-012 adds the file (D6).
- **API down or asleep:** every section still renders. Only the panel's API and database rows and the footer dot change.
- **Privacy:** PF-003 sends no visitor data. The health check carries no visitor information. No cookies are set.
- **Abuse:** none in PF-003, because it adds no write endpoints.

## 5. Interface decisions

**API**: `GET /actuator/health` only. It exists since PF-002 and sits outside the OpenAPI contract. No new endpoints and no backend changes. A 503 with a body means the API is up and the database is down.

**UI**: As in scope. Page titles: home "Will Ly - Full-stack Software Engineer"; case study "{case-study title} | Will Ly"; 404 "Page not found | Will Ly". Meta descriptions come from content (placeholders for now). Loading, fallback, and error states for the API rows are the four status states in section 4.

**Content**: Each block below is a placeholder now. Tier A means reviewed copy comes later from the master CV; Tier B items stay placeholders until the owner approves each one.

| Block | Now | Later source |
|---|---|---|
| Name "Will Ly", title "Full-stack Software Engineer", GitHub URL, seven slugs | Real | Tier A |
| Hero pitch, stack chips, proof points | Placeholder | Tier A |
| About prose and facts list | Placeholder | Tier A |
| Featured work rows (problem, outcome, chips) | Placeholder | Tier A; Tier B items need owner approval |
| Case-study sections (seven studies) | Placeholder | Tier A; Tier B items need owner approval |
| How I work (six principles and examples) | Placeholder | Tier A |
| Skills groups | Placeholder | Tier A |
| Experience timeline (three roles) | Placeholder | Tier A |
| Education and awards | Placeholder | Tier A |
| Footer privacy note, per-route meta descriptions | Placeholder | Tier A |

## 6. Open questions

None; all resolved (see D6–D8).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | The owner approved the visual design of the HTML mockup (kept machine-local); PF-003 implements its palette, typefaces, layout, live system panel, and interactions. | Owner review before planning ("I love the styling"). |
| D2 | 2026-11-23 | Ship placeholders for all portfolio copy; reviewed copy arrives in a later content ticket. | The content pack does not exist yet, and only owner-reviewed text may enter `src/content/`. |
| D3 | 2026-11-23 | Move the api-status feature (health check, hero panel, footer status dot) from PF-005 into PF-003; PF-005 keeps visits, stats, and the counter. | The approved hero needs live status, and `/actuator/health` already exists. |
| D4 | 2026-11-23 | Defer the first Vercel deploy; PF-003 ends with a local production build that works with no backend. | A public `*.vercel.app` URL should not show placeholder copy. |
| D5 | 2026-11-23 | PF-011 (pull request #3) merges first, then the PF-003 branch fast-forwards to main. | PF-003 must follow PF-011's content rules. |
| D6 | 2026-11-23 | A new ticket, PF-012, takes the reviewed copy and the first deploy: it swaps the placeholders for the owner-reviewed content pack, adds the public `cv.pdf` (master CV without the phone), then does the first Vercel deploy with `@vercel/analytics`, `robots.txt`, `sitemap.xml` with absolute URLs, and `og-image.png`. In PF-003 the Download CV links point to `/cv.pdf` now. | Content and going live happen together; nothing public shows placeholders. |
| D7 | 2026-11-23 | No prerendering in PF-003. Each route sets its own title and meta description in the browser; link previews in LinkedIn or Slack show the default title until prerendering is revisited at launch (PF-009). | No build-step or dependency cost now. |
| D8 | 2026-11-23 | No theme toggle. Light or dark follows the visitor's system colour scheme only; nothing is stored in the browser. | Simpler; the mockup's switch was a review tool. |
| D9 | 2026-11-23 | Light is the default and only active colour scheme, whatever the system setting; the approved dark palette stays in the plan for a possible toggle. This replaces the system-following part of D8. | The owner asked for the light theme as the default after the build. |

## 8. Acceptance criteria (refined)

- **AC-1**: With the backend stopped, the home page shows every section and nothing waits on a request.
- **AC-2**: At 1366×768 the name, title, pitch, stack chips, three proof points, and the View work, Download CV, and Contact actions are visible without scrolling.
- **AC-3**: Every proof point and every Featured work row reaches its case study in one click.
- **AC-4**: Each of the seven `/work/<slug>` routes shows its sections and sets its own title and meta description, and a hard refresh on each still loads the page in the production build setup.
- **AC-5**: An unknown `/work/` slug shows the 404 page.
- **AC-6**: The panel and the footer dot move through checking, waking, online, and unreachable as described in section 4, and the database row shows connected or unavailable to match the health body.
- **AC-7**: Selecting a skill lists the right case studies and highlights the right Featured work rows; selecting it again or choosing another skill clears the first.
- **AC-8**: The site shows the light palette even when the system is set to dark, with WCAG AA contrast and visible focus.
- **AC-9**: With reduced motion on, the panel animation does not run.
- **AC-10**: At 390 px wide there is no horizontal scroll, and the mobile menu opens and closes.
- **AC-11**: `pnpm build` passes, and the built site works with no backend.
- **AC-12**: All portfolio copy is placeholder except the name, title, GitHub URL, and the seven slugs; no request goes to Google Fonts.
