# PF-014 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-014 — Content API: case studies and skills served by the backend · **Plan**: [PF-014-content-api.md](PF-014-content-api.md) · **Master plan section**: `../portfolio-implementation-plan.md` (architecture sections) and `../cv-portfolio-content-plan.md` (content split) · **Status**: Refining · **Last updated**: 2026-11-24 · **Branch**: `feature/PF-014-content-api`

## 1. Problem and goal

The owner asked to make the backend a real part of the design. Today the frontend shows everything and the backend is close to a dummy component. Every word of portfolio copy is TypeScript in `frontend/src/content/` (profile, About, experience, education, skills with skill-to-case-study links, Featured work groups and order, How I work, seven case studies), and the frontend prerenders one HTML file per case-study route from these files at build time for titles and link previews (PF-009). The backend records visits, serves a two-number stats summary for the footer, runs the contact outbox with retries, reports health for the hero system panel, and serves `GET /api/v1/projects`, which no page has called since PF-012. `?ref=` tags are stored in `page_view.ref_tag` but are readable only through SQL in the Neon console, case-study views are stored in `page_view.path` but never aggregated, and there is no authentication anywhere. The goal is to move the case studies, Featured work, and skill groups behind a Content API, as the foundation for later features that need case-study rows in the database. The audience is the owner (a backend that carries real design weight) and the hiring manager reading the code. The visitor sees no difference. The constraints are Non-Negotiable 1 (the site never depends on the backend to show content; Render Free sleeps and can take about a minute to wake) and SITE-001.

## 2. Scope

**In scope**

- A Content API serving the Featured work groups (heading, subheading) and their order, each of the seven case studies by slug with every field the case-study page and its Featured work row show today (including links and the optional deep-dive and lesson fields), and the skill groups with their skills and each skill's links to case studies.
- Backend-owned content stored in the database and authored as Flyway migration files in git, seeded with today's reviewed text verbatim.
- A generated content snapshot in the frontend build, rendered at once, replaced by the live API version when it answers.
- A CI check that fails when the committed snapshot differs from what the backend serves, following the existing OpenAPI snapshot check.
- A visitor-facing note in the hero system panel saying where the content came from (live API or built-in copy), and the API row caption "Serves content, visits, contact", with wording approved by the owner in the plan's content table.
- The owner-approved update to the This Portfolio case study sentence about the API.

**Out of scope (deferred)**

- PF-021 Reading insights: per-case-study read counts and a "most read" order computed from `page_view`. Needs the case-study rows from this ticket first.
- PF-016 Owner dashboard: login-protected `/admin` with the application ref-tag tracker, contact inbox with delivery status, and visits per day.
- PF-017 Tailored application links: the owner registers each `?ref` tag with company and role, and visitors from that link see a tailored hero line and highlighted case studies. Depends on PF-016.
- PF-018 Live build info: the hero system panel shows deployed commit, uptime, and database latency from a small system endpoint.
- PF-019 Remaining copy served by the backend: moves Profile, About, Experience, Education's degrees (the awards and certificates moved to PF-020), How I work, the section intros (`featuredWorkIntro`, `skillsIntro`), and the site notes to the backend later. Until then they stay in the frontend.
- PF-020 Award certificates in object storage: awards move to PostgreSQL behind the content API; the three certificate images move to a public Cloudflare R2 bucket; depends on PF-014.
- An in-app content editor or admin CMS: rejected, because it would bypass pull-request review and the Tier C scrub (Non-Negotiable 2).
- Any visible text change beyond the hero panel note and API row caption (D6) and the This Portfolio case study sentence (D7).

## 3. Functional requirements

- **FR-1**: The backend serves the Featured work groups in their current order through a public `GET` endpoint. Source: clarified 2026-11-24
- **FR-2**: The backend serves one case study by slug through a public `GET` endpoint, and answers an unknown slug with 404 and the `NOT_FOUND` error code. Source: clarified 2026-11-24
- **FR-3**: The backend serves the skill groups with their skill-to-case-study links through a public `GET` endpoint. Source: clarified 2026-11-24
- **FR-4**: Backend content lives in database tables created and seeded by Flyway migrations; the seed holds today's reviewed text verbatim, and held Tier B items (fields absent today) stay absent. Source: clarified 2026-11-24
- **FR-5**: The frontend build keeps a generated snapshot of the API's content, committed to the repository. Source: clarified 2026-11-24
- **FR-6**: Pages render the snapshot at once, then switch to the live API content when the API answers; no page waits for the API. Source: clarified 2026-11-24, Non-Negotiable 1
- **FR-7**: CI fails when the committed snapshot differs from what the backend serves, using the same pattern as the OpenAPI snapshot check. Source: clarified 2026-11-24
- **FR-8**: The build-time prerender of case-study routes keeps producing the same HTML files with the same titles and meta tags, and reads from the snapshot. Source: PF-009, clarified 2026-11-24
- **FR-9**: The hero system panel shows a note telling visitors where the content came from, without adding a row: "Content loaded live from the API." once the API's content has loaded, otherwise "Showing the built-in copy." Both wordings need owner approval in the plan's content table before shipping. Source: D6
- **FR-10**: The This Portfolio case study replaces the sentence "The API serves a visit counter and the contact form." with an owner-approved sentence that reflects the Content API (proposed: "The API serves the case studies and skills, a visit counter and the contact form."). The sentence ships only once approved. Source: D7
- **FR-11**: Content endpoints answer from memory after the first load, with no per-request database query on the hot path. Source: Non-Negotiable 8, clarified 2026-11-24
- **FR-12**: The API row caption in the hero system panel changes to "Serves content, visits, contact" (wording approved by the owner in the plan). Source: D6
- **FR-13**: The skills section's "used in" links and the case-study page's "next" link behave as today when fed from the snapshot or the live API. Source: D5

