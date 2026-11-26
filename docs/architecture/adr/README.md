# Architecture Decision Records

An ADR records one decision that shaped the system: the context, the decision, what it costs, and what was rejected. Write one when a decision is implemented and would surprise a newcomer, or when reversing it later would be expensive. Until a decision is implemented, it lives in the decision tables of the private master plan (`portfolio-implementation-plan.md` §2 in the parent folder) or in the ticket's plan.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-where-data-lives.md) | Editorial content in the frontend, live data in the backend | Accepted |

Likely next candidates: the free-tier hosting split (Vercel, Render, Neon) and visitor hashing instead of storing IP addresses.

## Rules

- File name `NNNN-short-title.md`, numbered in order from `0001`, never reused.
- Status is Proposed, Accepted, or Superseded by NNNN. An accepted ADR is not rewritten; a change of mind is a new ADR that supersedes it.
- Keep it under about 40 lines. Link to code and docs rather than repeating them.
- Add each new ADR to the index in the same change.

## Template

```markdown
# NNNN — {Decision in a few words}

**Status**: Accepted · **Date**: {YYYY-MM-DD} · **Related**: {PF-NNN, other ADRs}

## Context
{The forces at play: requirements, constraints, and what made this a decision.}

## Decision
{What we do, stated plainly.}

## Consequences
{What becomes easier, what becomes harder, what we now maintain.}

## Alternatives considered
| Alternative | Why not |
|---|---|
| {option} | {reason} |
```
