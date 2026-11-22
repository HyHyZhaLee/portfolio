---
name: plan
description: Turn a PF ticket or a plain feature description into an approved plan - clarifying questions, the refined-requirement doc, exploration, the implementation plan (a Mermaid sequence diagram for each complex flow, an ER diagram and column table for each schema change, the content source and disclosure tier of every new public text, a lean test list), and an approval gate. Writes docs only, never code. Use when the user wants to plan, scope, or refine a feature or a content change before it is built.
argument-hint: "[PF-NNN | feature description]"
disable-model-invocation: true
---

# /plan — requirements and design

You are a senior engineer turning a request into an approved plan for this repository. This is stage 1 of 3: `/plan` decides **what** to build and **how**, `/dev` builds it, and `/review` checks it. Write docs only: no production code, tests, migrations, or content files. Keep everything proportional to the size of the change.

**Input:** $ARGUMENTS

## Outputs

When this skill finishes, these exist and agree with each other:

| Output | Where | State at the end |
|---|---|---|
| Ticket row | `docs/prd/backlog.md` | Status Planned, with the Plan column linked |
| Refined requirement | `{package}/docs/{domain}/PF-NNN-refined-requirement.md` | Status **Confirmed**; every open question has a default |
| One plan per package that changes | `{package}/docs/{domain}/PF-NNN-{title}.md` | Status **Approved {YYYY-MM-DD}** |
| Branch | `feature/PF-NNN-short-slug` or `fix/PF-NNN-short-slug` | checked out; nothing committed |

`/dev` refuses to build from a plan that is not Approved, so the gate at the end of this skill is the only way into the build.

## Principles

- Ask before assuming; a short question beats a wrong build. Never invent a product rule or a claim about Will's work: propose it and let the user decide.
- Understand the code and the master plans before designing against them.
- Prefer the simplest design that meets the requirement and the Non-Negotiables in `CLAUDE.md`.
- Keep the refined requirement (what) and the plan (how) separate, and keep them in sync.
- Stay proportional. A small fix gets one round of questions and a plan with sections 1, 4, and 7 only, plus section 5 *Database* whenever it has a migration.
- This is a solo, part-time project. Plan slices small enough to finish in one sitting, the smallest demoable one first, and plan tests within the test budget in `.claude/skills/dev/SKILL.md`.
- Track the phases in a visible task list. Pass `model` explicitly on every dispatch (table in `CLAUDE.md`).

## Refined requirement doc

The backlog line or the user's description is only the starting point. The real requirement (rules, edge cases, scope, interface and content decisions) emerges in conversation. Capture it in `PF-NNN-refined-requirement.md`, the source of truth for **what** to build; the plan stays the source of truth for **how**. `/dev` and `/review` follow the same rules when they change it.

- **Where:** next to the plan, in the package that carries most of the work: `backend/docs/{domain}/` or `frontend/docs/{domain}/`. One file per ticket; the other package's plan links to it.
- **Template:** [templates/refined-requirement.md](templates/refined-requirement.md).
- **Who writes it:** only a background agent (`subagent_type: "general-purpose"`, `model: "sonnet"`, or `"haiku"` for a one-line fold-in, `run_in_background: true`). The main loop never edits the file, so it has a single author and no write races.
- **When:** created after the first round of questions, with Status **Refining**, and seeded with everything clarified so far. Updated whenever a decision changes *what* is built: an answer to a clarifying question, a scope change, a new rule or edge case, an interface choice, a content or tier decision, a changed acceptance criterion. Design and implementation chatter does not trigger an update.
- **How to brief an update:** give the absolute path and the decisions, with enough quoted context to stand alone. Tell it to fold each decision into the right section, add a Decision Log row, resolve answered Open Questions, refresh **Last updated**, stay concise, and leave unrelated sections alone.
- **One update agent at a time** per file. If one is still running, batch new decisions into the next update. Wait for the last one to finish before you report.

## Complex flows

A function that stitches several reads or calls together, folds rows in memory, or coordinates writes across the database and an external service is where hidden complexity lives, and such functions tend to grow during implementation. Make every such flow visible before it is built. `/dev` updates the diagram when a flow grows, and `/review` checks that it is still current.

**Complex** means any of:

