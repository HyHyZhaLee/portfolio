# PF-022 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-022 — Architecture diagrams on the case-study pages · **Plan**: [PF-022-architecture-diagrams.md](PF-022-architecture-diagrams.md) · **Master plan section**: `../cv-portfolio-content-plan.md` §4 (tiers), §6.3 (case-study template), §6.5 (diagrams) · **Status**: **Confirmed** · **Last updated**: 2026-11-24

## 1. Problem and goal

The seven case-study pages (`/work/<slug>`) are text only. A hiring manager reading one cannot see how the system fits together or which part Will built. Each case study gets one architecture diagram as a lead figure; the Frontera case study (`ai-assessment-integration`) shows its AWS event-driven architecture. The audience is the hiring manager's deep read, and a recruiter who opens a case study.

## 2. Scope

**In scope**

- Diagrams for the case studies, Frontera first. All seven are built in this ticket's branch: Frontera (D-1), This Portfolio (D-2), Smart Pole (D-3), Clockwork (D-4), TPMA/DCA web port (D-5), TPMA multi-tenancy (D-6) and FAST (D-7); the owner approved the four Xolv diagrams on 2026-11-24 (D12).
- A reusable diagram kit: inline SVG drawn from typed data.
- A step-through of the numbered flow.
- A legend: ★ my part, the ownership note, the arrow kinds, and the kill-switch marker.
- The numbered step list as the text alternative.
- Official AWS Architecture Icons for AWS services.
- Sideways scrolling inside the figure on small screens.

**Out of scope (deferred)**

- Diagram previews on the home page's Featured work rows: the owner chose the case-study lead figure only.
- Deep-dive diagrams, such as a sequence diagram of a race fix or the contact outbox: a later ticket.
- Flow animation: the owner chose step-through without animation.
- A dark theme: the site is light only.
- Serving diagrams through the PF-014 content API: diagrams stay frontend data keyed by slug.
- Any diagram editor: not needed for seven static diagrams.

## 3. Functional requirements

