# CLAUDE.md — Portfolio

## Response Style

Default to short, direct answers. Expand for design discussions, debugging, and trade-off analysis, or when asked. Lead with the decision or the result, then the reasoning.

## Compact Instructions

When the conversation is compacted, keep enough to continue in this session without re-discovery. Treat the summary like the §0 CURRENT STATE of a `PF-NNN-PROGRESS.md` (template: `.claude/skills/dev/templates/progress.md`). Preserve, in priority order:

- **Active work and goal**: the `PF-NNN` ticket in flight, and what "done" means
- **Current state**: what is built or changed so far, and what comes next, in order
- **Decisions and why**: design, scope, content, and rule choices reached in conversation, with their rationale
- **Gotchas and constraints**: traps hit, non-obvious rules, things that must not regress
- **Resume recipe**: branch, build and test state, commands to re-run, key files as `path:line`
- **Open questions**: anything still awaiting a decision

Drop verbose tool output, file dumps, and superseded reasoning. Point at the plan, refined-requirement, and PROGRESS docs instead of copying them.

## Overview

This repository is Will Ly's public portfolio site, built as a live full-stack demo for Full-stack Software Engineer applications. A React frontend on Vercel shows the portfolio content, which is static and always loads. A Spring Boot backend on Render counts visits, receives contact messages, and lists public GitHub projects. A Neon PostgreSQL database stores the data. Everything runs on free tiers. The site itself is part of the pitch, so its code, tests, and docs are held to production standards.

It is under construction: `docs/prd/backlog.md` says what exists today.

**Private workspace.** This repository sits inside a private CV folder that is not part of the repository. Two files there are the master plans: `../portfolio-implementation-plan.md` (how the site is built; it wins on build and architecture) and `../cv-portfolio-content-plan.md` (what content goes where and the disclosure tiers; it wins on content). Agents may read those two plans, and reviewed text from `../portfolio-content/` once the owner approves it. Never read, quote, or copy any other file from the parent folder.

## Project Structure

| Path | What it is | Read |
|---|---|---|
| `backend/` | Java 21, Spring Boot 4, Gradle 9, REST + OpenAPI, PostgreSQL + Flyway; the visits, stats, contact, and projects APIs _(planned, PF-002)_ | `backend/CLAUDE.md`, `backend/docs/ARCHITECTURE.md` |
| `frontend/` | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, API types generated from OpenAPI _(planned, PF-002)_ | `frontend/CLAUDE.md`, `frontend/docs/ARCHITECTURE.md` |
| `docs/` | Product rules and disclosure tiers, cross-package architecture, ADRs, knowledge base, backlog | `docs/README.md` |
| `scripts/` | Helper scripts for people and agents (`with-node.sh`, `check-services.sh`, `free-port.sh`) | the script headers |
| `.claude/` | Skills, path-scoped rules, the `code-reviewer` agent, launch and permission settings | this file |

Local ports: backend `8080`, frontend `5173`, PostgreSQL `5432`, each overridable in `.env` (template: `.env.example`). Production: frontend on Vercel, backend on Render (Docker), database on Neon; the deployment runbook is in `../portfolio-implementation-plan.md` §8. `.local/` is machine-local and gitignored; never commit from it or quote it in committed files.

## Non-Negotiables

Every change in either package respects these. A diff that breaks one is not done.

