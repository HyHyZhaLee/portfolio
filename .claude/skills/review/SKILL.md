---
name: review
description: Review this branch's changes before committing - check that the code matches its approved plan and refined requirement, follows the repository conventions and the Non-Negotiables (fallback without the API, disclosure tiers, visitor privacy, abuse limits, free-tier fit), and tests every acceptance criterion. Runs the code-reviewer agent for an independent read, reports verified findings, and fixes only what the user approves; harden adds the hardening wave. Use after /dev, or whenever the user asks to review the current changes.
argument-hint: "[PF-NNN] [harden]"
---

# /review — check the change against the plan and the conventions

> **Where to run.** Every path and command here is relative to this repository's root: the folder with its `CLAUDE.md`, `Makefile`, `backend/`, and `frontend/`. These skills also load when Claude Code starts in the private parent folder, which links them in; in that case run `cd portfolio` once before anything else, and read `CLAUDE.md` there if it is not in context yet.

This is stage 3 of 3: `/plan` decided what to build and how, `/dev` built it, and `/review` checks it before `/create-pr`. **Report first, and change nothing until the user picks the findings to fix.**

**Input:** $ARGUMENTS (a ticket ID, `harden`, both, or empty)

## What counts as a finding

Every finding has a `file:line`; what is wrong, as a concrete failure scenario or the exact rule broken; its **source** (a Non-Negotiable in `CLAUDE.md`, a `.claude/rules/` file, a design-guide principle, checklist item, or `KNOWN-*` entry (`docs/architecture/`), a `SITE-NNN` rule, a plan section, or an `FR-n` or `AC-n`); and a suggested fix.

| Severity | Means |
|---|---|
| **Critical** | Breaks a Non-Negotiable; a bug with a concrete failure; a required integration test missing; an acceptance criterion not met |
| **Warning** | Breaks a written convention or checklist item; a test gap below the gate |
| **Drift** | The code and the plan or refined requirement disagree. Either side may be right; say which one you think should change |

Not a finding: pre-existing issues the change neither introduced nor worsened; anything the compiler, formatter, or linter catches; style preferences that are not written down; speculation without a concrete failure.

## 1. Scope

1. Run `git branch --show-current` and `git status --short`. On a branch other than `main`, the change is `git diff main...HEAD` plus the uncommitted diff (`git diff HEAD`) plus untracked files. On `main`, it is the uncommitted diff plus untracked files.
2. List the changed files, grouped as backend production code, frontend production code, content (`frontend/src/content/`, `docs/product/`), tests, migrations, docs, and `.claude/`. If the change is empty, say so and stop.
3. Find the ticket: the argument, otherwise the branch name (`feature/PF-NNN-…`). Read its plan under `docs/plans/` and its refined requirement. With no ticket or no plan, such as a chore, review against the conventions only and say so.

## 2. Independent read (background)

Start the `code-reviewer` agent now, in the background, with the file list and the base (`main`, or "uncommitted only"). Do not give it the plan or your expectations: its value is a read that is not anchored on yours. With `harden`, skip this step, because the hardening wave runs the agent in its Wave 2.

## 3. Conformance review (main loop, while the agent runs)

Read the whole change, then check each item for the files it covers:

