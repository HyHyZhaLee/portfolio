---
paths:
  - "**/*.md"
---

# Documentation conventions

- **Never hard-wrap prose.** Each paragraph and each list item is one logical line, however long; the editor wraps it. Never break a line mid-sentence to stay under a column width.
- Keep structure intact: tables, fenced code blocks, headings, and a blank line between blocks. A blockquote is a single `> …` line.
- Docs describe what exists. Mark anything specified but not yet built as _(planned)_, with the ticket that will build it.
- Plans stay in sync with code. When code changes names, schema, endpoints, error codes, flows, or responsibilities, update the plan in the same change.
- Put content where it belongs (see `docs/README.md`): product rules in `docs/product/`, verified facts in `docs/knowledge/`, design rules in the package `ARCHITECTURE.md`, ticket plans in `{package}/docs/{domain}/`.
- Link with relative paths that resolve from the file's own folder, and reference code as `path:line`. Links into the private parent folder (`../portfolio-implementation-plan.md`, `../cv-portfolio-content-plan.md`) are allowed only from `CLAUDE.md`, `.claude/`, and `docs/`; they do not resolve on GitHub, so name the file and section in the link text.
- Use the ID schemes consistently: `PF-NNN` tickets; `SITE-NNN` product rules; `KNOWN-BE-NNN` and `KNOWN-FE-NNN` known issues; `D{n}` decisions, `FR-{n}` functional requirements, and `AC-{n}` acceptance criteria within a ticket's docs.
- Mermaid: a complex flow is a `sequenceDiagram` and a schema change is an `erDiagram`, following the conventions in `backend/docs/ARCHITECTURE.md`. In a flowchart, quote any label containing `(`, `)`, `[`, `]`, `:`, or `/`; never put `#` in a label; write `Step 1 - …` instead of `1. …`. In a sequence diagram, keep `;` and `#` out of message text. In an ER diagram, use plain types without precision, because a type cannot contain a comma. Keep a diagram to about 15 nodes or messages.
- Write plainly: short sentences, active voice, concrete nouns. Use a table for comparisons and a numbered list for sequences.
- Never include secrets, real personal data, Tier C content, or names from other private codebases. This repository is public.
