# PF-012 — Content swap (in-repo part)

**Ticket**: PF-012 · **Packages**: frontend · **Status**: Approved 2026-11-24 (owner decisions in session) · **Last updated**: 2026-11-24

> No complex flows.

## 1. Requirement summary
Replace every placeholder in `frontend/src/content/` with the owner-reviewed content pack, and add a content test that fails on any leftover `TODO:` or `#todo-` target. Maps to `../cv-portfolio-content-plan.md` §7 Phase C and the PF-012 row of the backlog. The scope is the content swap and the test only: the public `cv.pdf`, `robots.txt`, `sitemap.xml`, `og-image.png`, `@vercel/analytics`, and every deploy step stay with the owner under PF-012.

## 4. Approach
Each reviewed block is pasted into its content file as typed data, one file per section and one per case study. Only text the owner approved ships: blocks that go beyond the master CV stay out of the repository until the owner approves each one (held), and the table below lists them by name only. Because held text leaves some sections empty, the content types allow it: a case study's `deepDive` and `learned` are optional and the page skips a section that is absent, and a principle's `body` and `example` are optional. A skill with no case study renders as a plain label instead of a button. `placeholder.ts` is deleted.

| Alternative | Why not |
|---|---|
| Write new text to fill the held blocks | Nothing is invented: every claim traces to the master CV or an approved item. |
| Keep a `todo()` helper for the held blocks | The content test must fail on any `TODO:`, and a placeholder would publish. |
| Show unlinked skills as disabled buttons | A control that does nothing misleads; a plain label is honest. |

**Reuse**: the existing content types, `Section`, and `CaseStudyArticle`. **Single responsibility**: `content.test.ts` serializes every content export and fails on a placeholder marker.

Checked against the code before shipping: the privacy note matches what the backend stores (a keyed hash of IP address and user agent, the referrer host only, no cookie, no raw IP); skill links to this site follow `frontend/package.json` and `backend/build.gradle.kts`; the Open source section has no intro field, so no intro ships.

## 8. Files, order, risks, tests
**Modified**: every file in `frontend/src/content/` and `frontend/src/content/caseStudies/`, `src/content/caseStudies/types.ts`, `src/sections/HowIWork.tsx`, `src/sections/Skills.tsx`, `src/pages/CaseStudyArticle.tsx`, and their tests. **Deleted**: `src/content/placeholder.ts`.

| Risk | Mitigation |
|---|---|
| A held block reaches the public repository | Only unmarked text was pasted; the disclosure scrub and the review check the diff. |
| A claim drifts from the master CV | The owner's CV-backed decisions were applied as given; anything uncertain was dropped or reduced to the CV wording. |
| An empty section looks broken | The page skips an absent section and its heading; a render test covers it. |

**Tests**: `content.test.ts` keeps the shape tests and adds the placeholder test; `CaseStudyPage.test.tsx` covers a study without a deep dive or lessons; `HomePage.test.tsx` covers a skill without a link.

## Owner review, round 2 (2026-11-24)

After the first swap went live, the owner asked for these changes; each was applied as given.

| Change | What shipped |
|---|---|
| Hero pitch | A generic 19-word pitch in the owner's direction, opening with "Product-minded software engineer", with the keywords end-to-end ownership of features, backend and frontend, and Agile |
| Third proof point | The coverage claim is replaced by the owner's fact: two legacy apps (TPMA in Angular, DCA on iPad) ported to React, first build in UAT in ~4 weeks. The web-port card's outcome line now leads with the same UAT fact, already in the case study |
| Name shown twice | The header brand reads "Portfolio" (its accessible name keeps the name); the hero keeps the name |
| Portrait | The owner's photo, cropped to head and shoulders, 480 px WebP without metadata, in `src/assets/portrait.webp`, beside the name |
| Hero fits one screen | Tighter hero spacing, a 144 px portrait, a wider pitch (three lines), and every proof point on two lines, so the whole hero fits a 1440 × 800 window |
| Section order | Experience moves right after About; the header links follow the page order and start with About |
| Skill selection | Selecting a skill still lists its case studies under the skill group, but no longer tints the matching Featured work rows; the selection state moves into `Skills` |
| Open source | The section, the `projects` feature, and `fallbackRepos` are removed; SITE-005 is retired. The backend endpoint stays until the owner decides; this site's case study drops its GitHub-list sentence |
| Contact | The heading leads the left column with the note and the two profile links (each with its address); the form sits in a raised card on the right |

## Content table

| Block | Source | Tier | Status |
|---|---|---|---|
| Hero: where line, stack, two proof points, LinkedIn link | Content pack, hero | A | Shipped |
| Hero: pitch and third proof point | Owner, review round 2 (2026-11-24) | A (owner-supplied) | Shipped |
| Hero: portrait | Owner's photo, review round 2 | Owner-approved | Shipped |
| About: introduction, AI sentence, Master's, three facts | Content pack, about | A | Shipped |
| About growth story | Content pack, about | B (pending) | Held |
| About: next-role sentence | Content pack, about | B (pending) | Dropped |
| Featured work intro, two groups, seven cards | Content pack, featured work | A | Shipped |
| How I work: intro, principles 2 to 6 | Content pack, how I work | A | Shipped |
| How I work: principle 1 ("Plan before code"), body and example | Content pack, how I work | B (pending) | Held; the principle is left out (five habits shown) until approved, so no empty heading renders |
| How I work: AI principle example | Content pack, how I work | A | Dropped: it repeated the coverage-gate example of "Test as part of the feature"; the exact D4 body ships |
| Skills: six groups with links | Content pack, skills | A | Shipped |
| Experience: three roles | Content pack, experience | A | Shipped |
| Education: two degrees, three awards | Content pack, education | A | Shipped |
| Award descriptions | Content pack, education | B (pending) | Held |
| Site copy: home description, contact note, privacy note | Content pack, site copy | A | Shipped (privacy note checked against the backend) |
| Open source intro | Content pack, site copy | A | Dropped (no field for it) |
| Fallback repository descriptions (six) | Content pack, open source | A | Removed with the section (round 2) |
| Frontera: case study | Content pack, case studies | A | Shipped |
| Frontera deep-dive story, diagram, defect-simulation outcome, testing lesson | Content pack, case studies | B (pending) | Held |
| Clockwork: case study | Content pack, case studies | A | Shipped |
| Clockwork deep dive and first lesson | Content pack, case studies | B (pending) | Held |
| TPMA/DCA web port: case study | Content pack, case studies | A | Shipped |
| TPMA/DCA deep-dive story, autosave rules, lesson, role-split sentences | Content pack, case studies | B (pending) | Held |
| TPMA multi-tenancy: case study | Content pack, case studies | A | Shipped |
| TPMA multi-tenancy deep-dive story, diagram, isolation-testing statement, first lesson | Content pack, case studies | B (pending) | Held |
| TPMA multi-tenancy: startup-job lesson (cause not confirmed) | Content pack, case studies | Unconfirmed | Dropped until confirmed |
| FAST: case study | Content pack, case studies | A | Shipped |
| FAST deep-dive story | Content pack, case studies | B (pending) | Held |
| Smart Pole: case study | Content pack, case studies | A | Shipped |
| Smart Pole: deep-dive alternatives paragraph and lesson (drafted wording, not sourced) | Content pack, case studies | Unconfirmed | Dropped until confirmed |
| This site: case study | Content pack, case studies | A | Shipped |
