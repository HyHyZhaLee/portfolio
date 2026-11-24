# PF-015 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-015 — Responsive polish for every device · **Plan**: [PF-015-responsive-polish.md](PF-015-responsive-polish.md) · **Master plan section**: `../portfolio-implementation-plan.md` §6 and §7 Phase 2 and Phase 8 · **Status**: Confirmed · **Last updated**: 2026-11-25

## 1. Problem and goal

The owner asked for a beautiful, responsive UI on all types of devices. Recruiters and hiring managers open the site on phones, tablets, laptops, and large monitors, often on a phone first. A responsive audit on 2026-11-24 (Playwright, local dev build) found no horizontal overflow from 320 to 2560px, which must stay true, but it found layout gaps on phones, landscape phones, tablets, 1024px screens, and wide screens. The goal is to fix every gap and add a small motion layer inside the design the owner approved in PF-003, without changing colours, fonts, or content.

Audit gaps:

- **Phones 320–414px**: the "Menu" button is text only, pushes the page down instead of overlaying it, and does not close on Escape or an outside tap. The large portrait stacks above the name, so proof points and View work fall below the fold. The home page is 11,551px tall at 414×896 (about 17 screens). Skill buttons are 34px tall, under the 44px touch guideline. On a case study, the "At a glance" card sits above the article and pushes it a full screen down.
- **Landscape phones (844×390)**: the 64px sticky header takes 16% of the height.
- **Tablet 768px**: the live-system panel stacks under the hero at full width and looks empty.
- **1024px** (iPad landscape, iPad Pro portrait, small laptops): the 15rem heading rail squeezes the content, About becomes three narrow columns, the system panel title wraps awkwardly, and the note leaves a single word on its last line.
- **1920 and 2560px**: the content stays a 1184px column with unchanged type, so it looks like a small island.
- **1366×768**: the hero fits above the fold (a PF-003 requirement that must not regress).

## 2. Scope

**In scope**

- Every route: home `/`, case studies `/work/:slug`, the 404 page, and the route error page.
- Portrait phones 320–430px, landscape phones (height ≤ 480px), tablets 768px, 1024px screens, laptops 1280–1440px, desktops 1920px, and wide screens 2560px.
- Frontend only.

**Out of scope (deferred)**

- Dark mode: light scheme only (D2); it can be its own ticket.
- Copy or content changes and new sections: content is owner-reviewed in PF-012 (Non-Negotiable 2).
- A colour, font, or visual refresh: the design was approved in PF-003 (D1).
- Backend changes: none needed.
- A print stylesheet: not requested.
- Hiding content on phones: phones are tightened without removing content (D4).

## 3. Functional requirements

