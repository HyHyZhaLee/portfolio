# PF-013 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-013 — Deploy the frontend from GitHub Actions after the checks pass · **Plan**: [PF-013-ci-deploy.md](PF-013-ci-deploy.md) · **Master plan section**: `../portfolio-implementation-plan.md` §2 (CI/CD row) and §8.E · **Status**: **Confirmed** · **Last updated**: 2026-11-23

## 1. Problem and goal

The frontend is live on Vercel, but Vercel builds every push to `main` on its own, even when the `check` job in `.github/workflows/frontend.yml` fails, and its working install and build commands exist only as dashboard overrides. The owner wants production deploys gated on CI and the build setup kept in the repository. A hiring manager reading the repository should see a single, checked path from commit to production. No visitor-facing behavior changes: this is a CI chore.

## 2. Scope

**In scope**

- A `deploy` job in `.github/workflows/frontend.yml` that needs the `check` job and deploys production with a pinned Vercel CLI (D1, D3).
- `frontend/vercel.json` with the install and build commands pinned to pnpm 11.0.9, and Vercel's Git deployments turned off (D1, D2).
- A deploy trigger on a push to `main` that touches the workflow's frontend paths, and on a manual `workflow_dispatch` run on `main` (D4).
- Concurrency rules that never cancel a run on `main` (D5).
- Docs updates.

**Out of scope (deferred)**

- Preview deployments for pull requests: Dependabot pull requests cannot read repository secrets and the owner does not need previews now; a separate job can add them later (D6).
- A GitHub `environment:` with a production URL and protection rules: environments are not available for private repositories on the GitHub Free plan, so it waits for launch (PF-009), when the repository goes public (D7).
- The backend deploy to Render: it stays with PF-012 and Render's own auto-deploy.
- `@vercel/analytics`, `robots.txt`, `sitemap.xml`, and `og-image.png`: they stay with PF-012.
- Changing any Vercel or GitHub settings: these are owner steps.

## 3. Functional requirements

- **FR-1**: On a push to `main`, the `deploy` job runs only after the `check` job passes; if `check` fails, `deploy` is skipped. Source: clarified 2026-11-23, D1
- **FR-2**: A pull request runs the `check` job only and never the `deploy` job. Source: clarified 2026-11-23, D4, D6
- **FR-3**: A manual `workflow_dispatch` run on `main` runs `check` and then `deploy`, so the owner can rebuild after changing `VITE_API_URL` in Vercel without a code change. Source: clarified 2026-11-23, D4
- **FR-4**: `frontend/vercel.json` sets `"git": { "deploymentEnabled": false }`, so Vercel creates no deployment from a Git push and the workflow is the only path to production. Source: clarified 2026-11-23, D1
- **FR-5**: `frontend/vercel.json` carries `installCommand` and `buildCommand`, both running pnpm 11.0.9 through `npx`, so the build setup is versioned in the repository. Source: clarified 2026-11-23, D2
- **FR-6**: The job runs Vercel CLI `vercel@66.2.0` from the repository root, not from `frontend/`, in three steps: `vercel pull` for the production settings and environment variables, `vercel build --prod` on the GitHub runner with Node from `.nvmrc`, and `vercel deploy --prebuilt --prod`. `VITE_API_URL` stays in the Vercel settings. Source: clarified 2026-11-23, D3
- **FR-7**: A newer run cancels an older one only for pull requests; a run on `main` is never cancelled midway and later runs queue behind it. Source: clarified 2026-11-23, D5
- **FR-8**: The repository contains no secret value or ID value. The workflow reads only the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`, by name. Source: master plan §8.E, Non-Negotiable 9

## 4. Product rules and edge cases

- No visitor-facing behavior changes: the site, its content, and its API calls are the same before and after.
- The Vercel project's Root Directory is already `frontend`, so the CLI runs from the repository root; running it from `frontend/` would make Vercel look for `frontend/frontend`.
- The dashboard install and build overrides become redundant once `vercel.json` carries the commands; the owner may switch them off.
- A failed `deploy` job leaves the previous production deployment live; nothing is half-published because the build runs before the upload.

## 5. Interface decisions

**UI**: None. The only changes are the workflow and `frontend/vercel.json`.

## 6. Open questions

None.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | GitHub Actions deploys production in a `deploy` job that needs the `check` job, so nothing reaches production unless every frontend check passed. Vercel's own Git deployments are turned off with `"git": { "deploymentEnabled": false }` in `frontend/vercel.json`, so there is a single path to production. | The owner wants deploys gated on CI. |
| D2 | 2026-11-23 | The install and build commands move into `frontend/vercel.json` (`installCommand`, `buildCommand`), pinning pnpm 11.0.9 through `npx`. The dashboard overrides become redundant and the owner may switch them off. | Vercel ignored the `packageManager` field under Root Directory `frontend`, and the working commands lived only in the dashboard; versioning them in the repository keeps the build reproducible. |
| D3 | 2026-11-23 | The job runs a pinned Vercel CLI (`vercel@66.2.0`, the version Vercel's own build used) from the repository root, not from `frontend/`: `vercel pull` for production settings and environment variables, `vercel build --prod` on the GitHub runner with Node from `.nvmrc`, then `vercel deploy --prebuilt --prod`. | The project's Root Directory is already `frontend`. Pulling the settings keeps `VITE_API_URL` in the Vercel settings and out of the repository. |
| D4 | 2026-11-23 | The deploy runs on a push to `main` that touches the workflow's frontend paths, and on a manual `workflow_dispatch` run on `main`. Pull requests never deploy. | The owner can rebuild after changing `VITE_API_URL` in Vercel without a code change. |
| D5 | 2026-11-23 | A newer run cancels an older one only for pull requests; runs on `main` are never cancelled midway. | A deploy must not be killed half-done. |
| D6 | 2026-11-23 | Preview deployments for pull requests are out of scope and deferred; they can be added later as a separate job. | Dependabot pull requests cannot read repository secrets, and the owner does not need previews now. |
| D7 | 2026-11-23 | A GitHub `environment:` with a production URL and protection rules is out of scope and deferred to launch (PF-009). | Environments are not available for private repositories on the GitHub Free plan; the repository goes public at launch. |

## 8. Acceptance criteria (refined)

- **AC-1**: A push to `main` that touches the frontend paths runs `check` and then `deploy`, and `deploy` is skipped when `check` fails.
- **AC-2**: A pull request runs `check` and never `deploy`.
- **AC-3**: A `workflow_dispatch` run on `main` runs `check` and `deploy`.
- **AC-4**: Once `frontend/vercel.json` carries `git.deploymentEnabled: false`, Vercel creates no Git-triggered deployment for a push.
- **AC-5**: `vercel build --prod`, run from the repository root with the pulled production settings, completes using the commands in `frontend/vercel.json`.
- **AC-6**: A second push to `main` queues behind a running deploy instead of cancelling it, while a new push to a pull request cancels the older run of that pull request.
- **AC-7**: The repository contains no secret value, and the workflow reads only the three named secrets.