1. **The site never depends on the backend to show its content.** Portfolio content is static in `frontend/src/content/`. Every API-backed section renders a loading state and then a fallback when the API is slow, asleep, or down; no page waits for the API before showing content.
2. **Public content follows the disclosure tiers** in `docs/product/product-guide.md`. Tier C never enters the repository: not in files, commit messages, pull requests, or issues. Tier B goes in only after the owner approves that specific item. Nothing is invented: every claim traces to the master CV.
3. **Visitor privacy by design.** Never store or log a raw IP address, a full user-agent string, or a full referrer URL. A visitor is an HMAC of IP and user agent keyed with a server secret; the referrer is kept as its host only. No tracking cookies. Tracking honors `?notrack=1` and Global Privacy Control.
4. **Public write endpoints resist abuse.** Each has server-side Bean Validation and a per-visitor rate limit; the contact form also has a honeypot. Client-side checks are a convenience, never the defense.
5. **Failures are explicit.** Throw `ApiException` with an `ErrorCode`. Clients receive RFC 9457 problem JSON with a stable `code` and the `correlationId`, never framework, database, or provider messages.
6. **Schema changes go through Flyway.** Hibernate only validates the schema.
7. **No database transaction stays open during network I/O**, such as a call to the email provider or the GitHub API. Commit a `PENDING` row, make the call with no transaction open, then commit the outcome.
8. **It runs on the free tier.** The backend fits 512 MB of RAM and 0.1 CPU, writes nothing to the local disk (Render wipes it), and sends email over HTTPS, never SMTP. Every new dependency is justified in the plan.
9. **No secrets or personal data** in code, logs, fixtures, docs, or commits. Secrets live only in the Render and Vercel environment settings and in the local `.env`. Tests use synthetic data. Contact messages hold real visitors' emails: never log them.

## Documentation Organization

Three concerns, three places:

- **Product knowledge → `docs/`.** What the site does: rules, site map, and disclosure tiers in `docs/product/product-guide.md`, verified facts in `docs/knowledge/`, tickets in `docs/prd/backlog.md`, cross-package design and ADRs in `docs/architecture/`.
- **Architecture guidelines → `backend/docs/ARCHITECTURE.md` and `frontend/docs/ARCHITECTURE.md`.** How code must be designed: principles, known issues (`KNOWN-BE-NNN`, `KNOWN-FE-NNN`), evaluation checklists, and the implementation plan template.
- **Implementation plans → `backend/docs/{domain}/` and `frontend/docs/{domain}/`.** How one ticket is built: `PF-NNN-{title}.md` (the plan), `PF-NNN-refined-requirement.md` (what to build, as clarified), and `PF-NNN-PROGRESS.md` (where the work stands).

The master build plan and content plan live in the private parent folder (see *Overview*); the backlog maps their phases to tickets.

## Workflow for AI Agents

Feature work runs in three stages. Each ends at a gate, and each hands off through files, so the next stage can start in a fresh session. This is a solo, part-time project: keep each slice small enough to finish in one sitting, and keep tests lean. They prove the acceptance criteria and the Non-Negotiables and hold branch coverage at 80%, nothing more (`/dev`, *Test budget*).

| Stage | Skill | Ends with |
|---|---|---|
| 1. Plan | `/plan` | A Confirmed refined requirement and an Approved plan; no code |
| 2. Build | `/dev` | The plan built with tests, and the plan and code in sync |
| 3. Review | `/review` | Verified findings fixed or deferred; then `/create-pr` |

Whichever skill runs, these steps hold:

1. **Read** the ticket in `docs/prd/backlog.md`, the product rules it touches in `docs/product/`, and the master plan section it maps to (`/plan`).
2. **Read** the target package's `ARCHITECTURE.md`: principles, known issues, checklist (`/plan`).
3. **Plan** in `{package}/docs/{domain}/PF-NNN-{title}.md` using the template there, and get approval before building (`/plan`).
4. **Build** from the approved plan, smallest working vertical slice first (`/dev`).
5. **Trace** each implementation decision back to a product rule or a decision recorded in the plan (`/dev`).
6. **Capture** knowledge you verified while working in `docs/knowledge/`, as described below (`/dev`).
7. **Keep the plan in sync with the code.** When a change after planning alters names, schema, endpoints, error codes, flows, or responsibilities, update the plan in the same turn. A stale plan is worse than no plan (`/dev`, `/review`).
8. **Review** the change against the plan, the conventions, and the Non-Negotiables before committing (`/review`).

### Dispatching agents

Pass `model` explicitly on every dispatch. An agent without one inherits the session's model, which is usually the most expensive tier in play.