## 4. Product rules and edge cases

- SITE-001 and Non-Negotiable 1 hold unchanged: the snapshot is part of the frontend build, so content never depends on the backend.
- No copy changes as a side effect: any difference between the old TypeScript text and the served text is a defect, except the hero panel note and API row caption (FR-9, FR-12) and the one owner-approved sentence in FR-10. Apart from those, PF-014 changes no visible text.
- Content edits go through a pull request, the Tier C disclosure scrub, and a backend deploy (Non-Negotiable 2). There is no write endpoint for content.
- Backend and snapshot must agree: a content migration that changes the served output requires the regenerated snapshot in the same pull request, enforced by FR-7.
- **API down or asleep:** The visitor sees the snapshot content, identical to today, with no spinner blocking content and no error banner. The hero panel note reads "Showing the built-in copy." until the API's content has loaded (Non-Negotiable 1).
- **Privacy:** Content endpoints store and log nothing about the visitor beyond what the existing visit tracking already records; no cookies, no new identifiers (Non-Negotiable 3).
- **Abuse:** Public `GET` content endpoints need no rate limit, because Non-Negotiable 4 covers public writes. They must answer from memory cheaply on the free tier (Non-Negotiable 8), and an unknown slug returns problem JSON with `NOT_FOUND` and the `correlationId` (Non-Negotiable 5).
- A slug in the URL that is in the snapshot but missing from the API response keeps showing the snapshot version.

## 5. Interface decisions

**API**: Public, unauthenticated `GET` endpoints under `/api/v1`, for Featured work, case study by slug, and skill groups; exact paths and payload shapes are set in the plan and generated into the OpenAPI snapshot. Unknown slug returns 404 with `NOT_FOUND`. There are no write endpoints. The existing `GET /api/v1/projects` is untouched by this ticket.

**UI**: Pages render the committed snapshot first and swap to the live API content when it answers, with no loading state that hides content and no fallback banner. The hero system panel gets a note on where the content came from ("Content loaded live from the API." or "Showing the built-in copy."), with no new row so the hero still fits one screen (PF-012), and the API row caption becomes "Serves content, visits, contact"; exact wording is approved by the owner in the plan's content table before it ships. Page titles and meta descriptions are unchanged, and the prerendered case-study routes keep their current tags.

**Content**: The seven case studies (all fields, including links and optional deep-dive and lesson fields), the Featured work groups (heading, subheading) and order, and the skill groups with their skills and case-study links move to the backend seed, verbatim from the reviewed frontend text at the current disclosure tiers; Tier B items absent today stay absent. The Profile, About, Experience, Education, How I work, section intros (`featuredWorkIntro`, `skillsIntro`), and site notes stay in the frontend (PF-019). The only text changes are the hero panel note and API row caption (D6) and the replacement for "The API serves a visit counter and the contact form." in the This Portfolio case study (D7), all drafted in the plan's content table for owner approval.

## 6. Open questions

