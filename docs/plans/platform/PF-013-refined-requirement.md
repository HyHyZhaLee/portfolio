# PF-013 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-013 — Deploy the frontend and backend from GitHub Actions after the checks pass · **Plan**: [PF-013-ci-deploy.md](PF-013-ci-deploy.md) · **Master plan section**: `../portfolio-implementation-plan.md` §2 (CI/CD row), §8.D and §8.E · **Status**: **Confirmed** · **Last updated**: 2026-11-24

## 1. Problem and goal

The frontend is live on Vercel, but Vercel builds every push to `main` on its own, even when the `check` job in `.github/workflows/frontend.yml` fails, and its working install and build commands exist only as dashboard overrides. The backend went live on Render on 2026-11-24, deployed for the first time by the owner through the Render dashboard, and until now the master plan had Render auto-deploy from `main`. Render's own auto-deploy would deploy every push to `main` without waiting for the backend checks in `.github/workflows/backend.yml`. The owner wants one rule for both apps: a push or merge to `main` runs the checks, and only a green check deploys. The frontend build setup also moves into the repository. A hiring manager reading the repository should see a single, checked path from commit to production for each app. No visitor-facing behavior changes: this is a CI chore.

## 2. Scope

**In scope**

- A `deploy` job in `.github/workflows/frontend.yml` that needs the `check` job and deploys production with a pinned Vercel CLI (D1, D3).
- `frontend/vercel.json` with the install and build commands pinned to pnpm 11.0.9, and Vercel's Git deployments turned off (D1, D2).
- The backend deploy to Render: a `deploy` job in `.github/workflows/backend.yml` that needs the backend `check` job and calls Render's deploy hook with the checked commit's SHA (D8).
- A deploy trigger in both workflows on a push to `main` that touches the workflow's paths, and on a manual `workflow_dispatch` run on `main` (D4).
- Concurrency rules in both workflows that never cancel a run on `main` (D5).
- Docs updates.

**Out of scope (deferred)**

- Preview deployments for pull requests: Dependabot pull requests cannot read repository secrets and the owner does not need previews now; a separate job can add them later (D6).
- A GitHub `environment:` with a production URL and protection rules: environments are not available for private repositories on the GitHub Free plan, so it waits for launch (PF-009), when the repository goes public (D7).
- Waiting in GitHub for Render's deploy result: the backend `deploy` job succeeds once Render accepts the deploy (D9).
- Changing Render's health check path and the UptimeRobot keep-alive: a separate ticket, because the security chain blocks `/actuator/health/liveness` today.
- `@vercel/analytics`, `robots.txt`, `sitemap.xml`, and `og-image.png`: they stay with PF-012.
- Changing any Vercel, Render, or GitHub settings: these are owner steps. For the backend, the owner creates the Render deploy hook, stores it as the repository secret `RENDER_DEPLOY_HOOK_URL`, and sets Render Auto-Deploy to Off.

## 3. Functional requirements

FR-1 to FR-8 cover the frontend workflow, `.github/workflows/frontend.yml`; FR-9 to FR-14 cover the backend workflow, `.github/workflows/backend.yml`.