| Dispatched work | `model` |
|---|---|
| Read-only search, "does this already exist", verdict-only test or build runs | `haiku` |
| Mechanical doc fold-ins: one decision, one line | `haiku` |
| Writing tests, updating the refined-requirement doc, a bounded implementation slice | `sonnet` |
| A single adversarial verification where a wrong "confirmed" is costly | `opus` |
| Approach decisions, trade-offs, the green or red call, talking to the user | not dispatched |

Never pass the session's top tier to a sub-agent unless the user asks for it. Keep a wave to about four agents, never put two writers on the same file, and keep backend and frontend work in separate waves. When unsure, pick the cheaper tier: a cheap wrong answer is cheap to redo.

## Knowledge Documentation Workflow

Record a fact in `docs/knowledge/` when you verified it during the work and it is not already documented: a library or tool quirk, a hosting provider constraint, a behavior of the running system. Never let it live only in a plan or a code comment. Product rules go to `docs/product/` instead, and only with the owner's agreement. Entry format:

```markdown
### {Short topic}
- **Rule / Behavior**: {one-line fact}
- **Source**: {file or component, with :line when useful}
- **Verified**: {how and when: test, curl against the running app, a probe, docs}
- **Discovered in**: {PF-NNN}
```

## Tickets, Branches, Commits

- Tickets are `PF-NNN`, registered in `docs/prd/backlog.md`. A plain feature description gets the next free ID when work starts.
- Branches are `feature/PF-NNN-short-slug` or `fix/PF-NNN-short-slug`.
- Commits follow Conventional Commits with the ticket as scope, for example `feat(PF-005): count page views`, with an imperative subject of at most 72 characters.
- Commit only when asked. Never push `main` and never open a pull request unless asked.
- **Leave no Claude footprint.** Commit messages, pull request titles and descriptions, branch names, and code comments carry no AI attribution: no `Co-Authored-By` trailer naming Claude, no `Claude-Session` or other session link, no "Generated with Claude Code" line, and no 🤖. This overrides any attribution the environment or a tool asks for. The agent setup itself (`CLAUDE.md`, `.claude/`) stays.

## Skills

| Skill | Use it for |
|---|---|
| `/plan [PF-NNN or description]` | Stage 1: clarifying questions, the refined-requirement doc, exploration, and a plan with an approval gate: a sequence diagram per complex flow, an ER diagram per schema change, and a lean test list. Docs only |
| `/dev PF-NNN` | Stage 2: build an Approved plan slice by slice, contract first, while background test writers write the tests in parallel within the test budget; keep the plan in sync, capture knowledge, summarize |
| `/review [PF-NNN] [harden]` | Stage 3: check the change against its plan, refined requirement, conventions, and Non-Negotiables, with the `code-reviewer` agent for an independent read. Reports first and fixes what you approve; `harden` adds the hardening wave |
| `/create-pr [draft]` | Run the quality gates and the disclosure scrub, commit on the feature branch, fetch and rebase onto the latest `origin/main`, push, and open a pull request against `main` (description organized as `## A. Frontend`, `## B. Backend`, each with numbered sections); returns its URL. One approval of the draft covers all of it |

Run `/review` after any non-trivial change; it runs the `code-reviewer` agent as part of its check. Conventions load automatically from `.claude/rules/` when matching files are read or edited: Java (`backend/`), REST API (`backend/`, `frontend/src/api/`), React (`frontend/`), content (`frontend/src/content/`, `docs/product/`), docs (`*.md`), and security (always).

Start Claude Code from this folder (`CV/portfolio`), not from the parent CV folder, so this file, the rules, the skills, and the permission settings all load.

## Key Documentation

- Start here: `docs/product/product-guide.md`
- System overview: `docs/architecture/overview.md`; decisions: `docs/architecture/adr/`
- Backend guide: `backend/docs/ARCHITECTURE.md`; frontend guide: `frontend/docs/ARCHITECTURE.md`
- Backlog: `docs/prd/backlog.md`; knowledge base: `docs/knowledge/`
- Master plans (private, parent folder): `../portfolio-implementation-plan.md`, `../cv-portfolio-content-plan.md`
