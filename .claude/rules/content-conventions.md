---
paths:
  - "frontend/src/content/**/*"
  - "frontend/public/**/*"
  - "frontend/index.html"
  - "docs/product/**/*"
---

# Content conventions

Everything here is public: indexed by search engines and readable by anyone, including past and current employers and their clients. The content plan (`../cv-portfolio-content-plan.md`) wins on what may be said; this file is how agents apply it.

## Source and approval

- **Never invent.** Every claim, number, date, title, and team-size statement traces to the master CV or to an item the owner approved. Mark anything uncertain `(confirm)` and list it in your hand-off instead of guessing.
- Only reviewed text from `../portfolio-content/` goes into `frontend/src/content/`. Until it exists, use clearly fake placeholders (`"TODO: hero pitch (content pack C)"`), never drafted claims.
- Facts, dates, and numbers match the master CV exactly. The CV is sent at full length, never shortened, and the public CV PDF is that same CV without the phone. If they differ, stop and ask; do not pick one.

## Disclosure tiers (Non-Negotiable 2)

- **Tier A** (public OK): what the master CV states, general engineering techniques without internal names, personal projects, degrees, awards. Use freely, consistent with the CV.
- **Tier B** (only after the owner approves the specific item): numbers and stories not in the master CV, design and root-cause stories, generic architecture diagrams of employer systems, the growth story. Keep each unapproved item out of the repository; an approved one notes its approval in the ticket's refined requirement.
- **Tier C** (never): customer, tenant, patient, or caregiver names and data; colleague names (write "the tech lead", "a teammate"); internal ticket IDs, repository, branch, and class names, internal URLs, hostnames, account IDs; screenshots, source code, or copied documents from employer systems; the location of security vulnerabilities; performance-review content; lines-of-code counts; anything the source material marks "do not claim", "not merged", or "feature branch only".

## Ownership language

- Say exactly what the owner did: "implemented under the tech lead's architecture", "main implementer", "took ownership of", "built out from a scaffold", "one of five developers". Use "designed" or "led" only where the source confirms it.
- A team project names the owner's part, not the team's result as his own.

## Shape

- Content files are typed TypeScript data (`profile.ts`, `featuredWork.ts`, `caseStudies/{slug}.ts`), never JSX with copy inside. Components render them.
- Project titles follow "Name - descriptor", for example "Clockwork - Healthcare Scheduling Platform".
- Case studies follow the template in the content plan §6.3 (at a glance, context, problem, role and scope, what I built, deep dive, outcome), 500–800 words.
- Diagrams are drawn fresh in Mermaid or SVG with generic labels ("Practitioner web app", "Event bus", "Queue + DLQ"); never trace an internal diagram.
- No phone number anywhere, including the public CV PDF in `frontend/public/`. No photo, date of birth, or marital status.

## Voice

- First person, plain and specific: what was built, for whom, and what changed. Short sentences, active voice, no buzzwords or superlatives ("passionate", "rockstar", "world-class").
- Outcomes over activity; a number only when it is approved.
