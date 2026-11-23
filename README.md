# Portfolio — Will Ly

Personal portfolio site and live full-stack demo: a React frontend that always loads, a Spring Boot API for visit stats, contact messages, and GitHub projects, and PostgreSQL, all on free hosting tiers.

> **Status:** under construction. Both packages are scaffolded and pass their quality gates (PF-002); the site's sections and the API features arrive with PF-003 onward ([backlog](docs/prd/backlog.md)).

## Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack Query, React Router 8 | Vercel _(planned, PF-003)_ |
| Backend | Java 21, Spring Boot 4.2, Gradle 9, Flyway, springdoc OpenAPI | Render, Docker _(planned, PF-004)_ |
| Database | PostgreSQL 17 | Neon _(planned, PF-004)_ |
| Quality | JUnit, Testcontainers, WireMock, Vitest, Testing Library, MSW, GitHub Actions | — |

## Repository layout

| Path | What it is |
|---|---|
| `backend/` | Spring Boot API; working guide in `backend/CLAUDE.md` |
| `frontend/` | React site; working guide in `frontend/CLAUDE.md` |
| `docs/` | All documentation, focused on the backend: product rules, design guides, ADRs, ticket plans, knowledge base, backlog ([index](docs/README.md)) |
| `scripts/` | Helper scripts used by the Makefile |
| `.claude/` | AI-assisted workflow: rules, skills, and a review agent |

## Local development

```bash
make help        # list every target
make up          # start PostgreSQL in Docker
make backend     # run the API on :8080 with the local profile (Swagger UI at /swagger-ui.html)
make frontend    # run the site on :5173; it proxies /api and /actuator to the backend
make status      # read-only report of the local stack
make check       # all quality gates
make openapi     # regenerate the API snapshot and the frontend's generated types
```

Copy `.env.example` to `.env` to override local ports and database settings: `docker compose`, `make backend`, `make frontend`, and `make status` all read it, and a variable exported in your shell wins over it. Node commands run through `scripts/with-node.sh`, which uses the version pinned in `.nvmrc`.

## How it is built

Work is planned, built, and reviewed in small tickets: `/plan` writes a refined requirement and an approved plan, `/dev` builds it with tests, `/review` checks it against the plan and the conventions, and `/create-pr` runs the gates and opens a pull request. AI coding assistants speed up the work; every change is reviewed and verified. The rules are in [CLAUDE.md](CLAUDE.md).
