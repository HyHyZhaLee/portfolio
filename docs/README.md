# Documentation

This folder holds what the site does and why it is built the way it is. How each package's code must be designed lives next to the code in `backend/docs/ARCHITECTURE.md` and `frontend/docs/ARCHITECTURE.md`. How one ticket is built lives in `backend/docs/{domain}/` and `frontend/docs/{domain}/`.

The master build plan and content plan are private and live outside this repository, in the parent CV folder: `portfolio-implementation-plan.md` (wins on build and architecture) and `cv-portfolio-content-plan.md` (wins on content). The backlog maps their phases to tickets.

## Layout

```
docs/
├── README.md                 # this file
├── product/
│   └── product-guide.md      # start here: purpose, audience, site map, product rules (SITE-NNN), disclosure tiers
├── architecture/
│   ├── overview.md           # system context, components, request lifecycle, hosting
│   └── adr/                  # architecture decision records, one per implemented decision
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
| A system-wide design | `architecture/` | Describes what exists; anything not built yet is marked _(planned)_ |
| An implemented decision with trade-offs | `architecture/adr/NNNN-{title}.md` | Template in `architecture/adr/README.md` |
| A new piece of work | `prd/backlog.md` | Take the next free `PF-NNN` |
| How one ticket is built | `{package}/docs/{domain}/PF-NNN-{title}.md` | `{package}` is `backend` or `frontend`; template in that package's `ARCHITECTURE.md`; written and approved through `/plan`, built by `/dev` |
| What one ticket must do, as clarified | `{package}/docs/{domain}/PF-NNN-refined-requirement.md` | Written during `/plan` and kept current by `/dev`, in the package that carries most of the work |
| Where a ticket's work stands | `{package}/docs/{domain}/PF-NNN-PROGRESS.md` | Starts with §0 CURRENT STATE, for resuming in a new session |
| Portfolio copy (hero, about, case studies) | `frontend/src/content/` | Only owner-reviewed text; follows `.claude/rules/content-conventions.md` |
| A screenshot or exported diagram | `assets/` | Reference it with a relative link |

## Conventions

- File names are kebab-case. ADRs are numbered `NNNN-`. Tickets are `PF-NNN`.
- One paragraph or list item per line; never hard-wrap prose. Tables, code fences, and headings stay intact. Full rules: `.claude/rules/docs-conventions.md`.
- Diagrams are Mermaid in fenced blocks, so they render on GitHub and stay diffable.
- Docs describe what exists. Anything specified but not built yet is marked _(planned)_ with the ticket that will build it.
- This repository is public: nothing here may contain secrets, real personal data, or Tier C content.
