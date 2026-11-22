# Hardening wave

Run this from `/review harden`, or from `/review` when the change is large and the user agrees. A scope hint, such as "backend only" or a ticket ID, narrows it.

You orchestrate a hardening pass over the **current change only**: the files `/review` step 1 listed. Nothing outside them is in scope.

## Setup (main loop)

1. Start from the file list of `/review` step 1, with production code and existing tests listed separately. This list is the scope you hand to every agent.
2. Apply the scope hint, if there is one. If the change is empty, stop and say so.
3. Track the waves in a visible task list.

Give every dispatched agent an explicit `model`; never let one inherit the session's model. Wave 1 mutates production code, so it runs alone and finishes before anything reads the code. Wave 2's agents are safe to run in parallel because one writes only tests and the other only reads. Wave 3 runs last so the checkpoint reflects the final state.

## Wave 1 — Literals (mutating, runs alone)

One `general-purpose` agent with `model: "sonnet"`, scoped to the changed production files. Tell it to:

- find hard-coded values used as identifiers or configuration: error codes, status values, header names, property defaults, rate limits, cache lifetimes, length limits, test IDs, user-facing strings, repeated numbers;
- reuse an existing constant, enum, property, `ErrorCode`, `TestIds` entry, or i18n key before defining anything new, and put new ones in the conventional place: an enum or constants holder next to its owner, a `@ConfigurationProperties` default under `app.*`, `frontend/src/config/test-ids.config.ts`, or `frontend/src/i18n/en.ts`;
- leave long-form portfolio content in `frontend/src/content/`; it is content, not a literal to extract;
- make mechanical substitutions only, with no behavior change, and list deliberate skips such as `0`, `1`, empty strings, and log-only text;
- re-run `./backend/gradlew -p backend spotlessApply assemble testClasses` and `scripts/with-node.sh pnpm --dir frontend check:type` for the packages touched, and report the substitutions.

Check its substitutions on the main loop, and refresh the file list before Wave 2.

## Wave 2 — Tests and review (two agents in parallel, in one message)

**2a. Tests.** One `general-purpose` agent with `model: "sonnet"`, writing **test files only**. Tell it to:

- bring the changed code to at least 80% branch coverage, covering the happy paths and the boundary, fallback, and failure cases the diff introduces;
- meet the integration-test gate (in `backend/docs/ARCHITECTURE.md`) and never defer a required integration test; if Docker is unavailable, write the test anyway and report that it did not run;
- stub the Resend and GitHub APIs with WireMock, use synthetic data only, and never call a real external service;
- run what it writes, scoped with `./backend/gradlew -p backend testUnit --tests`, `./backend/gradlew -p backend testIT --tests`, or `scripts/with-node.sh pnpm --dir frontend test --run <file>`;
- report real bugs it finds instead of changing production code.

**2b. Review.** The `code-reviewer` agent on the full change, read-only, with the same base `/review` uses. It checks against `CLAUDE.md`, `.claude/rules/`, and both `ARCHITECTURE.md` files, including the privacy, disclosure, and free-tier checklist, and reports high-confidence findings only.

While both run, the main loop does the conformance review from `/review` step 3. When both return, continue with `/review` steps 4 to 6: verify and merge the findings, counting real bugs from 2a as findings, report them, and apply only the fixes the user approves.

## Wave 3 — Docs and checkpoint (main loop, last)

1. Sync the plan docs with what was built: names, schema, endpoints, error codes, flows, diagrams, and the content table.
2. Capture verified new knowledge in `docs/knowledge/` following its README; write nothing if nothing new was learned.
3. Write or update `PF-NNN-PROGRESS.md` §0 from `.claude/skills/dev/templates/progress.md`: what the wave did, the current test state, open items (deferred findings, bugs, tests that could not run locally, Tier B placeholders), and the single next step.

## Summary

Report the literals replaced and skipped; coverage per package and the tests added, including integration tests and whether they ran; review fixes applied versus deferred; and the docs synced, with the checkpoint location. Remind the user that nothing was committed; `/create-pr` is the next step.
