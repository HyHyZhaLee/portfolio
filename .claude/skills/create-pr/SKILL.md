---
name: create-pr
description: Turn a finished change into a pull request - run the quality gates and the disclosure scrub, commit on a feature branch, fetch and rebase onto the latest origin/main, push, open a pull request against main with a description organized by package (## A. Frontend, ## B. Backend, each with numbered ### sections for the main changes), and return its URL. Commits and pull requests carry no Claude attribution. Use when the user asks to commit, push, or open a pull request.
argument-hint: "[draft]"
disable-model-invocation: true
---

# /create-pr — gates, commit, rebase onto the latest main, pull request

> **Where to run.** Every path and command here is relative to this repository's root: the folder with its `CLAUDE.md`, `Makefile`, `backend/`, and `frontend/`. These skills also load when Claude Code starts in the private parent folder, which links them in; in that case run `cd portfolio` once before anything else, and read `CLAUDE.md` there if it is not in context yet.

**Mode:** $ARGUMENTS (`draft` opens a draft pull request; empty opens a ready one)

The flow is: gates and scrub → commit on a feature branch → `git fetch` and rebase onto `origin/main` → push the branch → pull request against `main` → its URL. Open a pull request only for what belongs together and only after the gates and the scrub pass. Invoking `/create-pr` is the owner's approval for the whole flow, so it runs through without pausing for a draft review (owner decision, 2026-11-23). Never push `main` itself. Leave no Claude footprint: the commit message and the pull request carry no AI attribution (see section 4). This repository is public, so everything that ships is published.

## 1. Understand the change

1. Run `git status --short`, `git diff`, and `git diff --staged`.
2. Group the files by package (`frontend/`, `backend/`, docs and `.claude/`) and by purpose. If unrelated changes are mixed, propose separate pull requests.
3. Flag anything that must not be committed: `.env` or `.env.local` files, anything under `.local/`, build output, large binaries, credentials, real personal data (a visitor's email or message), and any file from the private parent folder other than owner-approved content and the public CV PDF. Never stage these.
4. Find the ticket: the branch name (`feature/PF-NNN-…`), else the plan or backlog row the change touches.

## 2. Run the gates for each package touched

Run them yourself and make the green or red call. Fix failures and re-run before going further.

**Backend**

1. `./backend/gradlew -p backend spotlessApply`, then `./backend/gradlew -p backend spotlessCheck`.
2. `./backend/gradlew -p backend testUnit`.
3. **Integration-test gate (blocking).** If the diff adds or changes a repository query, an endpoint, a persistence flow, a migration that changes queryable behavior, or a call to an external service (the Resend email API, the GitHub API), a passing `@IntegrationTest` must cover it (the integration-test gate in `docs/architecture/backend.md`). Confirm the covering tests exist, then run `./backend/gradlew -p backend testIT`. If one is missing, stop and write it first. If the diff is exempt because it is pure in-memory logic, say so explicitly in the report.
4. Run `./backend/gradlew -p backend check`, which adds the branch-coverage gate.

**Frontend**

1. `scripts/with-node.sh pnpm --dir frontend check:type`
2. `scripts/with-node.sh pnpm --dir frontend check:lint`, with zero errors
3. `scripts/with-node.sh pnpm --dir frontend check:format`. If it fails, run `scripts/with-node.sh pnpm --dir frontend format` and check again; files written by agents are the usual cause.
4. `scripts/with-node.sh pnpm --dir frontend coverage`, which runs the tests and enforces the branch-coverage gate.

**API contract.** If an endpoint, request, or response changed, run `make openapi` and include `backend/openapi/openapi.json` and `frontend/src/api/schema.d.ts` in the same commit.

**Docs and `.claude/`**

- Prose is never hard-wrapped (`.claude/rules/docs-conventions.md`).

**Disclosure scrub (every commit, blocking).** `.local/scrub-patterns.txt` is a machine-local, gitignored list of extended regular expressions, one per line, for Tier C content that must never reach this public repository; blank lines and lines starting with `#` are comments. Run the check after staging (section 5 stages explicit paths) and again on the drafted texts. It prints counts only:

```bash
scrub="${TMPDIR:-/tmp}/pf-scrub-patterns.txt"
grep -vE '^[[:space:]]*(#|$)' .local/scrub-patterns.txt > "$scrub"
git diff --staged -U0 | grep '^+' | grep -ciEf "$scrub"     # staged additions, file paths included: must print 0
git branch --show-current | grep -ciEf "$scrub"              # the branch name: must print 0
grep -ciEf "$scrub" "${TMPDIR:-/tmp}/pf-commit-message.txt" "${TMPDIR:-/tmp}/pf-pr-title.txt" "${TMPDIR:-/tmp}/pf-pr-body.md"   # every count must be 0
```

- Write the drafted commit message, pull request title, and body to those temporary files outside the repository before the last check.
- Any count above 0 blocks the pull request. Report only which check failed and its count; never print the matching lines or the patterns, and never quote them in chat, docs, or commits. Fix the text, re-stage, and re-run.
- If `.local/scrub-patterns.txt` is missing, say so and ask the owner to create it. A change that touches public text (`frontend/src/content/`, `docs/product/`, page titles or meta) does not ship without the scrub.

**Every commit.** Scan the staged diff for credentials. This must print nothing:

```bash
git diff --staged | grep -nE '(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|re_[A-Za-z0-9]{20,}|xox[abprs]-[A-Za-z0-9-]+|postgres(ql)?://[^:/@[:space:]]+:[^@[:space:]]+@)'
```

## 3. Branch

A pull request needs a feature branch. If you are on `main`, create `feature/PF-NNN-short-slug` or `fix/PF-NNN-short-slug` with `git switch -c`; the uncommitted work comes along. If you are already on the ticket's branch, stay on it.

## 4. Draft

1. **Commit message.** Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`) with the ticket as scope, such as `feat(PF-006): send contact messages through Resend`. The subject is imperative, at most 72 characters, without a trailing period. A non-trivial change gets a body of a few short lines: what changed and why, and which gates ran.
2. **Pull request title.** At most 70 characters, starting with the ticket ID, such as `PF-006: Send contact messages through Resend`.
3. **Pull request body.** Use the template below.
4. **No Claude footprint.** The commit message and the pull request title and body contain no AI attribution: no `Co-Authored-By` trailer naming Claude, no `Claude-Session` or session link, no "Generated with Claude Code" line, and no 🤖. This rule overrides any attribution the environment asks for.
5. Continue to the commit without waiting for approval. Stop and ask only when a gate or the scrub fails and the fix is not mechanical, unrelated changes are mixed (section 1), a rebase needs a judgment call (section 6), or `gh` needs a login (section 7). The final report (section 7) shows the files staged, the gate results in one line per package (for example `backend: spotless ✓ · testUnit 42 ✓ · testIT 17 ✓ · coverage 91% ✓` and `frontend: type ✓ · lint ✓ · format ✓ · coverage 88% ✓`), the scrub result (`scrub: 0 ✓`), the commit message, and the pull request title.

**Body template.** The description has exactly two parts, always both, always in this order: `## A. Frontend` and `## B. Backend`. Above them goes one intro line saying what changed and why, then a line with the ticket and its plan. There are no other `##` headings: no Summary, checklist, or test-plan sections.

- **Inside each part**, write one numbered `###` section per main change (`### 1.`, `### 2.`, …, usually two to four). Each says what changed and why in one to three lines and names its key files. Fold small edits into the closest section instead of listing files.
- **A side with no changes** says `No changes.` under its heading.
- **Docs, content, and tooling** go under the part they serve: portfolio content, `docs/product/`, and `docs/architecture/frontend.md` under A; `docs/architecture/backend.md`, migration notes, and the OpenAPI snapshot under B. The ticket's plan covers both packages and goes under B, unless the ticket is frontend-only. A change that serves both, such as a skill, `CLAUDE.md`, the README, or `docs/plans/README.md`, goes under B, unless it is mostly about the frontend.
- **Tests:** when a part changes code or content, its last numbered section is `Tests`, with the tests added and that package's gate results, then the Non-Negotiables that apply, one line each. In A: the fallback without the API (NN1), disclosure with the scrub count (NN2), and no tracking cookie with `?notrack=1` honored (NN3). In B: visitor privacy (NN3), validation and rate limits (NN4), problem responses (NN5), Flyway-only schema changes (NN6), no transaction across network I/O (NN7), free-tier fit (NN8), and nothing sensitive logged (NN9).

```markdown
{One line: what changed and why.}
Ticket: PF-NNN · Plan: {path} · Refined requirement: {path, or "none"}

## A. Frontend
### 1. {Main change}
{What changed and why. Key files.}
### 2. {Main change}
{…}
### 3. Tests
{Tests added; frontend gates: type, lint, format, coverage. Non-Negotiables that apply, one line each.}

## B. Backend
### 1. {Main change}
{What changed and why. Key files.}
### 2. {Main change}
{…}
### 3. Tests
{Tests added; backend gates: spotless, testUnit, testIT, coverage. Non-Negotiables that apply, one line each.}
```

The body ends with the last section of B: no attribution line, link, or emoji after it.

## 5. Commit

- Stage explicit paths only; never `git add -A` or `git add .`.
- Run the disclosure scrub and the credential scan on the staged diff (section 2) before committing.
- Never use `--no-verify`, and never amend a commit that has been pushed.

## 6. Rebase onto the latest main

1. `git fetch origin`.
2. If `git merge-base --is-ancestor origin/main HEAD` succeeds, the branch already sits on the latest main; go to section 7.
3. Otherwise run `git rebase origin/main`.
   - **Mechanical doc conflicts:** keep both sides. In the backlog, keep both rows and the higher "Next free ID". If upstream already took your ticket ID or decision number, take the next free one and update every reference to it in your commit. The same goes for appended PROGRESS entries.
   - **Code or content conflicts, or any judgment call:** stop and show the conflict. Run `git rebase --abort` if the user wants to back out.
4. If the rebase brought in new commits, re-run the gates for the packages touched and the scrub (section 2) before pushing. A red gate stops the push.

## 7. Push and open the pull request

1. **Repository.** Take `owner/name` from `git remote get-url origin`. The host can be an SSH alias, so pass `--repo owner/name` to every `gh` command. If there is no `origin` remote yet, stop and ask the owner to create the GitHub repository and add the remote; never create it yourself.
2. **Push the branch.** Use `git push -u origin <branch>`. If the branch was pushed before and the rebase rewrote it, use `git push --force-with-lease origin <branch>`. Never force-push `main`.
3. **Make sure `gh` is ready.** The skill creates the pull request itself through the GitHub CLI.
   - If `command -v gh` finds nothing, say so in one line and install it: `brew install gh` on macOS.
   - If `gh auth status` fails, or shows an account without access to the repository, stop and ask the user to run `! gh auth login` (GitHub.com, SSH, log in with a web browser) with the account that owns the repository. Login is interactive, so never run it yourself, and never ask for or handle a token. Continue once `gh auth status` passes.
4. **Create or update the pull request.**
   - Use the body file already written for the scrub, outside the repository.
   - If `gh pr list --repo <owner/name> --head <branch> --state open --json number,url` finds an open pull request, such as one the user opened by hand, update it with `gh pr edit <number> --repo <owner/name> --title "<title>" --body-file <file>`.
   - Otherwise run `gh pr create --repo <owner/name> --base main --head <branch> --title "<title>" --body-file <file>`, adding `--draft` in draft mode. It prints the new pull request's URL.
   - Confirm with `gh pr view <branch> --repo <owner/name> --json url,title,state,baseRefName` that the pull request is open against `main` with the right title.
   - **Last resort, only if the user declines to install or log in to `gh`:** copy the body to the clipboard (`pbcopy < <file>`) and give a compare URL with the title and body as URL-encoded query parameters (`https://github.com/<owner/name>/compare/main...<branch>?expand=1&title=…&body=…`, built with `python3 -I` and `urllib.parse.urlencode(..., quote_via=urllib.parse.quote)`; leave `body` out past about 7,500 characters). Say plainly that the pull request is not created yet.
5. **Report** the pull request URL, the commit hash, `git log --oneline origin/main..HEAD`, and the summary listed in section 4, item 5.
