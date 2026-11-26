# 0001 — Editorial content in the frontend, live data in the backend

**Status**: Accepted · **Date**: 2026-11-25 · **Related**: PF-029 D1, PF-014, PF-019, PF-020 (dropped), SITE-001

## Context

The site has a real backend so that it can prove full-stack work, and PF-014 planned to move the case studies, Featured work, and skills into PostgreSQL behind a content API, with PF-019 (the rest of the copy) and PF-020 (award certificates in an R2 bucket) after it. Non-Negotiable 1 still required every page to render without the API, so PF-014 needed a committed snapshot of the API's output in the frontend and a CI check to keep the two in step. That made three copies of the same text (the SQL seed, the JSON snapshot, the types), a backend deploy for every typo fix, and no difference a visitor could see.

## Decision

Place data by how it changes, not by which tier needs more work:

| Data | Lives in | Examples |
|---|---|---|
| Copy that changes only through a pull request and is the same for every visitor | Frontend bundle (`frontend/src/content/`) | profile, About, experience, case studies, skills, How I work |
| Presentation | Frontend | diagram geometry, navigation, section order, UI strings |
| The site's own images and files | Frontend, served by Vercel's CDN | portrait, award certificates, favicon |
| Created at runtime by visitors | Backend and PostgreSQL | page views, contact messages |
| Computed from stored rows | Backend | the stats summary |
| Needing a secret or an outside call | Backend | the email provider |
| Private to the owner or different per visitor | Backend, behind a login | a future `?ref` tag registry or inbox (PF-016, PF-017) |
| Describing the running system | Backend | health, the deployed commit (`/actuator/info`) |

The backend refers to frontend content by slug only (for example a `/work/<slug>` path in `page_view`) and never stores its text.

## Consequences

- Content edits stay a one-file change reviewed in a pull request, with the Tier C scrub, and need no backend deploy.
- Every page renders from the bundle, so SITE-001 holds with no snapshot or drift check.
- The backend's design weight comes from live features (visits, the contact outbox, health, and later the owner dashboard and tailored links), not from serving static text.
- Content becomes backend data only when someone writes it at runtime or it differs per visitor, for example a hero line tailored to one company's link.

## Alternatives considered

| Alternative | Why not |
|---|---|
| Content API with a committed snapshot and a CI drift check (PF-014) | Three copies of the same text and a backend deploy per edit, for no visitor-facing change |
| Content API without a snapshot | Breaks Non-Negotiable 1: pages would wait for a free-tier API that sleeps |
| Certificates in object storage (PF-020) | Adds an account and a failure mode for three files already on Vercel's CDN; storage fits files created at runtime |
