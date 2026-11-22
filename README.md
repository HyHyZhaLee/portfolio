# Portfolio — Will Ly

Personal portfolio site and live full-stack demo: a React frontend that always loads, a Spring Boot API for visit stats, contact messages, and GitHub projects, and PostgreSQL, all on free hosting tiers.

> **Status:** under construction. The repository has its conventions, docs, and tooling; the application code arrives with PF-002 onward ([backlog](docs/prd/backlog.md)).

## Stack _(planned)_

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router | Vercel |
| Backend | Java 21, Spring Boot 4, Gradle, Flyway, springdoc OpenAPI | Render (Docker) |
| Database | PostgreSQL 17 | Neon |
| Quality | JUnit, Testcontainers, WireMock, Vitest, Testing Library, MSW, GitHub Actions | — |

## Repository layout

| Path | What it is |
|---|---|
| `backend/` | Spring Boot API; guide in `backend/CLAUDE.md` and `backend/docs/ARCHITECTURE.md` |
| `frontend/` | React site; guide in `frontend/CLAUDE.md` and `frontend/docs/ARCHITECTURE.md` |
| `docs/` | Product rules, architecture, ADRs, knowledge base, backlog ([index](docs/README.md)) |
| `scripts/` | Helper scripts used by the Makefile |
| `.claude/` | AI-assisted workflow: rules, skills, and a review agent |

## Local development

```bash
make help        # list every target
make up          # start PostgreSQL in Docker
make backend     # run the API on :8080 (after PF-002)
make frontend    # run the site on :5173 (after PF-002)
make status      # read-only report of the local stack
make check       # all quality gates
```

Copy `.env.example` to `.env` to override local defaults. Node commands run through `scripts/with-node.sh`, which uses the version pinned in `.nvmrc`.

## How it is built

Work is planned, built, and reviewed in small tickets: `/plan` writes a refined requirement and an approved plan, `/dev` builds it with tests, `/review` checks it against the plan and the conventions, and `/create-pr` runs the gates and opens a pull request. AI coding assistants speed up the work; every change is reviewed and verified. The rules are in [CLAUDE.md](CLAUDE.md).