- **FR-1**: No horizontal scrolling on any route at any width from 320px to 2560px: the page itself has no horizontal scroll, and the architecture figure's own sideways scroll region on case studies is allowed (PF-022 P8, D11). Source: clarified 2026-11-24
- **FR-2**: Below the width where the inline header navigation appears, the menu is an icon button with an accessible name and expanded state that opens an overlay menu covering the page, not pushing it down. It closes on Escape, a tap outside, choosing a link, or a close control. Focus moves into the menu on open and back to the button on close, and the page behind does not scroll while it is open. Source: clarified 2026-11-24
- **FR-3**: On phones the portrait sits beside the name, so the pitch, proof points, and View work action appear sooner. At 390×844 the pitch, the three proof points, and View work are visible without scrolling; at 1366×768 the whole hero still fits above the fold (PF-003). Source: clarified 2026-11-24
- **FR-4**: Phone layouts are tightened (D4) with no content removed or hidden by default, except the At a glance extras behind their toggle. Target: the home page at 414×896 is at least 8% shorter than today and at most 10,600px tall (11,551px today), checked at build time and judged in the owner's screenshot review, not asserted in an automated test. Source: clarified 2026-11-24
- **FR-5**: On a case study, wherever At a glance is not beside the article, it shows role, period, and team, with stack, outcomes, and links behind a toggle that announces its expanded state. Where it is beside the article, everything shows with no toggle. Source: clarified 2026-11-24
- **FR-6**: On touch devices (coarse pointer), every standalone interactive control (menu button, menu links, skill buttons, back link, certificate buttons, form controls, contact link cards, buttons) has a hit area of at least 44×44 CSS px; the visual size may stay smaller (skill chips keep their compact 34px look, with an invisible hit area extended around them and no overlap between neighbours); links inside running text are exempt. Source: clarified 2026-11-24
- **FR-7**: On tablets (from 768px up to the width where the hero becomes two columns), the live-system panel uses the width well instead of a mostly empty full-width card. At no width does the panel title, a status, or the note leave a single word stranded on its own line. Source: clarified 2026-11-24
- **FR-8**: At 1024px the About text reaches its full 62ch measure (as on desktop), and the Featured work rows and the case-study article are no narrower than 36rem (D13). Source: clarified 2026-11-24
- **FR-9**: On landscape phones (viewport height ≤ 480px) the sticky header is at most 48px tall. Source: clarified 2026-11-24
- **FR-10**: From about 1600px wide the layout scales proportionally up to 125% at 2560px (D3), relative to the visitor's browser font size; at 1440px and below nothing changes size. Source: clarified 2026-11-24
- **FR-11**: Motion (D1): the mobile menu opens and closes with a short transition (≤ 250ms); home sections fade in once as they scroll into view; on desktop the header link of the section in view is highlighted and marked as the current location for assistive technology. All motion is off under prefers-reduced-motion. The fade-in is CSS only (no script or scroll observer decides visibility); it has no effect in browsers without CSS scroll-driven animations, under prefers-reduced-motion, or in print, where every section is simply fully visible; a section reached by a deep link or a header link (for example /#skills) is fully opaque once it sits under the header. Source: clarified 2026-11-24
- **FR-12**: What exists keeps working: the API-status states and fallbacks, the contact form states, keyboard and screen-reader flows, the existing test IDs, per-route titles and meta descriptions, and Lighthouse ≥ 90 in all four categories (PF-009; implementation plan §1). Source: clarified 2026-11-24

## 4. Product rules and edge cases

- **SITE-001**: content never waits for the API. Unchanged; motion must not hide content either.
- **API down or asleep:** unchanged. The system panel keeps its checking, waking, online, and unreachable states in every layout, with reserved space so status changes never shift the layout.
- **Privacy:** unchanged. Nothing new is stored or sent, and there are no new cookies or storage; the menu and toggles keep state in memory only.
- **Abuse:** not applicable, because there are no new endpoints or forms.
- **Zoom and font size:** the visitor's browser zoom or larger default font must still work, because scaling is relative to it.
- **Resize or rotate with the menu open:** the menu closes or stays correct when the inline nav appears.
- **Deep link `/#skills`:** it lands below the sticky header and the section is visible; the fade-in must not leave it transparent.
- **Reduced motion:** with `prefers-reduced-motion` nothing animates.

## 5. Interface decisions

**API**: none.

**UI**: as in FR-2 to FR-11. No copy changes, except new UI strings that the new controls need (menu open and close labels, the At a glance toggle label), which go in `src/i18n/en.ts`; these are UI strings, not portfolio content. Page titles and meta descriptions are unchanged.

**Content**: no new public content blocks; disclosure tiers are unaffected.

## 6. Open questions

All resolved on 2026-11-24: every question stays answered with its default, and the owner's approval confirms the breakpoint proposal (D8, D10).

- Resolved: where exactly the hero and the section heading rail go side by side. Proposed in the plan and confirmed by the approval (see D8).
- Resolved: scroll fade-in in browsers without CSS scroll-driven animations (Firefox today). Default: no animation there, so content is simply visible, rather than adding JavaScript.
- Resolved: hide-on-scroll header. Default: no; a compact header on short viewports instead (FR-9).
- Resolved: menu presentation. Default: a panel that drops from the header over a dimmed page.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | Scope is "polish + subtle motion" inside the approved design: fix every audit gap and add a small motion layer (an animated mobile menu, a gentle one-time fade-in of home sections as they scroll into view, and the header link of the section being read highlighted). No change to colours, fonts, or visual language; not a visual refresh. | The design was approved on 2026-11-23; the gaps are layout, not style. |
| D2 | 2026-11-24 | Light scheme only; PF-003 D9 stays (no dark mode, no toggle). | Dark mode would add about a third to the ticket; it can be its own ticket. |
| D3 | 2026-11-24 | Wide screens scale proportionally: from about 1600px wide the whole layout (type, spacing, max width) grows smoothly, reaching 125% at 2560px and staying there beyond; the visitor's browser font-size setting still applies. | Same look, reads like a laptop at arm's length; one low-risk change. |
| D4 | 2026-11-24 | Phones are tightened without removing or hiding any content: less spacing between sections, the portrait beside the name so actions show sooner, more compact Featured work rows (problem line, outcome, and chips all stay), and the case study "At a glance" shows role, period, and team with the rest behind a toggle. | Shorter page, and phone visitors still see everything. |
| D5 | 2026-11-24 | No "without JavaScript" promise. The site is a client-rendered SPA: the PF-009 prerender writes only per-route head tags (title, description, Open Graph), not body content, so nothing renders without JavaScript today. The fade-in is CSS only and falls back to fully visible. | A promise the site cannot keep today would be false; CSS-only motion never hides content waiting for a script. |
| D6 | 2026-11-24 | Touch size is about the hit area, not the visual size: skill chips keep their compact 34px look with an invisible extended hit area and no overlap between neighbours. | 44px-tall chips would add about 200px to the phone page and look heavy; WCAG 2.5.8 is met either way and the 44px target is met by the hit area. |
| D7 | 2026-11-24 | Realistic phone-height target: the home page at 414×896 is at least 8% shorter than today and at most 10,600px (11,551px today), with no content removed; the owner's screenshot review is the final judge, and the height is checked at build time, not asserted in an automated test. | The estimated savings from the tightening levers are about 900–1,100px; a content edit would break a height test. |
| D8 | 2026-11-24 | Breakpoints (proposed in the plan; owner confirms at plan approval): the section heading rail and the About facts column move to 1280px and up, so at 1024–1279px headings sit above full-width content (meets FR-8). The hero stays two columns from 1024px, so the live-system panel stays above the fold on iPad landscape and 1024×768 laptops; its title, statuses, and note get wrap fixes for that width. From 768 to 1023px the panel becomes a horizontal four-step strip under the hero; below 768px it stays the vertical list. The case-study At a glance stays beside the article from 1024px (the article column is about 38rem there, meeting FR-8). | Keeps the signature panel visible where it is visible today while giving reading columns room. |
| D9 | 2026-11-24 | Ticket renumbered from PF-014 to PF-015. | PF-014 is held by another ticket in progress. |
| D10 | 2026-11-24 | F1, the active-section highlight in the header (FR-11, third part), is kept. The owner approved the plan as proposed on 2026-11-24 and asked us to proceed without further questions. | Owner approval. |
| D11 | 2026-11-24 | Rebased onto `main` at `99ce517` (PF-022 architecture diagrams, PF-023 live status, PF-025 icon). PF-022 added the architecture diagram as each case study's lead figure. Below 1024px its drawing keeps a minimum width and scrolls sideways inside its own frame, with a hint (PF-022 P8). PF-015 keeps that design. FR-1 counts horizontal scroll of the page, not scroll inside that figure's own region. The figure is checked at every width in the AC-1 matrix. New baselines: home page 11,529px at 414×896 and 13,150px at 320. The FR-4 target of 10,600px at 414×896 stays. | Keeps the PF-022 design and the FR-4 target. |
| D12 | 2026-11-25 | AC-13 is replaced. On 2026-11-25 the owner asked us to run plan, dev, review, PR, and merge without asking for any permission, which waives the pre-PR screenshot approval. In its place, an independent visual QA reviewed the viewport matrix in two rounds before the PR, and the owner reviews the merged site afterwards. | Owner instruction; the QA keeps an independent visual check before merge. |
| D13 | 2026-11-25 | At 1024px the About text reaches its full 62ch measure (569px, as on desktop); the 36rem floor applies to the work rows and the article. AC-8 checks that the About text is as wide at 1024px as at 1366px. | The approved 62ch reading measure is the same at every desktop width, so it, not 36rem, is the About limit. |
| D14 | 2026-11-25 | The compact header is a 48px row plus its 1px bottom border, so it measures 49px; AC-9 reads "the header row is 48px (49px with its bottom border)". | The border sits outside the 48px row; the intent is unchanged. |
| D15 | 2026-11-25 | AC-12 is met for accessibility, best practices, desktop, and tests and coverage, and is deferred for mobile performance (PF-026) and SEO (PF-012's robots.txt). Measured: mobile performance 85, desktop 100, accessibility 100, best practices 100, SEO 92. Both gaps existed on `main` at `99ce517` before this ticket (mobile performance 86, SEO 92); the 1-point drop is about 2.2 kB gzip of new menu and motion code. PF-026 (registered in the backlog) raises mobile performance to 90 or more by loading the architecture-diagram kit lazily; SEO 92 comes from the robots.txt still missing from PF-012. AC-12's text is unchanged. | Neither gap is caused by this ticket; each has an owner ticket. |
| D16 | 2026-11-25 | FR-4 and AC-4 measured: the home page is 10,593px tall at 414×896, down from 11,529px, which is 8.1% shorter and under the 10,600px cap. The plan's P7 records the extra phone spacing step needed to get there. | Confirms the target at build time. |

## 8. Acceptance criteria (refined)

- **AC-1**: An automated end-to-end check finds no horizontal overflow on `/` and one case study at 320, 375, 414, 768, 1024, 1366, 1920, and 2560px; the page has no horizontal scroll, and the architecture figure's own sideways scroll region on case studies is allowed (PF-022 P8).
- **AC-2**: At 375px the menu opens as an overlay; Escape closes it and returns focus to the button; choosing a link navigates and closes it.
- **AC-3**: At 390×844 the pitch, the three proof points, and View work are visible without scrolling; at 1366×768 the whole hero is.
- **AC-4**: At 414×896 the home page is at least 8% shorter than today and at most 10,600px tall (checked at build time, owner screenshot review is the final judge), and the content tests are unchanged (no content removed). Measured at build time: 10,593px, 8.1% shorter (D16).
- **AC-5**: On a case study at 375px, At a glance shows role, period, and team, and the toggle reveals stack, outcomes, and links; at 1366px everything shows with no toggle.
- **AC-6**: With a coarse pointer at 375px, the menu button, menu links, back link, certificate buttons, contact link cards, form controls, and buttons measure at least 44px tall, and a point 4px above and 4px below a skill button's visible edge still hits that button.
- **AC-7**: At 768 and 1024px the system panel shows no single stranded word in its title, statuses, or note (owner screenshot review).
- **AC-8**: The About text is as wide at 1024px as at 1366px (its approved 62ch measure, about 569px), and the Featured work rows and the case-study article are each at least 36rem wide at 1024px (D13).
- **AC-9**: At 844×390 the header row is 48px (49px with its bottom border) (D14).
- **AC-10**: The root size is 100% at 1440px and 125% at 2560px with a default browser font size.
- **AC-11**: With reduced motion no element animates; in a browser without CSS scroll-driven animations every section is fully opaque; after following /#skills the Skills heading and its first group are fully opaque.
- **AC-12**: Lighthouse ≥ 90 in all four categories, mobile and desktop, for `/` and one case study; all existing tests pass and branch coverage stays ≥ 80%. Result and deferrals: D15.
- **AC-13**: _Replaced (D12):_ the owner approves before/after screenshots at the viewport matrix before the pull request. In its place, an independent visual QA reviewed the viewport matrix in two rounds before the PR, and the owner reviews the merged site afterwards (D12).
