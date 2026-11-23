---
name: dev
description: Build a PF ticket from its approved plan - load the plan and refined requirement, implement slice by slice while background test writers write the tests in parallel, keep the tests within the test budget, keep the plan in sync, capture knowledge, and hand off to /review. Requires a plan approved through /plan. Use when the user asks to implement, build, or continue a planned ticket.
argument-hint: "PF-NNN"
disable-model-invocation: true
---

# /dev — build from the approved plan

> **Where to run.** Every path and command here is relative to this repository's root: the folder with its `CLAUDE.md`, `Makefile`, `backend/`, and `frontend/`. These skills also load when Claude Code starts in the private parent folder, which links them in; in that case run `cd portfolio` once before anything else, and read `CLAUDE.md` there if it is not in context yet.

You are a senior engineer building one approved plan in this repository. This is stage 2 of 3: `/plan` decided what to build and how, `/dev` builds it, and `/review` checks it. The plan is your contract: build what it says, in its order, and surface every deviation instead of absorbing it.

**Input:** $ARGUMENTS

## Working model

This is a solo, part-time project, so each slice should be small enough to finish in one sitting. Speed comes from parallel work and lean tests, not from shortcuts in the production code.

Do the hands-on work yourself, on the main loop: reading, implementation, and the plan sync. You hold the full context, so inline work is faster and more accurate than briefing a sub-agent.

Delegate only these, all in the background and on a cheaper model (table in `CLAUDE.md`):

- **Test writers**, side by side with you. As soon as a slice's contract compiles, they write and run its tests from the plan while you write the implementation. See Phase 2.
- **Refined-requirement maintainer**, only when the user agrees to change *what* is built. It is the only author of that file; follow the rules in `.claude/skills/plan/SKILL.md`, *Refined requirement doc*.

Dispatch anything else only when it would flood your context with output, such as long logs, or when it is genuinely independent work that can run while you continue.

## Test budget

Tests prove the acceptance criteria and the Non-Negotiables and keep branch coverage at or above 80% per package, nothing more. Exhaustive tests cost time a part-time project does not have. Per slice:

- **Integration** (`@IntegrationTest`: one shared Spring context with a Testcontainers PostgreSQL, `RestTestClient`, no `@MockitoBean`): one test for each endpoint's happy path, plus one for each failure-modes row the plan marks with a test. Typically that is invalid input (400 `VALIDATION_FAILED`), a rate limit (429 `RATE_LIMITED`), and an upstream outage that must fall back, such as the GitHub API being down while `GET /api/v1/projects` still answers 200 from its fallback.
- **External HTTP:** the Resend email API and the GitHub API are stubbed with WireMock in integration tests. No test ever calls a real external service.
- **Unit** (no Spring): only for pure logic with branches, such as visitor hashing, the bot filter, ref-tag parsing, user-agent parsing, and the GitHub repository filter. Use a small table of about five cases that covers the edge cases the plan names.
- **Frontend** (Vitest, Testing Library, MSW): the success, fallback (API down or slow), and problem-response paths of every hook, plus the main interaction of each section, such as submitting the contact form. A static content section needs only a render test that proves it shows without the API.
- **Skip:** mock-heavy service tests that repeat an integration test, tests of Spring or library behavior, test builders and helper frameworks, large parameterized matrices, concurrency stress tests, snapshot tests, and chasing coverage past the 80% gate.
- **Shape:** each test file stays short (about 150 lines), uses synthetic data built inline (`visitor@example.com`, invented names), asserts on the problem `code` and the status, and runs in seconds.

## Principles

- The plan and the refined requirement are the source of truth. Do not re-derive or re-open decisions recorded there.
- Understand the code before changing it.
- Build the smallest working vertical slice first, and keep the repository compiling after every step.
- Track the slices in a visible task list.
- Keep the plan, the refined requirement, and the code in sync.
- Public text comes only from the plan's content table: the master CV or an owner-approved draft. Never write new claims, numbers, or Tier B text that the plan does not list as approved (Non-Negotiable 2).
- Save progress before the context runs out (see *Progress handoff*).

## Deviations

| The change | What to do |
|---|---|
| Inside the plan's intent: a private helper, a file split, a local rename | Do it, and update the plan in the same turn if the plan names the thing |
| A public name, an endpoint, an error code, the schema, or a new dependency | Stop and propose it; on agreement, update the plan |
| *What* is built: a rule, an edge case, scope, public text, an acceptance criterion | Stop and ask; on agreement, update the plan and brief the background agent for the refined requirement |
| A complex flow gains a query, a call, a branch, or an in-memory step | Update its diagram and tell the user before building on top of it |
| Something is harder than the plan assumed | Stop and discuss it with the user |