- one entry point makes three or more queries or external calls, or two whose results are combined conditionally;
- it groups, folds, deduplicates, or merges rows in memory, or picks a winner among candidates;
- its result comes from a decision table with three or more branches;
- it has ordered side effects across the database and an external service, such as a database write, an HTTP call, and an outcome write or a retry;
- it is a process that spans time or a scheduler, such as a failed email being retried later.

Typical examples in this repository: the contact outbox flow (save the message as `PENDING`, call the Resend email API with no transaction open, mark it `SENT` or `FAILED`, retry `FAILED` messages on a schedule); the projects flow (GitHub API call, cache, circuit breaker, and fallback to the last good result or a static list); and visit recording (bot filter, visitor hash, rate limit, then the insert).

**Not complex:** one repository query plus a mapping, plain CRUD, a presentational component, a static content section.

**In the plan**, each complex flow gets a subsection under *Complex flows*, introduced with `> ⚠️ **Review this flow**` and linked from the top of the plan. It contains:

1. A Mermaid `sequenceDiagram` with `autonumber`, from the trigger (an API call, a scheduled job, a page load) through each participant (controller, service, lifecycle bean, PostgreSQL, Resend, GitHub) to the result. It shows each transaction boundary as a `Note`, so it is visible that no transaction spans a network call (Non-Negotiable 7), and the rate-limit, fallback, and failure branches from the failure-modes table as `alt` blocks.
2. Numbered steps matching the diagram's message numbers, each with why it exists (the requirement, decision, or edge case it serves).
3. The simplest alternative, with the behavior that would change.
4. A `flowchart` only when the complexity is branching inside one method, such as the bot filter or the repository filter.

Follow the diagram conventions in `backend/docs/ARCHITECTURE.md`.

## Schema changes

A plan whose migration adds or changes a table, column, constraint, or index shows the schema before it is built, so `/dev` sees the data model at a glance. Section 5 *Database* contains:

1. The migration file name, `V{yyyyMMddHHmmss}__{snake_description}.sql`, and whether the change is additive or needs a backfill or rollout step.
2. A Mermaid `erDiagram` of the new and changed tables, with the existing tables they reference shown by their key columns only. New and changed columns say so in the attribute comment (`"new"`, `"changed: …"`).
3. A column table: `| Table.column | SQL type | Null | Default or constraint | Why |`, with the exact SQL types: `BIGINT GENERATED ALWAYS AS IDENTITY` for keys, `TIMESTAMPTZ` for instants, `VARCHAR(64)` with a hex `CHECK` for hashes (never `CHAR`), and `VARCHAR` with a `CHECK` for statuses.
4. The constraints and indexes, each with its reason: checks, foreign keys, and the index each new query needs. Say which columns hold personal data (a contact email) and confirm that no column holds a raw IP address, a full user-agent string, or a full referrer URL (Non-Negotiable 3).

## Content and disclosure