None open. Round 2 resolved the former questions: content scope (D5), visitor visibility (D6), the This Portfolio sentence (D7), and the branch (D8).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | PF-014 builds the Content API first. | The owner left the choice to best practice; foundation-first was chosen because the follow-up tickets (reading insights, owner dashboard, tailored application links) all need to reference case-study rows in the database. |
| D2 | 2026-11-24 | Follow-up tickets go on the backlog after PF-014: PF-021 Reading insights, PF-016 Owner dashboard, PF-017 Tailored application links (depends on PF-016), PF-018 Live build info. All are out of scope for PF-014. | They deliver the owner's goal of a backend with real design weight, and each is a separate small slice that builds on the content rows. |
| D3 | 2026-11-24 | The frontend build keeps a generated snapshot of the API's content; pages render it at once and switch to the live API version when it answers; CI fails when the committed snapshot drifts from what the backend serves. | Keeps Non-Negotiable 1, SITE-001, and the prerendered link previews unchanged, and reuses the existing OpenAPI snapshot check pattern. |
| D4 | 2026-11-24 | Backend-owned content is authored as Flyway migration files in git; every edit goes through a pull request and the Tier C scrub, then a backend deploy. No in-app content editor. | An admin CMS would bypass the pull-request review and the scrub (Non-Negotiable 2). |
| D5 | 2026-11-24 | Scope of PF-014 (source: owner, clarifying round 2): the seven case studies with every field the case-study page and its Featured work row show today (including links and the optional deep-dive and lesson fields), the Featured work groups (heading, subheading) and order, and the skill groups with their skills and each skill's case-study links. Profile, About, Experience, Education, How I work, the section intros (`featuredWorkIntro`, `skillsIntro`), and the site notes stay in the frontend. Follow-up PF-019 "Remaining copy served by the backend" moves them later. | Keeps the slice small while moving the content later tickets need as database rows. |
| D6 | 2026-11-24 | Visibility (source: owner, clarifying round 2): the hero system panel carries a note on where the content came from, with no new row. The API row caption becomes "Serves content, visits, contact", and the note adds "Content loaded live from the API." or "Showing the built-in copy." The owner approves the exact wording in the plan's content table before it ships. | Tells visitors the backend is real without breaking the one-screen hero (PF-012). |
| D7 | 2026-11-24 | Copy update (source: owner, clarifying round 2): the This Portfolio case study sentence saying the API serves only a visit counter and the contact form is updated in PF-014. The replacement is drafted in the plan's content table (proposed: "The API serves the case studies and skills, a visit counter and the contact form.") and ships only once the owner approves it. Apart from D6 and D7, PF-014 changes no visible text. | The old sentence becomes false once the API serves content. |
| D8 | 2026-11-24 | Branch (source: owner, clarifying round 2; process note only): the 9 uncommitted PF-012 cleanup edits in the working tree are shipped or discarded by the owner first; then `feature/PF-014-content-api` is created from `main`. Until then only new PF-014 files are written, and the backlog row is added when the branch is created. | Keeps PF-014 free of unrelated edits. |
| D9 | 2026-11-24 | Scope (source: owner request "also plan moving our certificates to another bucket service"; details defaulted to best practice, since the owner asked to continue without another question round): the award certificates and the awards list become their own ticket, PF-020 "Award certificates in object storage, awards served by the backend", planned right after PF-014 and building on its content API and snapshot. PF-019 no longer includes the awards or their certificates. | keeps PF-014 one sitting; the certificate move reuses PF-014's content API and snapshot |
| D10 | 2026-11-24 | Ticket renumbering (source: process note): the ticket ID PF-015 is already claimed by another branch (`feature/PF-015-responsive-polish`), so the follow-up "Reading insights" is renumbered from PF-015 to PF-021. All other ticket numbers stay as they are. | avoids an ID collision with an existing branch; the smallest renumbering |

## 8. Acceptance criteria (refined)

- **AC-1**: With the backend running, the Featured work endpoint returns the groups in today's order, each case study endpoint returns its study by slug, and the skills endpoint returns the skill groups with their case-study links.
- **AC-2**: Requesting an unknown case-study slug returns 404 with the `NOT_FOUND` code and a `correlationId` in problem JSON.
- **AC-3**: With the API asleep, down, or slow, every page renders the committed snapshot with the same text and layout as today, and no content waits for the API.
- **AC-4**: When the API answers, the page shows the API's content in place of the snapshot.
- **AC-5**: CI fails when the committed snapshot differs from the backend's output, and passes when they match.
- **AC-6**: The prerendered case-study routes are still produced, and their titles and meta tags are unchanged.
- **AC-7**: Apart from the hero panel note, the API row caption, and the This Portfolio sentence (all as approved by the owner), no visible text differs from today, and held Tier B fields remain absent.
- **AC-8**: The hero system panel note shows "Content loaded live from the API." only after the API's content has loaded, and "Showing the built-in copy." otherwise (as approved), and the hero still fits one screen.
- **AC-9**: Content endpoints serve repeat requests from memory without a database query, and no content endpoint accepts a write.
- **AC-10**: The API row caption in the hero system panel reads "Serves content, visits, contact", as approved by the owner.
- **AC-11**: The This Portfolio case study sentence about the API reads as the owner approved it, in the snapshot, the API, and the prerendered page.
- **AC-12**: The skills section's "used in" links and the case-study page's "next" link behave as today, from both the snapshot and the live API.
- **AC-13**: Every case-study field shown today, including links and the optional deep-dive and lesson fields, is present in the served content, and the Featured work groups show their heading and subheading in today's order.
