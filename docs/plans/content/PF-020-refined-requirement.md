# PF-020 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-020 — Award certificates in object storage, awards served by the backend · **Plan**: [PF-020-award-certificates.md](PF-020-award-certificates.md) · **Master plan section**: `../portfolio-implementation-plan.md` (architecture sections) and `../cv-portfolio-content-plan.md` (content split) · **Status**: Refining · **Last updated**: 2026-11-24 · **Branch**: `feature/PF-020-award-certificates` · **Depends on**: PF-014 (content API, catalog, and the committed content snapshot)

## 1. Problem and goal

The owner asked, during PF-014 planning: "Also plan moving our certificates to another bucket service." Today the Education section (`frontend/src/sections/Education.tsx`) renders degrees and three awards from `frontend/src/content/education.ts`. Each award has a title, a detail line, and a certificate (`src`, `alt`, `width`, `height`). The three certificate images (WebP, about 240 KB together) are bundled by Vite from `frontend/src/assets/certificates/` and open in a native modal dialog from a "View certificate" button. They were checked for personal data and approved for publication in PF-012. The goal is to store the images in an object storage bucket and serve the awards from the backend, reusing the PF-014 content API, catalog, and snapshot. The audience is the owner (a backend and storage design with real weight) and the hiring manager reading the code. The visitor sees no difference. The constraints are Non-Negotiable 1 (content never waits for the API), Non-Negotiable 2 (text verbatim), and Non-Negotiable 8 (free tier). The owner then asked to continue without another question round, so every detail below is a best-practice default in force; the owner may override any of them at plan approval.

## 2. Scope

**In scope**

- A public `GET` endpoint serving the awards in today's order, each with its certificate (URL, alt text, width, height) or none.
- Awards stored in the database and seeded by a Flyway migration with today's reviewed text verbatim and each certificate's full public HTTPS URL.
- A Cloudflare R2 public-read bucket holding the three certificate images, uploaded once by the owner following steps written in the plan.
- The awards added to the PF-014 content snapshot and to its CI drift check.
- The Education section rendering degrees from frontend content and awards from the snapshot at once, then from the API when it answers.
- The certificate dialog loading each image from the bucket with its width and height set, and showing the alt text when the image cannot load.
- Removing the bundled certificate files from the frontend.

**Out of scope (deferred)**

- Degrees: they stay in the frontend and move with PF-019.
- The rest of PF-019 (profile, About, experience, How I work, section intros, site notes): a separate ticket.
- A custom domain for the bucket: the `r2.dev` address is enough for three images opened on click, and a custom domain later is a seed edit.
- Image transformations or resizing: the files stay as approved in PF-012.
- Uploads from the site and any write endpoint: the owner uploads by hand, and content changes go through pull requests.

## 3. Functional requirements

- **FR-1**: The backend serves the awards in today's order through a public `GET` endpoint, each with its title, detail line, and certificate (URL, alt text, width, height) or none. Source: clarified 2026-11-24, D1
- **FR-2**: Awards live in a database table created and seeded by a Flyway migration; the seed holds today's title, detail, and alt text verbatim, and each certificate's full public HTTPS URL. Source: D3, D5
- **FR-3**: The committed content snapshot includes the awards, and CI fails when the committed snapshot differs from what the backend serves. Source: D1, PF-014 FR-5 and FR-7
- **FR-4**: The Education section renders the degrees from frontend content and the awards from the snapshot at once, then from the live API when it answers; nothing waits for the API. Source: clarified 2026-11-24, Non-Negotiable 1
- **FR-5**: Each certificate dialog loads its image from the bucket URL with the width and height attributes set, so the layout does not shift. Source: clarified 2026-11-24
- **FR-6**: When the bucket is unreachable or an image fails to load, the dialog still opens and shows the certificate's alt text. Source: clarified 2026-11-24, Non-Negotiable 1
- **FR-7**: The three certificate files are removed from `frontend/src/assets/certificates/`, and the frontend bundle no longer contains them. Source: D4
- **FR-8**: No visible text changes: titles, detail lines, alt text, and the "View certificate" button read as today. Source: D5, Non-Negotiable 2
- **FR-9**: The awards endpoint answers from memory after the first load, with no per-request database query on the hot path, like the PF-014 content endpoints. Source: Non-Negotiable 8, PF-014 FR-11

## 4. Product rules and edge cases