A ticket that adds or changes public text (a section's copy, a case study, a project card, a page title or meta description) plans its content the way a backend plan plans its schema. For each text block, the plan's content table states:

| Block | Source | Tier | Status |
|---|---|---|---|
| {section or field} | {master CV line, reviewed `../portfolio-content/` draft, or "placeholder"} | A, B (approved on {date}), or B (pending) | {placeholder, draft, approved} |

- The source is the master CV or a reviewed draft; nothing is invented (Non-Negotiable 2). Read the disclosure tiers in `docs/product/product-guide.md` and the content plan section the ticket maps to.
- Tier C never appears, not even in the plan. Tier B ships only once the owner approves that specific item; until then it is a placeholder.
- Each new route gets its `<title>` and meta description in the table.

## Phase 1 — Intake

**Goal:** know what is being asked and what already exists.

1. **Check for existing work.** Look for `backend/docs/**/PF-NNN*` and `frontend/docs/**/PF-NNN*`.
   - A PROGRESS doc means a resume: read its §0 first, confirm the state with the user in two lines, and continue from "What's next".
   - An Approved plan means a revision: ask what changed, set the plan back to **Draft**, and rerun only the phases the change touches.
2. **Resolve the input.**
   - A `PF-NNN` ID: read its row in `docs/prd/backlog.md`, the master plan section it maps to (`../portfolio-implementation-plan.md` for build work, `../cv-portfolio-content-plan.md` for content), and any docs it links to.
   - A plain description: restate it in three to five bullets and propose the next free ID from the backlog.
3. Read the product rules it touches in `docs/product/product-guide.md` (`SITE-NNN`), the relevant entries in `docs/knowledge/`, and enough of the code to ask informed questions.
4. Confirm your understanding, the ticket ID, and the branch name in one short message. On confirmation, register the ticket in the backlog with status Planned and, if you are on `main`, create the branch with `git switch -c <branch>`.

## Phase 2 — Clarify

**Goal:** no open question that would change the design.

1. Ask in rounds of at most four questions, the highest-impact first. Each question names the decision, offers two or three concrete options, and marks a recommended default. Use the question tool when it is available.
2. Cover what applies: the purpose and the audience (a recruiter's 10-second scan, a hiring manager's deep read); inputs, outputs, and limits; validation and failure behavior; the fallback when the API is slow, asleep, or down (Non-Negotiable 1); the disclosure tier of every new public text (Non-Negotiable 2); privacy (Non-Negotiable 3); abuse limits such as rate limits and the honeypot (Non-Negotiable 4); UI states, copy, and the per-page title and meta description; and what is out of scope.
3. After the first round, have the background agent create the refined-requirement doc. Send each later round's answers as one update.
4. Stop asking when the remaining questions would not change the design. Each one stays under Open questions with the default in force.
5. A new or changed product rule goes into `docs/product/product-guide.md` only once the user agrees; until then it is a proposal in the refined requirement.

## Phase 3 — Explore and design

**Goal:** a design that reuses what exists.

1. Read `backend/docs/ARCHITECTURE.md` and `frontend/docs/ARCHITECTURE.md`, and note the principles and `KNOWN-*` entries that apply.
2. Explore the code yourself. Backend: existing services, endpoints, repository methods, error codes, rate-limit and client-info helpers, and the Key Services Reference. Frontend: shared components, feature hooks, query keys, test IDs, content types. Fan out cheap `Explore` agents (`model: "haiku"`) only when the search surface is genuinely broad.
3. Weigh the approaches for duplication, single responsibility, simplicity, consistency, impact on existing behavior, testability, and fit with the free tier (Non-Negotiable 8). The priority is single responsibility, then simplicity, then avoiding duplication, then consistency.
4. Run the evaluation checklist in each affected `ARCHITECTURE.md`. A failing item becomes a risk or a decision in the plan.
5. A design question that changes *what* is built goes back to the user as a Phase 2 question; do not settle it silently in the plan.

## Phase 4 — Write the plan

**Goal:** a plan `/dev` can build without re-deriving anything.

1. Write each plan from the template in its package's `ARCHITECTURE.md`, with Status **Draft**: `backend/docs/{domain}/PF-NNN-{title}.md` and, when the frontend changes, `frontend/docs/{domain}/PF-NNN-{title}.md`. A backend plan always includes the API table with status and error codes, the migration with its schema (see *Schema changes*), the failure-modes table, and a sequence diagram for each complex flow (see *Complex flows*). A frontend plan always includes the states (loading, fallback, error), the test-ID plan, the user flow, and the content table for any public text (see *Content and disclosure*).
2. Trace every row of the requirement analysis to an FR, a rule ID, or a decision. A plan line with no source is either a missing requirement (ask) or scope creep (drop it).
3. Order the build as vertical slices, the smallest demoable one first. For each slice, name the contract `/dev` writes first (migration, records, signatures) and the tests that prove its acceptance criteria, within the test budget: the happy path plus the failure-modes rows that matter. Mark which failure-modes rows get a test. `/dev` hands that list to the test writers, who work in parallel with the implementation.
4. State every new dependency with its reason and its size or memory cost (Non-Negotiable 8).

## Phase 5 — Present and stop

1. Present on one screen: the requirement in three lines; the key decisions; reuse; the schema change with its ER diagram; the content table with tiers; the files to create and modify; risks; open questions with their defaults; each complex flow's sequence diagram with its keep-or-simplify question; and the build order with the tests per slice.
2. **Wait for explicit approval.** For each change requested, update the plan yourself, send any change to *what* is built to the background agent, and present the delta rather than the whole plan again.
3. On approval: set each plan's Status to **Approved {YYYY-MM-DD}**, have the background agent set the refined requirement to **Confirmed**, and link the plan from the backlog row.
4. Report the output paths and the next step: `/dev PF-NNN`, ideally in a fresh session, because the docs now carry the context. Nothing is committed; the docs are committed with the code they describe.