- **FR-1**: A case study with a published diagram shows it as a full-width lead figure directly under the page title and angle, above At a glance and the article. Source: clarified 2026-11-24
- **FR-2**: The figure has a heading, a one-line summary, the diagram, a legend, and a numbered step list. Source: clarified 2026-11-24
- **FR-3**: The diagram shows zones, nodes, directed edges, and numbered step badges. ★ marks the parts Will implemented; an ownership note says who owned the rest, worded from the published "My role and scope" text. In a diagram whose nodes carry ★, every step that runs through a ★ node or describes Will's work also carries ★, so the step list carries ownership too; Clockwork and FAST carry no ★ at all, on nodes or steps; their ownership notes describe the role instead (D14), and This Portfolio is solo and has no ★ (D13). Source: clarified 2026-11-24
- **FR-4**: Edges come in three kinds (main flow, return flow, failure path), told apart by colour and by line style, so colour is never the only cue. Source: clarified 2026-11-24
- **FR-5**: Step-through: hovering or focusing a step in the list highlights that step's edges and nodes and dims the rest; clicking or tapping a step pins it (pressed state) and clicking it again unpins it; moving away clears the highlight unless a step is pinned. Every step is reachable by keyboard. Source: clarified 2026-11-24
- **FR-6**: AWS services are drawn with the official AWS Architecture Icons, unmodified; every other node uses the site's own generic glyphs; no other vendor logos. Source: clarified 2026-11-24
- **FR-7**: The Frontera diagram shows the core round trip plus two extra layers the owner chose: failure handling (SQS redelivery to dead-letter queues only; there is no error queue and no processing-error path) and kill switches (a flag marker on the hops that can each be switched off on their own). It leaves out the Cognito badge and the status update back to the CRM; the security layer shows only the virus scan on the forwarded report (below). The core round trip, in generic terms: in the first zone, "Provider systems", a CRM (Salesforce) places a client and hands the work to the Provider portal; the Provider portal uploads the client's documents to S3 and publishes client and document events to an internal EventBridge bus; an enricher Lambda adds context and queues each event in SQS; the MyBrightLink backend (Spring Boot) pulls the queue and records each event once in a duplicate-safe history (PostgreSQL); it publishes to a partner EventBridge bus, where an input-enricher Lambda fans the events out to one SQS queue per event type; Frontera (the partner AI platform) picks them up, reads the client's documents from S3 as its input, drafts the report and stores the PDF in the same S3 bucket; the result returns through the partner bus and an output-enricher Lambda queues it for MyBrightLink; a clinician reviews the report in MyBrightLink's React screens, and it is forwarded to the Provider portal through a "Virus scan" node labelled "ClamAV", which carries ★ because the published case study's "What I built" lists virus scanning of incoming clinical PDFs; the forwarding itself is Will's part, so step 8 carries ★ too; the Provider portal's upload in step 2 is also Will's work, so step 2 carries ★ while the Provider portal node stays unmarked (D13). Source: clarified 2026-11-24
- **FR-8**: The other six diagrams (Clockwork, TPMA/DCA web port, TPMA multi-tenancy, FAST, Smart Pole, This Portfolio) are drawn only from published case-study text and the owner-reviewed drafts; each one's nodes, steps and ★ marks are specified in the plan's content section. This Portfolio and Smart Pole (Tier A) are built in this ticket. The owner approved the four Xolv diagrams (Clockwork, TPMA/DCA web port, TPMA multi-tenancy, FAST) on 2026-11-24, so all seven are built in this ticket's branch (D12, superseding the hold in D10). Source: clarified 2026-11-24
- **FR-9**: A case study without a published diagram renders exactly as it does today. Source: clarified 2026-11-24
- **FR-10**: On small screens the diagram keeps a legible minimum width and scrolls sideways inside its frame; the page itself never scrolls sideways; the step list stays below at full width. Source: clarified 2026-11-24
- **FR-11**: Accessibility: the figure has an accessible name, the drawing has a short text description, the step list is the full text alternative, graphical elements keep at least 3:1 contrast, and highlight transitions are off under reduced motion. Source: clarified 2026-11-24
- **FR-12**: Diagram labels hold no Tier C content: no customer or tenant names, internal system, resource, queue, bus or bucket names, feature-flag names, ticket IDs, hostnames or account IDs. Diagrams are drawn fresh with generic labels, never traced; the owner's internal architecture image never enters the repository. Source: content plan §4 and §6.5

## 4. Product rules and edge cases

- Xolv diagrams are Tier B ("generic architecture diagrams of Xolv systems", content plan §4) and ship item by item after owner approval (SITE-007). Smart Pole and This Portfolio are Will's own projects (Tier A).
- **API down or asleep:** unaffected. Diagrams are static data in the frontend, so the figure renders with the API unreachable (SITE-001, Non-Negotiable 1).
- **Privacy:** nothing new is collected, and step interactions are not tracked (Non-Negotiable 3).
- **Abuse:** no new endpoint, so nothing new to abuse.
- **PF-014 interplay:** diagrams are not part of the case-study catalog that PF-014 moves to the backend; they stay keyed by slug in the frontend. The This Portfolio diagram shows the architecture as merged; whichever of PF-014 and PF-022 lands second updates it.

## 5. Interface decisions

**API**: none. This ticket is frontend only.

**UI**: the lead figure is laid out as in FR-1. Proposed copy: heading "Architecture", legend entries "My part", "Main flow", "Return", "Failure path" and "Can be switched off on its own", the DLQ tag's legend text "Redelivered, then kept in a dead-letter queue", small-screen hint "Scroll sideways to see the whole diagram", and step list label "Step by step". There is no new route, so page titles and meta descriptions are unchanged.

**Content**: each diagram's labels, summary and step texts are public text. Frontera and the four other Xolv diagrams are Tier B: Frontera's topology and layers were approved by the owner on 2026-11-24, and the drawing gets the owner's sign-off on the built figure before the pull request; Clockwork, TPMA/DCA web port, TPMA multi-tenancy and FAST are Tier B, approved by the owner on 2026-11-24 (D12), and are built. Smart Pole and This Portfolio are Tier A and are built.

## 6. Open questions

None remain open. All were resolved on 2026-11-24 with their defaults when the owner approved the plan (D9):