- Non-Negotiable 1 holds unchanged: the snapshot carries the full certificate URLs, so award text shows with the API asleep, and the images still load from the bucket independently of the API.
- Non-Negotiable 2 holds: the award text moves verbatim (Tier A); any difference between the old TypeScript text and the served text is a defect. The images were approved for publication in PF-012; no new image is added.
- No write endpoint and no new backend dependency: the backend stores URLs as text and never calls the bucket.
- Backend and snapshot must agree: a migration that changes the served awards requires the regenerated snapshot in the same pull request, enforced by FR-3.
- **API down or asleep:** The visitor sees the awards from the snapshot, identical to today, with no spinner blocking content and no error banner. Certificate images load directly from the bucket.
- **Bucket unreachable:** The "View certificate" dialog still opens and shows the alt text in place of the image (FR-6).
- **Privacy:** Opening a certificate makes the visitor's browser request the image from Cloudflare, which sets no cookie. The site stores nothing about the visitor for this, and the awards endpoint logs nothing beyond what existing visit tracking records (Non-Negotiable 3).
- **Abuse:** The public `GET` awards endpoint needs no rate limit, because Non-Negotiable 4 covers public writes; it answers from memory cheaply on the free tier (Non-Negotiable 8). Bucket traffic is Cloudflare's, with no egress fees.
- **Hosting:** Agents never create or configure the Cloudflare account or bucket; the owner does, following steps in the plan (security rules). No bucket write token is stored anywhere in the repository.

## 5. Interface decisions

**API**: One public `GET` endpoint for the awards, under the PF-014 content API and its path conventions (named in the plan). It returns an ordered list; each item holds title, detail, and an optional certificate object with `url`, `alt`, `width`, and `height`. No write endpoints, no new error codes beyond those PF-014 uses.

**UI**: The Education section keeps its layout and copy. Awards read from the snapshot-or-API content source introduced by PF-014; degrees keep reading `education.ts`. The certificate dialog sets `width` and `height` on the image from the certificate data, and renders the alt text when the image errors. No new loading or error banner.

**Content**: No new public text. The award titles, detail lines, and alt text are existing Tier A copy approved earlier and move verbatim into the seed. The certificate images were checked for personal data and approved in PF-012. Bucket name and object keys are infrastructure, not visitor copy.

## 6. Open questions

- Public address: which URL do the certificates load from? Proposed default: the bucket's `r2.dev` public URL until the owner adds a custom domain. Cloudflare rate-limits `r2.dev` and recommends a custom domain for production, which is acceptable for three images opened on click; moving to a custom domain later is a seed edit.
- Bucket name and object keys. Proposed default: bucket `will-ly-portfolio-assets` with keys `certificates/{file name}.webp`, using the same file names as today.

## 7. Decision log

Each decision below is a best-practice default, in force under the owner's instruction to continue without another question round. The owner may override any of them at plan approval.

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | Own ticket after PF-014, reusing its content API, catalog, and snapshot. PF-019 keeps the degrees; the awards and certificates are this ticket. Source: default under the owner's instruction to follow best practice | Keeps PF-014 focused and reuses its snapshot and drift check, so the awards need no new mechanism. |
| D2 | 2026-11-24 | Bucket service is Cloudflare R2. Rejected: AWS S3 and Supabase Storage. Source: default under the owner's instruction to follow best practice | R2 has 10 GB free with no time limit and no egress fees, and is S3-compatible, so the site stays at $0 (Non-Negotiable 8). The S3 free tier lasts 12 months, and Supabase Storage needs another account and offers 1 GB. |
| D3 | 2026-11-24 | Public-read bucket. Each award row stores the certificate's full public HTTPS URL in the seed. Signed URLs rejected. Source: default under the owner's instruction to follow best practice | The images are already public on the site. Full URLs in the seed let the committed snapshot carry working URLs, so images load while the API sleeps (Non-Negotiable 1). Signed URLs need an SDK and a secret on Render, and a snapshot cannot hold URLs that expire. |
| D4 | 2026-11-24 | The owner uploads the three files once with the Cloudflare dashboard or CLI, following steps written in the plan, and reports the public URLs before the build starts. The image files then leave the repository. A CI sync job is rejected. Source: default under the owner's instruction to follow best practice | Agents never create or configure hosting accounts (security rules). A CI sync needs a bucket write token as a repository secret for three files that rarely change. |
| D5 | 2026-11-24 | The awards' text (title, detail, alt text) moves verbatim into the backend seed with no copy changes. Degrees stay in the frontend. Source: default under the owner's instruction to follow best practice | Non-Negotiable 2 and the scope split with PF-019. |

## 8. Acceptance criteria (refined)

- **AC-1**: The awards endpoint returns the three awards in today's order, each with its certificate URL, alt text, width, and height.
- **AC-2**: With the API asleep or down, the Education section shows the same text as today, from the snapshot.
- **AC-3**: Each certificate dialog shows the image loaded from the bucket with no layout shift.
- **AC-4**: With the bucket unreachable, the dialog opens and shows the alt text.
- **AC-5**: The frontend bundle no longer contains the certificate images.
- **AC-6**: CI's snapshot drift check fails when the committed snapshot's awards differ from what the backend serves.