## Progress handoff

A long feature rarely fits one context window, and each compaction blurs early decisions. Prefer ending a saturated session and resuming from a file over riding through many compactions.

- **Trigger:** when context is running low, after the first compaction, or at a natural break such as a finished slice, offer to write `PF-NNN-PROGRESS.md` and continue in a fresh session. Do not wait to be asked.
- **Where:** next to the plan, in `docs/plans/{domain}/`. **Template:** [templates/progress.md](templates/progress.md).
- **Who:** the main loop writes it, because it is a snapshot of your own working state.
- **On resume:** read §0 first, then the docs it points to. Confirm the state with the user in two lines, then continue from "What's next".

## Phase 1 — Load

**Goal:** start building from the approved plan, on the right branch.

1. **Check for a resume first.** Look for `docs/plans/**/PF-NNN*-PROGRESS.md`. If one exists, follow *Progress handoff* and skip whatever it already covers.
2. **Find the docs.** Read the ticket's plan under `docs/plans/` and its refined requirement in full, plus the `KNOWN-*` entries and rules they cite.
3. **Gate.** The plan's Status must be **Approved**. If there is no plan, or it is Draft, stop and point the user to `/plan PF-NNN`. A plain feature description instead of a ticket ID also goes to `/plan`. A plan written before the Status field existed needs the user's explicit confirmation that it is approved.
4. **Branch.** Work on the ticket's branch. If you are on `main`, propose `feature/PF-NNN-short-slug` or `fix/PF-NNN-short-slug` and create it on confirmation.
5. Set the ticket's status to In progress in `docs/prd/backlog.md`.
6. State in at most six lines the slices in build order, the first slice's files, the test writers you will start for it, and anything in the plan that the current code contradicts. Then start; stop first only if the plan is stale.

## Phase 2 — Build (you and the test writers, side by side)

**Goal:** the approved plan, built one slice at a time, with each slice's tests written while you write its implementation.

For each slice, in the plan's order:

1. **Contract first (you, a few minutes).** Write what the tests compile against: the migration, the entity, the request and response records, the `ErrorCode` entries, and the public service and controller signatures the plan names. A method body may start as `throw new UnsupportedOperationException("PF-NNN: not built yet")`. Run `./backend/gradlew -p backend spotlessApply assemble testClasses` so the contract compiles. For a frontend slice, the contract is the regenerated `schema.d.ts`, the feature's `types.ts` and `api.ts` signatures, the strings, the content types, and the test IDs from the plan's frontend section.
2. **Start the test writers at once, in one message**, with the brief below: `subagent_type: "general-purpose"`, `model: "sonnet"` (or `"haiku"` for a small mechanical slice), `run_in_background: true`. A backend slice usually needs one writer for the integration tests, plus a second for unit tests only when the slice has pure logic with branches. A frontend slice needs one. Each writer owns the test files named in its brief, and no file has two writers. Keep backend and frontend writers in separate waves, and at most about four agents at once.
3. **Implement the bodies while they write.** Follow the plan; do not edit the test files they own. After each layer, check with `./backend/gradlew -p backend assemble`, which compiles only production code and runs no formatter, so a half-written test file cannot break it, and which never reformats a file a writer is editing. In a frontend slice, run `scripts/with-node.sh pnpm --dir frontend check:type` and ignore errors in the writer's test files until it reports.
4. **Converge.** When the writers have reported and your implementation is done, run `./backend/gradlew -p backend spotlessApply assemble testClasses` (or the frontend `format` and `check:type`), then run their tests scoped yourself. Sort each failure: unfinished production code (finish it), a real bug (fix the production code), or a test that contradicts the plan (fix the test). Never bend a test to match code that contradicts the plan; that is a deviation (see the table).
5. Handle every departure from the plan through the *Deviations* table, in the same turn.
6. **Loop safety.** For every loop, recursion, retry, poll, scheduled job, and React effect: the exit condition is reachable, the loop variable progresses toward it, retries (the email retry job, the GitHub circuit breaker) and polling are bounded, and effects do not re-trigger themselves.
7. After an API change, run `make openapi` so the snapshot and the generated frontend types travel with the change; that also unblocks the frontend slice's contract.

**Test writer brief.** Fill in the braces and send it as the prompt:

```text
You write tests for PF-NNN slice {n} in {absolute path of the repository root}. The main agent is writing the production code at the same time, so the bodies may still throw UnsupportedOperationException; write against the plan, not against the current bodies.

Plan: {absolute path of the plan}. Refined requirement: {absolute path}. Read sections {API, failure modes, database, complex flows, states} first.
Contract that compiles now: {files and signatures}.
Write only these files: {test file paths}. Never edit production code or any other test file.
Cover: {acceptance criteria and failure-modes rows, one per line, each with the expected status and problem code, or for the frontend the expected state}.
Follow the existing patterns: {for example an existing *ApiIT for an endpoint, an existing *Test for a unit test, an existing *.test.tsx for a hook}. Integration tests use @IntegrationTest, RestTestClient, and no @MockitoBean; the Resend and GitHub APIs are stubbed with WireMock and never called for real. Frontend tests use renderWithProviders and MSW.

Test budget: tests prove the acceptance criteria and the Non-Negotiables and keep branch coverage at 80%, nothing more. Keep them lean: the happy path plus the listed failure rows, a small table of cases for pure logic, synthetic data inline (visitor@example.com, invented names), assertions on status and problem code, each file about 150 lines at most. No test builders, no large parameterized matrices, no mock-heavy service tests that repeat an integration test, no tests of framework behavior, no calls to real external services.

When done, run your tests once, scoped: {./backend/gradlew -p backend testIT --tests "<Class>" | ./backend/gradlew -p backend testUnit --tests "<Class>" | scripts/with-node.sh pnpm --dir frontend test --run <file>}. Do not run spotlessApply or the frontend format script; the main agent formats everything when it converges. If the build fails because production code is mid-edit, or a Gradle lock is held, say "not run" and give the command. Report each failure as: not built yet (UnsupportedOperationException), a real bug (what the plan expects versus what happened), or your own test error (fix it). Never bend a test to pass. Never read or print .env or .env.local, and never read files outside the repository.
```

## Phase 3 — Hand off

**Goal:** a change that `/review` can check against the plan without surprises.

1. **Checks.** `./backend/gradlew -p backend assemble testClasses` and `scripts/with-node.sh pnpm --dir frontend check:type` pass for the packages touched. Every test writer has reported, you have run each slice's tests scoped after finishing its implementation, no `UnsupportedOperationException` stub is left, and any test still red is listed. Do not start dev servers or full test suites unless the user asks; `make check` and `/create-pr` run them.
2. **Sync.** The plan matches the code: names, schema, endpoints, error codes, flows, diagrams, and the content table, with **Last updated** refreshed. The refined requirement reflects the behavior built, and its Open Questions are empty or explicitly deferred. Send one last update to the background agent if needed.
3. **Capture knowledge** without asking. Record only facts that were **verified during this session** and are **not already documented**: library, tool, or hosting provider behavior, constraints, and quirks that cost time. Follow the format in `docs/knowledge/README.md`, and append to the most relevant file. Do not record speculation, how this ticket was implemented (the plan holds that), or transient state. Product rules are not knowledge: propose them for `docs/product/product-guide.md` in the summary, and write them only after the user agrees. If nothing new was learned, write nothing and say so.
4. **Summary.** Report what was built, slice by slice; each deviation and where the plan now records it; the complex flows with links to their diagrams, or "none"; the files changed, grouped as code, tests, content, plan and requirement docs, and knowledge; the tests added and their last result; and any follow-ups, including Tier B placeholders still waiting for approval.
5. **Next step:** `/review PF-NNN`. Nothing is committed yet.

## Live verification (only when the user asks)

- Local only: `http://localhost:5173` and `http://localhost:8080` (Swagger UI at `/swagger-ui.html` in the local profile, and curl). Production is checked only when the owner asks, and only read-only (`.claude/rules/security.md`).
- Run `scripts/check-services.sh` first; it is read-only and shows what is running and who holds the ports. Ask the user to start what is missing (`make up`, `make backend`, `make frontend`), or use the `backend` and `frontend` configurations in `.claude/launch.json`. Never start `bootRun` while a Gradle test task is running.
- Drive the browser with the available browser tools, or call the API through Swagger UI or curl, use synthetic data only, check the console for errors, and check the fallback by stopping the backend: the content must still show (Non-Negotiable 1). Report what you saw, including anything that failed.

## Commit and push rules

- Commit, push, and open a pull request only when the user asks, through `/create-pr`. It runs the gates, including the blocking integration-test gate and the disclosure scrub, commits on the feature branch, rebases onto the latest `origin/main`, and opens the pull request once the user approves the draft.
- Never commit to or push `main` unless the user explicitly says so.
- Plan, refined-requirement, PROGRESS, and knowledge docs are committed with the code they describe.