- Partner event bus: one bus, used in both directions.
- Documents (S3): sits in the partner AWS zone; it holds both the client's documents and the report PDF (D11).
- Kill switches: on three hops, Provider portal to the internal event bus, the internal queue to the backend, and the backend to the partner event bus.
- Frontera ★ marks: as the plan's D-1 lists them (Enricher, Review screens, Backend, Event history, Input enricher, Output enricher), plus the Virus scan node; steps follow the ★ nodes, so the starred steps are 2, 3, 4, 5, 7 and 8 (step 2, the Provider portal's upload and event publishing, is Will's work while the Provider portal node stays unmarked; step 8 is the forwarding of the report to the Provider portal) (D11, D13).
- Smart Pole (D-3): the two edges as drawn by default (sensor nodes to uplinks for the RS485 frames; speed estimates to Firebase).

- TPMA/DCA (D-5) ★: on the REST API node, the plan's default, because the published "What I built" includes it; resolved 2026-11-24 (D12) and flagged to the owner in the hand-off.
- TPMA/DCA (D-5) web port: the diagram shows two ports side by side. "Before: legacy apps" holds the DCA iPad app and the TPMA web app (Angular). "After: MyBrightLink React web app" holds the DCA screens (★) and the TPMA screens (React, no ★, because teammates built most of the treatment-planning screens); the TPMA screens' edge goes to PostgreSQL ("plans written by clinicians"), not to the REST API, because the API mirrors the legacy mobile endpoints and the sources do not say which endpoints TPMA calls. The diagram title is "Porting TPMA and DCA to one React web app", and its ownership note reads "Teammates built most of the treatment-planning screens, the server-side autosave and the write-back." New step 3 reads "Treatment planning moved from the TPMA Angular web app into the same React app, where clinicians write each plan; the server-side autosave writes session data back into it." (D13, corrected the same day.)