1. **Plan conformance.** Every unit, endpoint, error code, migration, and content block the plan names exists with that name and shape. Nothing significant exists that the plan does not name. The plan's diagrams match the code: each sequence diagram follows the real call order and transactions, and the ER diagram and column table match the migration.
2. **Requirement coverage.** Map each `FR-n` and `AC-n` to the code that implements it and the test that proves it. An acceptance criterion without a test is a finding.
3. **Conventions.** For each changed file, the matching `.claude/rules/` file plus the evaluation checklist and the `KNOWN-*` entries in the package's design guide (`docs/architecture/backend.md` or `docs/architecture/frontend.md`). Backend: layering, the command shape, transaction boundaries, `ApiException` and `ErrorCode`, properties records under `app.*`, migration naming. Frontend: the feature-folder shape, generated API types only, query keys from the feature's factory, loading, fallback, and error states, test IDs, `t()` strings, accessible names, and the per-page title and meta description.
4. **Complex flows** (definition in `.claude/skills/plan/SKILL.md`, *Complex flows*): every complex function has a current diagram, and every step serves a reachable case.
5. **Loops and effects.** Exit conditions are reachable, retries (the email retry job, the GitHub circuit breaker) and polling are bounded, effects do not re-trigger themselves, subscriptions and listeners are cleaned up, and no service calls form a cycle.
6. **Concurrency and persistence.** Every new write handles concurrent modification where two writers are possible (a constraint, a conditional update, or a lock); the retry job claims each message with a status compare-and-set so two runs never send it twice; no check-then-act on shared state.
7. **Privacy, disclosure, and free-tier audit.**
   - [ ] **Fallback (NN1):** every API-backed section shows content or a fallback when the API is slow, asleep, or down; no page waits for the API before showing content;
   - [ ] **Disclosure (NN2):** every new public text traces to the master CV or an owner-approved draft, Tier B text is approved item by item, and no Tier C content appears anywhere in the change; run the disclosure scrub described in `.claude/skills/create-pr/SKILL.md` against the change and report only the count;
   - [ ] **Privacy (NN3):** no raw IP address, full user-agent string, or full referrer URL is stored or logged; the visitor hash is keyed with the server secret; no tracking cookie; `?notrack=1` and Global Privacy Control are honored;
   - [ ] **Abuse (NN4):** every public write endpoint has server-side validation and a per-visitor rate limit, and the contact form keeps its honeypot;
   - [ ] **Errors (NN5):** failures throw `ApiException` with an `ErrorCode`; no framework, SQL, or provider text reaches a response;
   - [ ] **Network I/O (NN7):** no transaction spans a call to the email provider or the GitHub API; the write order is `PENDING`, call, outcome;
   - [ ] **Free tier (NN8):** nothing is written to the local disk, email goes over HTTPS, the Hikari pool stays small, and every new dependency is justified in the plan;
   - [ ] **Secrets and personal data (NN9):** no secret, real email, or message content in code, logs, fixtures, docs, or commits.
8. **Tests and contract.** The integration-test gate (in `docs/architecture/backend.md`) is met. After an API change, `backend/openapi/openapi.json` and `frontend/src/api/schema.d.ts` are part of the change. Judge tests against the test budget in `.claude/skills/dev/SKILL.md`: a missing test for an acceptance criterion or a marked failure-modes row is a finding, and a test the budget skips on purpose is not.
9. **Docs.** The plan's **Last updated** is current; the refined requirement's Open Questions are resolved or explicitly deferred; changed Markdown follows `.claude/rules/docs-conventions.md`; new knowledge entries follow `docs/knowledge/README.md`.
10. **Compile.** `./backend/gradlew -p backend assemble testClasses` and `scripts/with-node.sh pnpm --dir frontend check:type`, for the packages touched. Running the full test suites is the job of `make check` and `/create-pr`.

## 4. Verify and merge

When the agent returns, open every line it cites and keep a finding only if it holds against the code. Merge duplicates with your own findings, and mark the ones only the agent found.

## 5. Report

1. **Verdict:** **Ready for `/create-pr`** when there is no Critical finding and no Drift; otherwise **Fix first**, with the counts.
2. **Findings:** `| # | Severity | file:line | Finding | Source | Fix |`, Critical first.
3. **Acceptance criteria**, when there is a refined requirement: `| AC | Implemented in | Test | ✓ or ✗ |`.
4. **Checked and clean:** one line naming what passed, including the scrub count.

Then ask which findings to fix: all, some by number, or none. Give a recommendation for each judgment call.

## 6. Fix (only what the user approved)

1. Apply minimal fixes on the main loop. A fix that changes a public name, an endpoint, an error code, the schema, public text, or *what* is built follows the *Deviations* table in `.claude/skills/dev/SKILL.md`: update the plan, and brief the background agent for the refined requirement.
2. Re-run the compile checks and the scoped tests for what changed: `./backend/gradlew -p backend testUnit --tests`, `./backend/gradlew -p backend testIT --tests`, or `scripts/with-node.sh pnpm --dir frontend test --run <file>`.
3. Re-check the fixed lines once, then report each finding as fixed, skipped, or deferred. Record each deferred one in the plan's risks or in the PROGRESS doc's open questions.
4. Once the verdict is Ready and every acceptance criterion is covered, set the ticket to Done in `docs/prd/backlog.md`, so the status ships in the same commit. Then point the user to `/create-pr`.

## Harden

Run the [hardening wave](hardening-wave.md) when the user passes `harden`, or offer it when the change is large, such as a new feature with its own table or more than about 15 production files. The wave mutates code, so it runs only on that explicit request. It replaces step 2, runs the step 3 conformance review alongside its Wave 2, and ends with its own docs and checkpoint wave after step 6.
