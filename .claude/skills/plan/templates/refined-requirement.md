# PF-NNN — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-NNN — {summary} · **Plans**: {links to the backend and frontend plans} · **Master plan section**: {`../portfolio-implementation-plan.md` §n or `../cv-portfolio-content-plan.md` §n} · **Status**: Draft | Refining | Confirmed · **Last updated**: {YYYY-MM-DD}

## 1. Problem and goal

{Who needs what, and why, in one short paragraph. Name the audience: a recruiter scanning, a hiring manager reading, a visitor sending a message, or the owner reading stats.}

## 2. Scope

**In scope**

- {item}

**Out of scope (deferred)**

- {item}: {why it is deferred}

## 3. Functional requirements

- **FR-1**: {a testable statement}. Source: {backlog, a `SITE-NNN` rule, a master plan section, or "clarified YYYY-MM-DD"}

## 4. Product rules and edge cases

- {rule or edge case, with its `SITE-NNN` ID when one exists}
- **API down or asleep:** {what the visitor sees instead (Non-Negotiable 1)}
- **Privacy:** {what is stored about a visitor, and what is never stored (Non-Negotiable 3)}
- **Abuse:** {validation limits, rate limit, honeypot (Non-Negotiable 4)}

## 5. Interface decisions

**API**: {endpoints, status and error codes, payload choices}

**UI**: {flows, components, copy, the loading, fallback, and error states, and the page title and meta description}

**Content**: {each new public text block with its source and disclosure tier; Tier B items stay placeholders until approved}

## 6. Open questions

- {question}. Proposed default: {default}

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | {YYYY-MM-DD} | {decision} | {why} |

## 8. Acceptance criteria (refined)

- **AC-1**: {an observable outcome}
