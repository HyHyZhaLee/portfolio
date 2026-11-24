# PF-022 — Architecture diagrams on the case-study pages

**Ticket**: PF-022 · **Refined requirement**: [PF-022-refined-requirement.md](PF-022-refined-requirement.md) · **Packages**: frontend · **Status**: Approved 2026-11-24 · **Last updated**: 2026-11-24 (synced with the code after `/review` and the owner's review of the drawings)

> ⚠️ **No complex flows.** No query, external call, or write is involved. The only state is the active step of the step-through, derived in one line (see §6 *User flow*).

## 1. Requirement summary

Each case study gets one architecture diagram as a full-width lead figure under its title, with a legend, ★ marks on the parts Will implemented, and a numbered step list that highlights its hops on hover, focus, or tap. Frontera ships first as an AWS diagram with official service icons, redrawn from the owner's architecture with only what a viewer needs: the core round trip, failure handling, and kill switches. The diagrams are typed data in `frontend/src/content/diagrams/`, drawn as inline SVG by one shared component, with no new dependency. Xolv diagrams are Tier B and ship one by one after the owner approves each (SITE-007); all four were approved on 2026-11-24, so all seven are built. Diagrams are static, so SITE-001 holds unchanged. Master plan: `../cv-portfolio-content-plan.md` §4, §6.3 (step 6, "add a generic diagram"), §6.5.

## 2. Requirement analysis

| Need | Source | Frontend work |
|---|---|---|
| Lead figure under the title, full width, above At a glance | FR-1, D3, AC-1 | `CaseStudyArticle` renders `ArchitectureFigure` between the header and the grid |
| Heading, summary, drawing, legend, numbered steps | FR-2 | `ArchitectureFigure` composes `DiagramCanvas`, `DiagramLegend`, `StepList` |
| Zones, nodes, directed edges, step badges, ★ marks, ownership note | FR-3 | `ArchitectureDiagram` type; `DiagramCanvas`; `mine` on nodes and on steps (P4) |
| Three edge kinds told apart by colour and line style | FR-4, FR-11 | Two new flow tokens; solid, dashed, and dotted strokes (P6) |
| Step-through: hover or focus previews, click pins | FR-5, D4, AC-2 | `StepList` buttons with `aria-pressed`; `activeStep = pinned ?? previewed` |
| Official AWS icons; generic glyphs elsewhere | FR-6, D5 | Four official SVGs in `src/assets/aws/`; `glyphs.tsx` shared with the hero panel |
| Frontera content: core round trip, redelivery to dead-letter queues, the virus scan, kill switches | FR-7, D2 | `content/diagrams/ai-assessment-integration.ts` (§6 *Content*, D-1) |
| Six more diagrams from published text | FR-8, D1, D8 | One data file each, in slices 2 and 3; a Xolv file is added only once approved |
| No diagram, no change | FR-9, AC-3 | `getDiagram(slug)` returns `undefined`; the article renders as today |
| Small screens scroll sideways inside the frame | FR-10, D7, AC-4 | Scroll frame with a minimum drawing width and a small-screen hint |
| Accessible name, description, text alternative, 3:1 contrast, reduced motion | FR-11 | `<figure>` with `<figcaption>`; `<svg role="img">` with `<title>` and `<desc>`; the `<ol>` of steps; `motion-reduce:` utilities |
| No Tier C in labels; never traced | FR-12, AC-6 | Generic labels only (§6 *Content*); the content test's placeholder and empty-string checks extend to diagrams |
| Integrity of the diagram data | AC-5 | Content test: references resolve, ids unique, shapes inside the viewBox |
| Renders with the API unreachable | AC-7, SITE-001 | E2E smoke asserts the figure on the Frontera route |
| Lighthouse and bundle | AC-8, NN8 | No runtime dependency; drawing has a fixed aspect ratio, so no layout shift |

## 3. Current state

- Case-study page: `frontend/src/pages/CaseStudyArticle.tsx:35` is the header block (back link, `h1` at `:46`, angle at `:49`); `:51` is the two-column grid (`lg:grid-cols-[17rem_minmax(0,42rem)]`) with `GlanceAside` and the article. The figure goes between them, so it can use the full `wrap` width (`--container-page: 74rem`, `frontend/src/index.css:47`; the `wrap` utility is at `:84`), about 1120 px of drawing on a laptop.
- Case-study content: one module per slug in `frontend/src/content/caseStudies/`, keyed by `CaseStudySlug` in `index.ts:12`; the shape is `types.ts:13`. PF-014 (planned, not built) moves this catalog to the backend; diagrams stay outside it (P2).
- Hero panel glyphs: browser, layers, server, and database line icons are inline in `frontend/src/features/api-status/SystemPanel.tsx:46-95` (24-unit viewBox, stroke 1.7). They are the visual language the diagram glyphs reuse.
- Tokens: `frontend/src/index.css:9-20` (surface, ink, muted, line, accent, status). Status colours are for live-state dots only (`:6`), so flows need their own tokens.
- Test IDs: `frontend/src/config/test-ids.config.ts:47` (`caseStudy`). Strings: `frontend/src/i18n/en.ts:117` (`caseStudy.*`).
- Tests to extend: `frontend/src/content/content.test.ts:34` (content shape, empty strings at `:70`, placeholders at `:74`); `frontend/src/pages/CaseStudyPage.test.tsx:23`; `frontend/e2e/smoke.spec.ts:20` (case-study route with every API call aborted).
- Prerender writes only each route's title and description (`frontend/scripts/prerender.mjs:1`); page bodies are client-rendered, so the figure needs nothing there.
- The reviewed content pack has two Tier B Mermaid sketches (Frontera and multi-tenancy). They seed the two drawings; nothing else is copied.

## 4. Approach

A diagram is data: zones, nodes, edges, steps, and the copy around them, in one typed module per case study under `src/content/diagrams/`. One presentational kit in `src/components/diagram/` draws any diagram as inline SVG in the site's tokens. `CaseStudyArticle` looks the diagram up by slug and renders the figure when there is one. Layout is explicit: every node has `x`, `y`, `w`, `h` in a 1200-unit-wide viewBox, and every edge names the node sides it leaves and enters, with optional waypoints. A small geometry module turns that into orthogonal paths with rounded corners. Hand-placed layout keeps each drawing deliberate and lets the data stay readable, with no layout engine. AWS services use the official AWS Architecture Icons as unmodified SVG files rendered with `<image>`; every other node uses a line glyph that matches the hero panel.

Plan decisions:

- **P1.** Content and rendering are separate: `src/content/diagrams/{slug}.ts` holds the data and the public copy; `src/components/diagram/` holds the kit; the UI strings (heading, legend items, hint, steps label, and the canvas's "DLQ" and "AWS" tags) are `diagram.*` i18n keys. Frontend guide principles 1, 3, 11.
- **P2.** Diagrams are not a `CaseStudy` field. They are presentation-heavy (coordinates) and Tier B items are approved one by one, so `diagrams` is a `Partial<Record<CaseStudySlug, ArchitectureDiagram>>` and an unapproved diagram simply has no file. This also keeps PF-014's catalog, schema, and snapshot unchanged: diagrams stay frontend data keyed by slug, like the certificate images.
- **P3.** Step numbers come from array order (1..n), so they can never skip or repeat. A step lists the edge ids it highlights (their end nodes light up with them), optionally extra node ids, and a badge position; a step may highlight a node alone, such as Smart Pole's firmware step.
- **P4.** `mine` can sit on a node or on a step. Where Will owned a whole component (Frontera's backend and Lambdas, Smart Pole's firmware), the node gets ★, and so does every step that runs through it or describes his work, so the step list, the full text alternative, carries ownership too (owner question, 2026-11-24); where he built features sprint by sprint across the whole architecture (Clockwork, FAST), nothing gets ★ and the ownership note describes his role instead, because splitting his parts from the team's would misrepresent the work (owner decision, 2026-11-24). This Portfolio is a solo project, so it has no ★ and its note says so. The legend shows "My part" only when something is marked; the ownership note is always shown, worded from the published *My role and scope*.
- **P5.** The step-through state lives in `ArchitectureFigure`: `previewed` (set by pointer enter or focus, cleared by pointer leave or blur) and `pinned` (toggled by click); `activeStep = pinned ?? previewed`. `CaseStudyArticle` keys the figure by slug, so the next case study starts with nothing pinned or previewed. `DiagramCanvas` receives `activeStep` and marks each node, edge, and badge with `data-active` or `data-dim`; zones stay at full strength as context; CSS does the rest (`data-dim:opacity-15`). No effect, no global state (frontend principle 12).
- **P6.** Two new tokens in `@theme`: `--color-flow-return` (teal `#0d7569`) and `--color-flow-failure` (red `#b8322a`). Main flow is ink and solid, return is teal and dashed, failure is red and dotted. Because edge labels are small text in these colours, both meet 4.5:1 on every surface, measured in `/dev`: teal 5.58, 5.05, and 4.64 on `surface-raised`, `surface`, and `surface-sunk` (darkened from `#0e7a6d`, which gave 4.34 on `surface-sunk`); red 5.95, 5.39, and 4.95. ★ nodes get an accent border, a light accent tint, and a ★ badge; step badges are ink circles, accent when active.
- **P7.** Kill switches are a small toggle marker on the edge they guard, explained once in the legend. Failure handling on Frontera is the small "DLQ" tag on the SQS nodes for redelivery to dead-letter queues; the team built no error queue, so none is drawn (owner correction, 2026-11-24). The red dotted failure edge is used where a system has one, such as This Portfolio's email retries. Feature-flag names never appear.
- **P8.** Small screens: the drawing keeps a minimum width of 52rem (about 0.7 scale, so a 16-unit label renders at about 11 px) inside a horizontally scrolling frame (`overflow-x-auto`, `tabIndex={0}`, a labelled region, so keyboard users can scroll). A hint under the frame shows below the `lg` breakpoint (1024 px) only, because the drawing overflows its frame up to a viewport of about 940 px (52rem plus the page and panel padding). The page itself never scrolls sideways; the step list sits below at full width and carries the whole story on a phone.
- **P9.** AWS icons: the official asset package's 48 px SVGs for EventBridge, Lambda, SQS, and S3, from the 31 July 2026 package (`Icon-package_07312026`), committed unmodified under `frontend/src/assets/aws/` and imported with `?no-inline`, so they are served as image files instead of data URIs in the entry bundle (3.8 kB gzip saved). AWS lets customers use these icons in architecture diagrams; the terms are recorded in `docs/knowledge/tooling.md`. No other vendor logos: Salesforce, Microsoft 365, Firebase, and the like are labelled text with a generic glyph.
- **P10.** The hero panel's four inline glyphs move into `src/components/diagram/glyphs.tsx`, and `SystemPanel` imports them, so the site keeps one icon language with one source. The glyph set adds queue, job (clock), device (chip), person, document, external system (globe), spark (an AI service), and shield (a security scan, such as Frontera's virus scan).
- **P11.** Fixed aspect ratio: the `<svg>` has a `viewBox` and `width: 100%`, so its height is known before paint and there is no layout shift (Lighthouse CLS).
- **P12.** Interaction is never required: every step's text is in the list, the drawing has a `<desc>` summarizing the flow, and nothing is hidden behind hover. Highlight transitions use `motion-safe:` only.

| Alternative | Why not |
|---|---|
| Mermaid rendered in the browser | About 600 KB of JavaScript on the case-study route, a Lighthouse risk (AC-8), a generic look, and no AWS icons or ★ styling |
| Mermaid rendered to SVG at build time | Needs `mermaid-cli` and a headless browser in CI and in `pnpm build`; static output cannot do the step-through without hand-editing the SVG |
| One hand-written SVG component per diagram | Seven bespoke drawings repeat the same edge, badge, and legend code; the step-through would be wired seven times; the copy would live inside JSX |
| Auto-layout (dagre or elkjs) | 40–300 KB for layouts that still need manual nudging; seven fixed diagrams do not justify a layout engine |
| A portrait layout for phones | Doubles every layout; sideways scrolling plus the full step list covers phones (D7) |
| Diagram data inside the PF-014 catalog | Coordinates are presentation, and Tier B approval is per diagram; storing them in PostgreSQL would add columns and a seed format for no reader benefit |

**Reuse**: `wrap` utility, `rounded-panel`, `shadow-panel`, theme tokens, `getTestIdProp`, `t()`, the hero panel's glyph paths (moved, not copied), `CaseStudySlug`. **Single responsibility**: `ArchitectureFigure` composes the figure and owns the step-through state; `DiagramCanvas` draws one diagram for a given active step; `DiagramLegend` lists the marks a diagram uses; `StepList` renders the steps as toggle buttons; `geometry.ts` turns sides and waypoints into anchor points and path strings; `glyphs.tsx` holds the generic line icons; `content/diagrams/index.ts` maps a slug to its diagram.

## 6. Frontend

### Components and routes

- `pages/CaseStudyArticle` (changed): after the header block, `{diagram && <div className='wrap pb-12'><ArchitectureFigure diagram={diagram} /></div>}`, with `diagram = getDiagram(study.slug)`. The page title and the subtitle under it drop PF-003's width caps (`max-w-[21ch]`, `max-w-[46ch]`) and use `text-balance`, so they span the page width like the figure below and long titles wrap into two even lines instead of three (owner request, 2026-11-24). Elsewhere in this branch at the owner's request: the Featured work rows' cue reads "View project details" instead of "Read case study" (`work.viewDetails`), and the other visitor-facing wording says "project" instead of "case study": "Next project", the skills hint, intro and counts ("used in 3 projects"), the Featured work intro and the At Xolv subheading, the Experience line, and the home page's meta description. Code names and the docs keep "case study" as the internal term.
  - `components/diagram/ArchitectureFigure` (new): `<figure>` in a raised panel; `<figcaption>` with the heading ("Architecture") and the diagram's summary; the scroll frame with `DiagramCanvas`; `DiagramLegend`; `StepList`; the ownership note.
    - `components/diagram/DiagramCanvas` (new): `<svg role="img" aria-labelledby>` with `<title>` (the diagram title) and `<desc>`; zones, then edges (arrow markers per kind, kill-switch markers, labels), then nodes (icon, label, detail, ★, DLQ tag), then step badges (`aria-hidden`).
    - `components/diagram/DiagramLegend` (new): only the marks the diagram uses (My part, Main flow, Return, Failure path, Can be switched off on its own, DLQ).
    - `components/diagram/StepList` (new): `<ol>` of `<button type="button" aria-pressed>`; number chip, ★ when the step is mine, text.
  - `components/diagram/geometry.ts`, `components/diagram/glyphs.tsx` (new); `features/api-status/SystemPanel` (changed: imports four glyphs).
- No new route: titles, meta descriptions, the sitemap, and prerender are unchanged.

Data contract (`content/diagrams/types.ts`, as built):

```ts
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type EdgeKind = 'main' | 'return' | 'failure';
export type AwsIcon = 'eventbridge' | 'lambda' | 'sqs' | 's3';
export type Glyph = 'browser' | 'layers' | 'server' | 'database' | 'queue' | 'job' | 'device' | 'person' | 'document' | 'external' | 'spark' | 'shield';
export interface Point { x: number; y: number }
export interface DiagramZone { id: string; label: string; x: number; y: number; w: number; h: number; aws?: true }
export interface DiagramNode {
    id: string; label: string; detail?: string;
    x: number; y: number; w: number; h: number;
    icon: { aws: AwsIcon } | { glyph: Glyph };
    mine?: true; stack?: true; dlq?: true; labelBelow?: true;
}
export interface EdgeEnd { node: string; side: Side; offset?: number }
export interface DiagramEdge {
    id: string; kind: EdgeKind; from: EdgeEnd; to: EdgeEnd;
    via?: readonly Point[]; label?: string; labelAt?: Point; killSwitch?: true;
}
export interface DiagramStep { text: string; edges: readonly string[]; nodes?: readonly string[]; badge: Point; mine?: true }
export interface ArchitectureDiagram {
    title: string; summary: string; description: string; ownership: string;
    width: 1200; height: number;
    zones: readonly DiagramZone[]; nodes: readonly DiagramNode[];
    edges: readonly DiagramEdge[]; steps: readonly DiagramStep[];
}
```

Added while building, inside the plan's intent: `offset` lets two edges leave one side apart (Frontera's report and result both leave the bottom of the Frontera node); `labelAt` places a label away from a step badge; `labelBelow` puts an AWS label under its icon on the return lane. A card node draws its glyph, label, and wrapped detail inside the box (a card narrower than 150 units uses a tighter inset); an AWS node draws the official icon with its label wrapped above it (below with `labelBelow`). `stack` draws a node as a stack of cards (Frontera's queue per event type); `dlq` adds the DLQ tag; `aws` on a zone draws the AWS group style (a thin border with a small "AWS" tag). `geometry.ts` holds `anchorPoint`, `routePoints` (orthogonal elbows, the end pulled back 5 units for the arrowhead), `roundedPath`, `pathMidpoint` (the kill-switch marker), `longestSegmentCentre` (the default label spot), and `wrapLines`.

### Content

Every text block below is public. Diagram copy uses only facts already on the case-study pages, plus the owner-approved Frontera topology. Labels are generic (FR-12). Each Xolv row ships only once its Tier says approved; until then its file is not added (P2), and the page renders as today. Layout coordinates for Frontera come from the mockup reviewed at this gate (machine-local, `.local/design/` in this worktree; its AWS icons are stand-ins); the others are laid out in `/dev` on the same grid.

| Block | Source | Tier | Status |
|---|---|---|---|
| UI strings: "Architecture", "My part", "Main flow", "Return", "Failure path", "Can be switched off on its own", "Redelivered, then kept in a dead-letter queue" (the DLQ tag), "Scroll sideways to see the whole diagram", "Step by step", and the canvas tags "DLQ" and "AWS" | New UI copy | A | built |
| Frontera diagram (D-1) | Owner's architecture, simplified on 2026-11-24 (D2) and corrected at the drawing's review the same day (D11); case study `ai-assessment-integration` | B (topology and layers approved 2026-11-24; the corrected drawing awaits the owner's sign-off before the pull request) | built |
| This Portfolio diagram (D-2) | Case study `this-site`; `README.md` architecture | A | built |
| Smart Pole diagram (D-3) | Case study `smart-pole` | A (the two edges drawn as the defaults) | built |
| Clockwork diagram (D-4) | Case study `scheduling-platform` | B (approved 2026-11-24) | built |
| TPMA/DCA web port diagram (D-5) | Case study `legacy-app-web-port`; the ownership note's teammate line from the reviewed draft; both legacy apps (DCA on iPad, TPMA in Angular) ported to React, from the owner (2026-11-24) | B (approved 2026-11-24) | built |
| TPMA multi-tenancy diagram (D-6) | Case study `postgres-rls-multi-tenancy`; reviewed draft sketch | B (approved 2026-11-24) | built |
| FAST diagram (D-7) | Case study `client-intake-platform` | B (approved 2026-11-24) | built |

#### D-1 Frontera (`ai-assessment-integration`), slice 1

- **Title**: "Frontera integration architecture". **Summary**: "How a new client's documents reach the partner AI platform, and how the report comes back for review."
- **Ownership note**: "★ The parts I implemented. The tech lead owned the design and event contracts; DevOps owned the AWS infrastructure."
- **Zones**, left to right: *Provider systems* · *Internal events* (AWS style) · *MyBrightLink* · *Partner events* (AWS style) · *Partner AI platform*. Outbound runs left to right along one lane; the return runs right to left along the bottom, the report is forwarded along the top through the virus scan, and the client's documents travel along the very bottom to the Documents bucket. AWS labels sit above the icons on the outbound lane and below them on the return lane, so return edges enter shared nodes from below without crossing a label.
- **Nodes**: CRM (Salesforce) [external] · Provider portal [browser] · Internal event bus [EventBridge] · Enricher ★ [Lambda] · Internal queue [SQS, DLQ] · Virus scan ★ "ClamAV" [shield] · Review screens ★ "React" [browser] · Backend ★ "Spring Boot" [server] · Event history ★ "PostgreSQL" [database] · Partner event bus [EventBridge] · Input enricher ★ [Lambda] · Queue per event type [SQS, stack, DLQ] · Frontera "drafts the report" [spark] · Documents [S3] · Output enricher ★ [Lambda]. The virus scan carries ★ because the published *What I built* lists virus scanning of incoming clinical PDFs.
- **Kill switches** on: Provider portal → internal bus; internal queue → backend; backend → partner bus.
- **Steps**:
  1. The CRM places a client and hands the work to the Provider portal.
  2. ★ The Provider portal uploads the client's documents to S3 and publishes client and document events to the internal event bus. The ★ marks this integration as Will's work (owner, 2026-11-24); the Provider portal card stays unmarked, so the ★ does not claim the whole portal.
  3. ★ An enricher Lambda adds context and queues each event in SQS.
  4. ★ The MyBrightLink backend pulls the queue and records each event once, so a redelivered event is not processed twice.
  5. ★ It publishes to the partner event bus, and an enricher Lambda fans the events out to one queue per event type.
  6. Frontera picks up the events, reads the documents from S3, drafts the assessment report and stores the PDF in the same bucket.
  7. ★ The result comes back through the partner bus, and an output Lambda queues it for MyBrightLink.
  8. ★ A clinician reviews the report in MyBrightLink; it is scanned for viruses with ClamAV and forwarded to the Provider portal. The ★ marks the forwarding as Will's work (D11).
- **Edge labels**: "client documents" (Provider portal to Documents), "documents" (Documents to Frontera), "report PDF" (Frontera to Documents), "result" (Frontera to the partner bus), "into the internal queue" (Output enricher to the internal queue), "forward report" (Review screens to the virus scan).
- **Text alternative** (`<desc>`): the whole round trip in prose, plus one sentence that three hops can each be switched off on their own and that both queues redeliver failed events before keeping them in a dead-letter queue.
- **Left out on purpose** (D2, D11): Cognito, the status update back to the CRM, an error queue (the team did not build one), the individual queue names, every internal name, and any infrastructure claim (Terraform, the DLQ recovery service, alerting). The virus scan, first left out, was added at the owner's request (D11).

#### D-2 This Portfolio (`this-site`), slice 2

- **Title**: "This portfolio's architecture". **Summary**: "Static pages that never wait, and a small API that adds live extras." **Ownership**: "Solo project: I designed and built all of it." (no ★)
- **Zones**: *Visitor* · *Vercel* · *Render* · *Neon* · *Services*.
- **Nodes**: Browser [browser] · Static site "React, prerendered pages" [layers] · API "Spring Boot" [server] · Contact retry job [job] · PostgreSQL [database] · Resend email [external] · GitHub Actions "checks, then deploy" [job].
- **Steps**: 1. The page renders from static files on Vercel; no section waits for the API. 2. The status panel calls the API, which can take about a minute to wake on the free tier; the page stays usable meanwhile. 3. A page view is stored as a keyed hash with the path, the referrer host and a device class: no cookies, no raw IP address. 4. A contact message is saved as pending, then emailed through Resend with no database transaction open; a scheduled job retries failed sends. 5. GitHub Actions runs the checks and deploys both apps.
- **Edge labels**: "deploy" (GitHub Actions to the static site), "retries failed sends" (the retry job to Resend, drawn as the failure path). No ★: the ownership note covers the whole system.
- Whichever of PF-014 and PF-022 merges second updates this diagram for the content API.

#### D-3 Smart Pole (`smart-pole`), slice 2

- **Title**: "Smart Pole system layers". **Summary**: "Four layers, from sensor firmware on the pole to a real-time app." **Ownership**: "★ The parts I implemented. I led the team of three and defined the architecture; teammates built the other modules."
- **Zones**: *Physical* · *Network* · *Data processing* · *Application*.
- **Nodes**: Sensor nodes ★ "ESP32, FreeRTOS" [device] · Camera [device] · Uplinks "NB-IoT, LoRa, MQTT" [external] · MQTT gateway ★ "Python" [server] · Edge AI ★ "vehicle speed" [job] · Firebase [database] · Monitoring app ★ "Flutter, web and Android" [browser].
- **Steps**: 1. ★ Sensor nodes run FreeRTOS tasks with a watchdog, so a stuck task restarts the device. 2. ★ Frames cross the pole's RS485 bus with Stop-and-Wait ARQ: each frame waits for an acknowledgement and is resent if none arrives. 3. Data leaves the pole over NB-IoT, LoRa or MQTT. 4. ★ A Python MQTT gateway receives it and passes it on. 5. ★ Edge AI estimates vehicle speed from camera video, at the edge. 6. ★ A Flutter app on Firebase shows it in real time on the web and Android.
- **Edge labels**: "RS485 frames" (sensor nodes to the uplinks) with a dashed "ACK" return for Stop-and-Wait ARQ, "video" (camera to edge AI), "speed estimates" (edge AI to Firebase). Step 1 highlights the sensor nodes alone.
- **Defaults applied** (D9 in the refined requirement): the RS485 frames are drawn from the sensor nodes to the uplinks, and the speed estimates to Firebase.

#### D-4 Clockwork (`scheduling-platform`), slice 3

- **Title**: "Clockwork scheduling architecture". **Summary**: "Scheduling that books around conflicts and watches authorizations, calendars and holidays." **Ownership**: "Built sprint by sprint across every part of this architecture as a full-stack feature owner (80+ tickets). The recurrence engine and the base Microsoft 365 integration were teammates' work." (no ★, P4)
- **Zones**: *Clockwork* · *External services*. **Nodes** (no ★, P4): Scheduling web app "React" [browser] · GraphQL API "Spring Boot" [server] · PostgreSQL [database] · Worker pods "Quartz jobs" [job] · Salesforce "authorization changes" [external] · Microsoft 365 "room calendars, Microsoft Graph" [external] · Google Calendar API "U.S. federal holidays" [external].
- **Steps** (no ★, P4): 1. Accepting a recurring offer books every session still available and records why the rest were skipped. 2. Worker pods track authorization changes from Salesforce and, every 30 minutes, flag appointments outside a client's authorized dates, hours or services. 3. A quarterly job loads U.S. federal holidays from the Google Calendar API, and clashing bookings raise alerts. 4. Every 5 minutes a job syncs room calendars from Microsoft 365 with Microsoft Graph delta queries. 5. Schedulers see the flags and alerts in the React screens.

#### D-5 TPMA/DCA web port (`legacy-app-web-port`), slice 3

- **Title**: "Porting TPMA and DCA to one React web app". **Summary**: "Two legacy apps rebuilt as React screens in MyBrightLink; the data-collection screens run on an API that mirrors the old mobile endpoints." **Ownership**: "★ The parts I built, as one of five developers. Teammates built most of the treatment-planning screens, the server-side autosave and the write-back." (the teammate line from the reviewed draft, approved with D-5).
- **Owner corrections** (2026-11-24, D13 in the refined requirement): the team ported both legacy apps, the DCA iPad app and the TPMA Angular web app, into the MyBrightLink React web app, so the diagram shows two ports side by side.
- **Zones**: *Before: legacy apps* · *After: MyBrightLink React web app* · *Server*. **Nodes**: DCA iPad app "SQLite and sync rules" [device] · TPMA web app "Angular" [browser] · DCA screens ★ "data collection, React" [browser] · TPMA screens "treatment planning, React" [browser] (no ★: teammates built most of them) · Treatment-plan parser ★ [document] · Autosave, client side ★ [job] · REST API ★ "Node.js, Express" [server] · PostgreSQL [database] · Server autosave "and plan write-back" [server].
- **Steps**: 1. ★ I analyzed the DCA iPad app's API calls, local SQLite data and sync rules, and wrote the migration plan. 2. ★ The DCA screens load appointments, check-in and check-out, clients and treatment plans through an Express API that mirrors the legacy mobile endpoints. 3. Treatment planning moved from the TPMA Angular web app into the same React app, where clinicians write each plan; the server-side autosave writes session data back into it. 4. ★ The parser maps nested plan data (six goal types plus behavior and fluency data) into session screens. 5. ★ Autosave sends versioned saves, so a background refresh never overwrites a clinician's unsaved input. 6. ★ Group sessions save per client, so a failure stays contained to one client.
- **Edge labels**: "treatment plans" (REST API to the parser), "versioned saves" (client autosave to the REST API), "plans written by clinicians" (TPMA screens to PostgreSQL along the bottom; drawn to the database rather than to the REST API, because that API mirrors the legacy mobile endpoints and the sources do not say which endpoints the TPMA screens call).
- **★ on the REST API node**: kept as proposed (it is in *What I built*), with the owner's approval of D-5 on 2026-11-24 (D12).

#### D-6 TPMA multi-tenancy (`postgres-rls-multi-tenancy`), slice 3

- **Title**: "Tenant isolation in the database". **Summary**: "Every request carries its tenant, and PostgreSQL enforces the boundary." **Ownership**: "★ The parts I implemented, under the tech lead's shared-schema strategy. A teammate finished the production rollout."
- **Zones**: *Client* · *API* · *PostgreSQL*. **Nodes**: Browser "signed-in user" [browser] · API "Node.js, Express" [server] · Connection hook ★ "Sequelize" [job] · Background jobs [job] · Bypass role ★ "skips isolation" [person] · RLS policies ★ [database] · Guard triggers ★ [database] · Tenant-owned tables "~90" [database].
- **Kill switch** on API → connection hook. **Steps**: 1. A signed-in user's request reaches the API. 2. ★ The connection hook applies the user's tenant to every database request. 3. ★ Row-Level Security policies let each organization read and write only its own records. 4. ★ Guard triggers reject a record saved for the wrong tenant. 5. ★ Background jobs have no signed-in user, so they use one named bypass role. 6. ★ A feature-flag kill switch controlled the rollout.

#### D-7 FAST (`client-intake-platform`), slice 3

- **Title**: "FAST intake architecture". **Summary**: "One path from a family's screener survey to staff review and a Salesforce hand-off." **Ownership**: "Built sprint by sprint across every part of this architecture, growing from test automation to feature ownership (about 160 tickets). A teammate built the original Salesforce integration; I took ownership of its client-profile sync." (no ★, P4)
- **Zones**: *FAST* (an AWS-style subzone around the Lambda) · *Hand-off*. **Nodes** (no ★, P4): Screener survey [document] · Lambda processor [Lambda] in the *Survey processing* subzone · Caregiver portal "React" [browser] · Admin portal "React" [browser] · Backend "NestJS" [server] · PostgreSQL "task queue" [database] · Scheduled jobs [job] · Salesforce [external] · Clockwork [external].
- **Steps**: 1. A family completes the screener survey, and a Lambda processor passes it to the backend. 2. In the caregiver portal the family books an intro call before sign-up; PostgreSQL advisory locks prevent double bookings. 3. Staff review each family in the admin portal and hand them off to Salesforce and Clockwork. 4. Scheduled jobs over a PostgreSQL task queue sync the client profile with Salesforce, with retries, a circuit breaker and stale-task recovery. 5. Support staff reset stuck clients with support tools, without database access.

### Test IDs

| Element | Test ID | Purpose |
|---|---|---|
| The figure | `case-study-diagram-figure` (`TestIds.caseStudy.diagram`) | Present on a study with a diagram, absent otherwise; e2e smoke |
| The scroll frame | `case-study-diagram-scroll-region` (`TestIds.caseStudy.diagramScroll`) | The 360 px smoke test checks that the drawing scrolls inside it (AC-4) |
| Each step button | `case-study-diagram-step-button` (`TestIds.caseStudy.diagramStep`) | Step-through tests |
| The legend list | `case-study-diagram-legend-list` (`TestIds.caseStudy.diagramLegend`) | Only the marks a diagram uses |
| Each node and edge group | `case-study-diagram-node-group`, `case-study-diagram-edge-group`, with `data-node-id` and `data-edge-id` | Which groups a step marks active or dim |

The IDs follow the `{feature}-{element}-{type}` convention, so they carry a type suffix the first draft of this table lacked.

### User flow

1. A visitor opens a case study; the lead figure shows the whole drawing, every element at full strength.
2. Pointing at or tabbing to step *n* sets `previewed = n`: its edges, nodes, and badge stay strong, everything else dims. Leaving or blurring clears `previewed`.
3. Clicking or tapping step *n* toggles `pinned` (`aria-pressed`); while pinned, hovering another step previews it only if nothing is pinned, so `activeStep = pinned ?? previewed`. Clicking the pinned step again unpins it.
4. On a phone, the visitor scrolls the drawing sideways or reads the step list, which holds every fact.
5. Following *Next project* to another study with a diagram starts that diagram with nothing pinned or previewed.

## 8. Files, order, risks, tests

**New**: `frontend/src/content/diagrams/{types,index}.ts`, one `frontend/src/content/diagrams/{slug}.ts` per published diagram (built: all seven, `ai-assessment-integration.ts`, `scheduling-platform.ts`, `legacy-app-web-port.ts`, `postgres-rls-multi-tenancy.ts`, `client-intake-platform.ts`, `this-site.ts`, `smart-pole.ts`); `frontend/src/components/diagram/{ArchitectureFigure,DiagramCanvas,DiagramLegend,StepList,glyphs}.tsx`, `frontend/src/components/diagram/geometry.ts`; `frontend/src/assets/aws/{eventbridge,lambda,sqs,s3}.svg`; tests `frontend/src/components/diagram/{geometry.test.ts,ArchitectureFigure.test.tsx}`. **Modified**: `frontend/src/pages/CaseStudyArticle.tsx`, `frontend/src/features/api-status/SystemPanel.tsx`, `frontend/src/index.css` (two flow tokens), `frontend/src/config/test-ids.config.ts`, `frontend/src/i18n/en.ts`, `frontend/src/content/content.test.ts`, `frontend/src/pages/CaseStudyPage.test.tsx`, `frontend/e2e/smoke.spec.ts`, `docs/architecture/frontend.md` (a short *Diagrams* note under principle 3), `docs/knowledge/tooling.md` (the AWS icon terms and two tooling facts), `frontend/CLAUDE.md` (project structure), `docs/prd/backlog.md`. **Modified at the owner's request during review** (copy and layout around the diagrams): `frontend/src/sections/WorkRow.tsx` ("View project details"), `frontend/src/content/{experience,featuredWork,site,skills}.ts` ("project" instead of "case study"), and `frontend/src/pages/CaseStudyArticle.tsx` (title and subtitle width). **Shipped with this commit at the owner's request**: the PF-014 and PF-020 planning docs (`docs/plans/content/PF-014-*.md`, `docs/plans/content/PF-020-*.md`, the `content` domain row in `docs/plans/README.md`, and their backlog rows), and PF-025's app icon (`frontend/public/favicon.svg`, `frontend/public/apple-touch-icon.png`, its link in `frontend/index.html`).

**Order**:

- **Slice 1, the kit and Frontera** (demoable, built): contract first (`types.ts`, `geometry.ts` signatures, component props, test IDs, i18n keys, tokens) → test writers start on the slice-1 tests → glyphs moved out of `SystemPanel` → `geometry.ts` → `DiagramCanvas` → `DiagramLegend`, `StepList` → `ArchitectureFigure` → AWS icons → `ai-assessment-integration.ts` from the approved mockup → `CaseStudyArticle` → contrast check of the flow tokens → Lighthouse on the Frontera route.
- **Slice 2, own projects**: `this-site.ts`, `smart-pole.ts` (Tier A; the D-3 defaults applied). Built.
- **Slice 3, the other Xolv diagrams**: `scheduling-platform.ts`, `legacy-app-web-port.ts`, `postgres-rls-multi-tenancy.ts`, `client-intake-platform.ts`, each only if its row is approved; an unapproved one is left out and noted in PROGRESS. Built on 2026-11-24 after the owner approved all four (refined requirement D12).

| Risk | Mitigation |
|---|---|
| Tier C leaks into a label (an internal name from the owner's architecture) | Labels come only from §6 *Content*; the content tables are the review surface; `/create-pr`'s disclosure scrub; the review checks every label against content plan §4 |
| A ★ overclaims a teammate's component | P4: ★ on steps where ownership is per feature; each ownership note is worded from the published role text; the owner approves each Xolv diagram |
| The drawing is unreadable on a phone | P8: minimum width with sideways scroll, plus the full step list; checked at 360 px in the smoke test |
| Hand-placed layouts drift or overlap after a copy edit | The content test fails on shapes outside the viewBox; the Frontera layout comes from the reviewed mockup; labels have a fixed node size, and long text moves to `detail` |
| Flow colours fail contrast or read as status colours | P6: separate tokens, line styles as a second cue, a contrast check in `/dev` |
| The AWS icon terms change | P9: `/dev` reads the package's terms at download time and records them; fallback is the generic queue, job and layers glyphs with AWS service names as labels |
| PF-014 merges first and rewrites `CaseStudyArticle` | P2 keeps the figure a single line in the article that reads `getDiagram(slug)`; whichever merges second rebases that line and updates D-2 |
| Moving the glyphs changes the hero panel | The glyphs move verbatim; the existing `SystemPanel` tests stay green |

**Tests** (within the test budget):

- *Slice 1*: `geometry.test.ts` (unit, a table of about five cases: an anchor point on each side, a straight path when anchors align, an elbow path with a rounded corner, a path through waypoints). `ArchitectureFigure.test.tsx` with a small synthetic diagram: the figure has its accessible name and lists the steps in order; hovering step 2 marks its edges active and dims the rest; clicking pins it (`aria-pressed="true"`) and pointer leave keeps the highlight; clicking again clears it; focusing a step by keyboard highlights it; the legend shows only the kinds the diagram uses (AC-2). `content.test.ts`: diagrams join `allContent` (empty-string and placeholder checks), plus one integrity test over every diagram: unique ids, every edge endpoint and step reference resolves, every zone, node, and badge lies inside the viewBox (AC-5). `CaseStudyPage.test.tsx`: the Frontera page renders the figure, a study without a diagram does not (AC-1, AC-3), and following the Next link from a pinned step starts the next study's diagram with nothing pinned (AC-2). `smoke.spec.ts`: with every API call aborted, `/work/ai-assessment-integration` shows the figure (AC-7), and at a 360 px viewport the drawing scrolls inside its frame while the page has no horizontal scroll (AC-4). Lighthouse on the Frontera route, run by hand (AC-8).
- *Slices 2 and 3*: data only; the content integrity test covers each new file. No new test files. With every study now carrying a diagram, AC-3's page test renders a stand-in study whose slug has no diagram file.

**Verified in `/dev`** (2026-11-24): the slice tests (63) and the e2e smoke suite (8) pass. Lighthouse 13.5.0 (mobile, `vite preview`, API unreachable) scores the Frontera page 100 for accessibility, 100 for best practices, and 91 for SEO (the site has no `robots.txt` yet, a PF-012 deploy item, so `/robots.txt` returns `index.html` on main too), with layout shift 0. Performance is 90 on two runs, against 92 on main for the same page, because the diagram kit and data add 8.5 kB gzip to the entry bundle (138.3 kB on main, 146.8 kB here, after the AWS icons moved out of it). The home page scores 87 on main and 85 here, so the follow-up below would win those 2 points back. After the owner's corrections and slice 3 (same day), the entry bundle is 149.0 kB gzip, and Lighthouse still scores the Frontera page 90, 100 and 100 for performance, accessibility and best practices on two runs, with layout shift 0: AC-8 holds, with no margin.

**Open after `/dev`**: (1) the owner's sign-off on the corrected Frontera drawing (Tier B) before the pull request; (2) whether to code-split the case-study page, so the home page stops loading the diagram kit (a deviation from this plan: it touches the routes and the page tests). It is more pressing now that all seven diagrams ship in the entry bundle and the Frontera page sits exactly at AC-8's floor.

## 9. Decisions to approve at this gate

- **Frontera drawing**: review the mockup (§8 *Order*, slice 1) for layout, the eight steps, the ★ marks, and the three kill switches; this approval completes D-1's Tier B approval.
- **Xolv diagrams D-4 to D-7**: approve, edit, or hold each one; a held diagram is left out of slice 3. Resolved: all four approved on 2026-11-24 (D12).
- **D-3 confirmations**: the two Smart Pole edges.
- **D-5 confirmation**: ★ on the REST API node. Resolved: kept (D12).