- **FR-1**: On a push to `main`, the `deploy` job runs only after the `check` job passes; if `check` fails, `deploy` is skipped. Source: clarified 2026-11-23, D1
- **FR-2**: A pull request runs the `check` job only and never the `deploy` job. Source: clarified 2026-11-23, D4, D6
- **FR-3**: A manual `workflow_dispatch` run on `main` runs `check` and then `deploy`, so the owner can rebuild after changing `VITE_API_URL` in Vercel without a code change. Source: clarified 2026-11-23, D4
- **FR-4**: `frontend/vercel.json` sets `"git": { "deploymentEnabled": false }`, so Vercel creates no deployment from a Git push and the workflow is the only path to production. Source: clarified 2026-11-23, D1
- **FR-5**: `frontend/vercel.json` carries `installCommand` and `buildCommand`, both running pnpm 11.0.9 through `npx`, so the build setup is versioned in the repository. Source: clarified 2026-11-23, D2
- **FR-6**: The job runs Vercel CLI `vercel@66.2.0` from the repository root, not from `frontend/`, in three steps: `vercel pull` for the production settings and environment variables, `vercel build --prod` on the GitHub runner with Node from `.nvmrc`, and `vercel deploy --prebuilt --prod`. `VITE_API_URL` stays in the Vercel settings. Source: clarified 2026-11-23, D3
- **FR-7**: A newer run cancels an older one only for pull requests; a run on `main` is never cancelled midway and later runs queue behind it. Source: clarified 2026-11-23, D5
- **FR-8**: The repository contains no secret value or ID value. The workflow reads only the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`, by name. Source: master plan §8.E, Non-Negotiable 9
- **FR-9**: On a push to `main` that touches the backend workflow's paths (`backend/**`, `.github/workflows/backend.yml`), a `deploy` job in `.github/workflows/backend.yml` runs only after the backend `check` job passes, and is skipped when it fails. Source: clarified 2026-11-24, D8
- **FR-10**: The backend `deploy` job asks Render to deploy exactly the commit that passed, by calling the Render deploy hook with that commit's SHA (`ref` parameter). Source: D8
- **FR-11**: Render deploys the backend only when the workflow asks: Render's own auto-deploy is off. Source: D8
- **FR-12**: A pull request runs the backend `check` job only and never the backend `deploy` job; a manual `workflow_dispatch` run on `main` runs `check` and then `deploy`. Source: D4, D8
- **FR-13**: The backend workflow follows the same concurrency rule as the frontend: a newer run cancels an older one only for pull requests; runs on `main` queue, so deploys reach Render in commit order. Source: D5
- **FR-14**: The deploy hook URL is a secret, under the same rule as FR-8: the repository holds no hook URL, the workflow reads only the repository secret `RENDER_DEPLOY_HOOK_URL` by name, and only the step that calls the hook receives it. Source: Non-Negotiable 9

## 4. Product rules and edge cases

- No visitor-facing behavior changes: the site, its content, and its API calls are the same before and after.
- The Vercel project's Root Directory is already `frontend`, so the CLI runs from the repository root; running it from `frontend/` would make Vercel look for `frontend/frontend`.
- The dashboard install and build overrides become redundant once `vercel.json` carries the commands; the owner may switch them off.
- A failed `deploy` job leaves the previous production deployment live; nothing is half-published because the build runs before the upload.
- A failed or skipped backend `deploy` job leaves the previous Render version live.
- Changing an environment variable on Render redeploys the backend by itself (Render's "Save and deploy"), so no workflow run is needed for that.
- A merge that changes only the frontend never redeploys the backend, and a merge that changes only the backend never redeploys the frontend: each workflow runs only for its own paths. The one shared path is the OpenAPI snapshot `backend/openapi/openapi.json`, which the frontend workflow also watches because the frontend's generated API types come from it, so a merge that changes the snapshot runs both workflows and deploys both apps.

## 5. Interface decisions

**UI**: None. The only changes are the two workflows and `frontend/vercel.json`.

## 6. Open questions

None.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | GitHub Actions deploys production in a `deploy` job that needs the `check` job, so nothing reaches production unless every frontend check passed. Vercel's own Git deployments are turned off with `"git": { "deploymentEnabled": false }` in `frontend/vercel.json`, so there is a single path to production. | The owner wants deploys gated on CI. |
| D2 | 2026-11-23 | The install and build commands move into `frontend/vercel.json` (`installCommand`, `buildCommand`), pinning pnpm 11.0.9 through `npx`. The dashboard overrides become redundant and the owner may switch them off. | Vercel ignored the `packageManager` field under Root Directory `frontend`, and the working commands lived only in the dashboard; versioning them in the repository keeps the build reproducible. |
| D3 | 2026-11-23 | The job runs a pinned Vercel CLI (`vercel@66.2.0`, the version Vercel's own build used) from the repository root, not from `frontend/`: `vercel pull` for production settings and environment variables, `vercel build --prod` on the GitHub runner with Node from `.nvmrc`, then `vercel deploy --prebuilt --prod`. | The project's Root Directory is already `frontend`. Pulling the settings keeps `VITE_API_URL` in the Vercel settings and out of the repository. |
| D4 | 2026-11-23 | The deploy runs on a push to `main` that touches the workflow's paths, and on a manual `workflow_dispatch` run on `main`. Pull requests never deploy. Extended on 2026-11-24 to both `.github/workflows/frontend.yml` and `.github/workflows/backend.yml`. | The owner can rebuild the frontend after changing `VITE_API_URL` in Vercel without a code change, and both apps follow one rule (D8). |
| D5 | 2026-11-23 | A newer run cancels an older one only for pull requests; runs on `main` are never cancelled midway and queue instead, so deploys reach production in commit order. Extended on 2026-11-24 to both workflows. | A deploy must not be killed half-done. |
| D6 | 2026-11-23 | Preview deployments for pull requests are out of scope and deferred; they can be added later as a separate job. | Dependabot pull requests cannot read repository secrets, and the owner does not need previews now. |
| D7 | 2026-11-23 | A GitHub `environment:` with a production URL and protection rules is out of scope and deferred to launch (PF-009). | Environments are not available for private repositories on the GitHub Free plan; the repository goes public at launch. |
| D8 | 2026-11-24 | The backend deploys from a `deploy` job in `.github/workflows/backend.yml` that needs the `check` job and calls Render's deploy hook with `ref=<commit SHA>`, so Render builds exactly the checked commit. Render's auto-deploy is off; calling a deploy hook with `ref` turns it off, and the owner also sets Auto-Deploy to Off. | One rule for both apps; Render's "After CI Checks Pass" setting would also gate on checks, but it lives outside the repository, and the deploy would not show in the Actions run next to the checks. |
| D9 | 2026-11-24 | The backend `deploy` job succeeds when Render accepts the deploy, not when the new version is live; waiting for the result is deferred. | Polling Render's deploy status needs an account-wide Render API key stored in GitHub. Render emails the owner when a deploy fails, and the previous version stays live. |

## 8. Acceptance criteria (refined)

AC-1 to AC-7 cover the frontend workflow; AC-8 to AC-12 cover the backend workflow.

- **AC-1**: A push to `main` that touches the frontend paths runs `check` and then `deploy`, and `deploy` is skipped when `check` fails.
- **AC-2**: A pull request runs `check` and never `deploy`.
- **AC-3**: A `workflow_dispatch` run on `main` runs `check` and `deploy`.
- **AC-4**: Once `frontend/vercel.json` carries `git.deploymentEnabled: false`, Vercel creates no Git-triggered deployment for a push.
- **AC-5**: `vercel build --prod`, run from the repository root with the pulled production settings, completes using the commands in `frontend/vercel.json`.
- **AC-6**: A second push to `main` queues behind a running deploy instead of cancelling it, while a new push to a pull request cancels the older run of that pull request.
- **AC-7**: The repository contains no secret value, and the workflow reads only the three named secrets.
- **AC-8**: A push to `main` that touches the backend paths runs the backend `check` and then `deploy`, and Render's Events page shows a deploy of that same commit; `deploy` is skipped when `check` fails.
- **AC-9**: A pull request that touches the backend runs the backend `check` only.
- **AC-10**: A `workflow_dispatch` run of the backend workflow on `main` runs `check` and `deploy`.
- **AC-11**: After the change, Render starts no deploy on its own for a push to `main`.
- **AC-12**: The repository contains no deploy hook URL, and the backend workflow reads only `RENDER_DEPLOY_HOOK_URL` by name, in the step that calls the hook.
