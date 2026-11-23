# Documentation

This is the repository's only docs folder. It holds the docs for the backend and the frontend alike: what the site does, how each package's code must be designed, and how each ticket is built. The packages hold code, plus a `CLAUDE.md` each with commands, naming, and code patterns; they have no docs folders of their own.

**The docs focus on the backend.** The backend is where the design decisions and the risks are, so `architecture/backend.md` is the main design guide, and every plan specifies the backend's schema, services, API, failure modes, and flows in full. The frontend gets a shorter companion guide, `architecture/frontend.md`, and a compact frontend section in each plan: components and routes, content, states, forms, and test IDs.

The master build plan and content plan are private and live outside this repository, in the parent CV folder: `portfolio-implementation-plan.md` (wins on build and architecture) and `cv-portfolio-content-plan.md` (wins on content). The backlog maps their phases to tickets.

## Layout

```
docs/
├── README.md                 # this file
├── product/
│   └── product-guide.md      # start here: purpose, audience, site map, product rules (SITE-NNN), disclosure tiers
├── architecture/
│   ├── overview.md           # system context, components, request lifecycle, hosting
│   ├── backend.md            # main design guide: principles, KNOWN-BE-NNN, checklist, key services, domain rules
│   ├── frontend.md           # companion guide: principles, KNOWN-FE-NNN, checklist, key directories
│   └── adr/                  # architecture decision records, one per implemented decision
├── plans/
│   ├── README.md             # domains, the one plan template (backend first), diagram conventions
│   └── {domain}/             # PF-NNN-{title}.md, PF-NNN-refined-requirement.md, PF-NNN-PROGRESS.md
├── knowledge/                # verified facts about tools, libraries, and hosting providers
├── prd/
│   └── backlog.md            # ticket registry (PF-NNN)
└── assets/                   # screenshots and exported diagrams (added when needed)
```

## Where does it go?

| You have… | Put it in | Notes |
|---|---|---|
| A product rule or behavior | `product/product-guide.md` | Rule IDs `SITE-NNN`. Owner-approved: agents propose a rule change and write it once the owner agrees |
| A verified technical fact | `knowledge/{area}.md` | Only facts confirmed in practice; format in `knowledge/README.md` |
| A design rule for backend code | `architecture/backend.md` | A principle, a `KNOWN-BE-NNN` entry, a checklist item, a key service, or a domain guideline |
| A design rule for frontend code | `architecture/frontend.md` | A principle, a `KNOWN-FE-NNN` entry, a checklist item, or a key directory |
| A system-wide design | `architecture/overview.md` | Describes what exists; anything not built yet is marked _(planned)_ |
| An implemented decision with trade-offs | `architecture/adr/NNNN-{title}.md` | Template in `architecture/adr/README.md` |
| A new piece of work | `prd/backlog.md` | Take the next free `PF-NNN` |
| How one ticket is built | `plans/{domain}/PF-NNN-{title}.md` | One plan per ticket for both packages, backend first; template and domains in `plans/README.md`; written and approved through `/plan`, built by `/dev` |
| What one ticket must do, as clarified | `plans/{domain}/PF-NNN-refined-requirement.md` | Written during `/plan` and kept current by `/dev` |
| Where a ticket's work stands | `plans/{domain}/PF-NNN-PROGRESS.md` | Starts with §0 CURRENT STATE, for resuming in a new session |
| Portfolio copy (hero, about, case studies) | `frontend/src/content/` | Not a doc: owner-reviewed text only; follows `.claude/rules/content-conventions.md` |
| Commands, naming, and code patterns for one package | `backend/CLAUDE.md`, `frontend/CLAUDE.md` | Not docs: the working contract an agent loads when it touches that package |
| A screenshot or exported diagram | `assets/` | Reference it with a relative link |

## Conventions

- File names are kebab-case. ADRs are numbered `NNNN-`. Tickets are `PF-NNN`.
- One paragraph or list item per line; never hard-wrap prose. Tables, code fences, and headings stay intact. Full rules: `.claude/rules/docs-conventions.md`.
- Diagrams are Mermaid in fenced blocks, so they render on GitHub and stay diffable.
- Docs describe what exists. Anything specified but not built yet is marked _(planned)_ with the ticket that will build it.
- This repository is public: nothing here may contain secrets, real personal data, or Tier C content.