Nothing is deferred.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | All seven case studies get a diagram, Frontera first. | Owner choice. |
| D2 | 2026-11-24 | The Frontera diagram is redrawn from the owner's internal architecture, keeping only what a viewer needs: the core round trip plus failure handling and kill switches; no security layer, no CRM status update; generic labels; no internal names; the source image stays out of the repo. | Owner choice; content plan §6.5. |
| D3 | 2026-11-24 | The diagram is a full-width lead figure on the case-study page; the home page is unchanged. | Owner choice; an AWS diagram needs the full page width. |
| D4 | 2026-11-24 | Step-through interaction without animation. | Owner choice. |
| D5 | 2026-11-24 | (Default) Official AWS Architecture Icons for AWS services. | The owner asked for the diagram to show the AWS architecture; AWS lets customers use the icons in architecture diagrams. |
| D6 | 2026-11-24 | (Default) Inline SVG rendered from typed data, no new dependency. | Mermaid in the browser costs about 600 KB of JavaScript and hurts Lighthouse; Mermaid at build time needs a headless browser in CI and gives a generic look. |
| D7 | 2026-11-24 | (Default) Small screens scroll the diagram sideways at a minimum width. | One layout per diagram; the step list carries the content on a phone. |
| D8 | 2026-11-24 | (Default) Each Xolv diagram is approved one by one at the plan gate. | Tier B, content plan §4. |
| D9 | 2026-11-24 | Plan approved with its defaults; the open questions in §6 are resolved as listed there. | The owner started /dev right after the plan was presented with its defaults. |
| D10 | 2026-11-24 | D-4 Clockwork, D-5 TPMA/DCA web port, D-6 TPMA multi-tenancy and D-7 FAST are held pending per-item owner approval; the Frontera drawing gets the owner's sign-off on the built figure before the pull request. | Tier B needs per-item approval (content plan §4). The hold on the four Xolv diagrams is superseded by D12. |
| D11 | 2026-11-24 | Frontera corrections from the owner's review of the built drawing: the Provider portal uploads the client's documents to the S3 bucket that also holds the report PDF, and Frontera reads them from there as its input; the bucket is labelled "Documents" (was "Report documents") and stays in the partner AWS zone; there is no error queue, so failure handling is only SQS redelivery to dead-letter queues; step 8 passes a "Virus scan" node labelled "ClamAV" (★, from the published "What I built") on the forward path before the report reaches the Provider portal, so only Cognito stays out of the diagram (FR-7); and the forwarding to the Provider portal is Will's part, so step 8 carries ★. | Owner decision: the documents are Frontera's input, the error queue is not implemented, flow 8 should have ClamAV for virus scan, and forwarding from the Provider portal is the owner's part too. |
| D12 | 2026-11-24 | The owner approved D-4 Clockwork, D-5 TPMA/DCA web port, D-6 TPMA multi-tenancy and D-7 FAST, so all seven diagrams are built in this branch; this supersedes the hold in D10. D-5 puts ★ on the REST API node (the plan's default, flagged to the owner in the hand-off). | Owner decision ("draw architect of clockwork and other project too"); the published "What I built" for D-5 includes the REST API. |
| D13 | 2026-11-24 | Three owner decisions. (1) The D-5 TPMA/DCA diagram also shows the TPMA web app (Angular) in a "TPMA" zone, unmarked, with an edge to PostgreSQL and a new step 3 (see §6). Corrected the same day by the owner ("No for TPMA/DCA we port both of the TPMA and DCA to web react"): TPMA's Angular web app is a legacy app, and both legacy apps (the DCA iPad app and the TPMA web app) are ported into the MyBrightLink React web app; the diagram now shows the before and after ports side by side (see §6). (2) ★ on steps follows the ★ nodes: in a diagram with ★ nodes, every step through a ★ node or describing Will's work carries ★ (FR-3); Clockwork and FAST were later set to no ★ at all (D14); This Portfolio has none. (3) Frontera step 2 is Will's work and carries ★, the Provider portal node stays unmarked, and the starred steps are 2, 3, 4, 5, 7 and 8. | Owner decisions: "TPMA/DCA should have the TPMA web angular inside the architecture too"; asked why only step 8 had a ★; "2 is mine too". The published case study says clinicians write a client's treatment plan in TPMA and that data flows back into the plan. |
| D14 | 2026-11-24 | Owner decision: Clockwork (D-4) and FAST (D-7) carry no ★ at all, on nodes or steps, and their legends show no "My part" mark, because both are long-running projects built sprint by sprint across every part of the architecture. Their ownership notes describe the role instead. Clockwork: "Built sprint by sprint across every part of this architecture as a full-stack feature owner (80+ tickets). The recurrence engine and the base Microsoft 365 integration were teammates' work." FAST: "Built sprint by sprint across every part of this architecture, growing from test automation to feature ownership (about 160 tickets). A teammate built the original Salesforce integration; I took ownership of its client-profile sync." | Owner decision: "for CW and FAST, since it a long run project and we develop the feature sprint by sprint so should not show what we own what we not since we touch every part of the architecture". This supersedes the ★-on-steps rule for these two diagrams in D13 and FR-3. |

## 8. Acceptance criteria (refined)

- **AC-1**: The Frontera page shows the lead figure with the AWS diagram, the legend and its numbered steps; at 1366 px wide every label is readable without scrolling.
- **AC-2**: Hovering or focusing step n highlights exactly that step's edges and nodes and dims the rest; clicking pins it (pressed), clicking again unpins it.
- **AC-3**: A case study without a published diagram renders unchanged.
- **AC-4**: At 360 px wide the diagram scrolls sideways inside its frame and the page has no horizontal scroll.
- **AC-5**: A content check fails when an edge or step references a missing node or edge, when step numbers are not 1..n in order, or when a label is empty or a placeholder.
- **AC-6**: No Tier C content in any diagram: the disclosure scrub passes, and review checks every label against content plan §4.
- **AC-7**: The figure renders with the API unreachable (the e2e smoke test).
- **AC-8**: Lighthouse stays at 90 or above on the Frontera page, and no runtime dependency is added.
- **AC-9**: Every published Xolv diagram has its owner-approval date recorded in the plan's content table. All seven diagrams ship in this ticket's branch; each Xolv diagram's approval date (2026-11-24) is recorded in the plan's content table.
