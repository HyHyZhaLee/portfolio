# PF-013 — Deploy the frontend and backend from GitHub Actions

**Ticket**: PF-013 · **Refined requirement**: [PF-013-refined-requirement.md](PF-013-refined-requirement.md) · **Packages**: frontend and backend (CI and hosting config only) · **Status**: Approved 2026-11-23 for the frontend (owner approved the design in chat); extended to the backend on 2026-11-24 at the owner's request in chat · **Last updated**: 2026-11-24 (rebased on `main`, backend deploy job added)

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

Both apps deploy from GitHub Actions, and only after their own checks pass. The frontend's production deploys move from Vercel's Git integration to a `deploy` job in `.github/workflows/frontend.yml` that runs only after the `check` job passes (D1), and the install and build commands that made the first Vercel build work, which lived only as dashboard overrides, move into `frontend/vercel.json` (D2). The backend, deployed to Render by hand for the first time on 2026-11-24 (PF-012), gets the same rule: a `deploy` job in `.github/workflows/backend.yml` that runs after its `check` job and asks Render to deploy exactly that commit (D8). No visitor-facing behavior changes. This changes the CI/CD row of `../portfolio-implementation-plan.md` §2 ("Vercel and Render auto-deploy from `main`") and the §8.D and §8.E runbook steps (private).

## 4. Approach

### Frontend

One workflow owns the frontend from check to production. The `deploy` job `needs: check`, so a red check never reaches production, and `frontend/vercel.json` sets `git.deploymentEnabled: false`, so Vercel no longer builds pushes by itself and there is one path to production (D1). The job runs the Vercel CLI, pinned to `vercel@66.2.0` (the version Vercel's own build used), from the repository root, because the project's Root Directory is already `frontend` (D3):

1. `vercel pull --environment=production` downloads the project settings and environment variables, so `VITE_API_URL` stays in the Vercel settings and never enters the repository. It is stored as a Config variable, not a Secret, because it is public by design (`docs/knowledge/hosting.md`).
2. `vercel build --prod` builds on the GitHub runner with Node from `.nvmrc`, using `installCommand` and `buildCommand` from `frontend/vercel.json` (`npx --yes pnpm@11.0.9 …`), because Vercel ignored the `packageManager` field (D2, `docs/knowledge/hosting.md`).
3. `vercel deploy --prebuilt --prod` uploads the output. A failure in any step leaves the previous production deployment live.

The job runs on a push to `main` that touches the workflow's frontend paths and on a manual `workflow_dispatch` on `main`, which rebuilds production after `VITE_API_URL` changes in Vercel (D4). The job reads three repository secrets by name, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`, which the owner created on 2026-11-23 (Non-Negotiable 9). The two IDs are job environment variables, which the CLI reads; the token is passed only as `--token` to the three `vercel` commands, so the `npm install` step and its install scripts never see it.

### Backend

The backend `deploy` job also `needs: check` and has the same trigger rule: a push to `main` that touches `backend/**` or the workflow, or a manual `workflow_dispatch` on `main` (D4, D8). It has one step: a `curl --fail-with-body` `POST` to Render's deploy hook with `&ref=${GITHUB_SHA}`, so Render builds exactly the commit that passed the checks, not whatever `main` points to by then. Calling a hook with `ref` turns Render's own auto-deploy off, so the workflow becomes the only path to production; the owner also sets Auto-Deploy to Off before the merge. The hook URL carries a key, so it lives in the repository secret `RENDER_DEPLOY_HOOK_URL` and only the curl step receives it, as an environment variable (Non-Negotiable 9). The job ends when Render accepts the deploy; Render builds the Docker image and swaps the service only when the new version passes its health check, emails the owner when a deploy fails, and keeps the previous version live (D9).

### Both workflows

Concurrency cancels an older run only on pull requests (D5). On `main`, a newer run queues behind the running one, so a frontend deploy is never stopped halfway and backend deploys reach Render in commit order. GitHub keeps only one waiting run per group: when several pushes land during a run, only the newest waits and the ones in between are skipped, which is fine because the newest commit contains their changes.

| Alternative | Why not |
|---|---|
| Keep Vercel's Git integration and let it build `main` | Production would not wait for the checks, and a red build could still ship |
| Keep the Git integration and gate it on GitHub checks in Vercel | Depends on a Vercel-side setting outside the repository; the CLI job keeps the whole path in one versioned workflow |
| Run the Vercel CLI with `--cwd frontend` or from `frontend/` | The project's Root Directory is already `frontend`, so the CLI would look for `frontend/frontend` |
| Render's Auto-Deploy "After CI Checks Pass" | Also gates on the checks, but the rule lives in Render's dashboard, and the deploy would not show in the Actions run next to the checks; one rule for both apps is easier to read |
| A deploy hook without `ref` | Render would deploy the branch's latest commit, which may not be the one that passed |
| Poll Render's API until the deploy is live | Needs an account-wide Render API key in GitHub; deferred (D9), since Render already emails on failure and keeps the old version |
| Preview deployments for pull requests | Deferred (D6): Dependabot pull requests cannot read repository secrets, and previews are not needed yet |
| A GitHub `environment: production` with its URL | Deferred to launch (D7): environments are not available for private repositories on the GitHub Free plan |

**Reuse**: the existing `check` jobs, the `.nvmrc` pin, and the pinned `actions/checkout` and `actions/setup-node` versions they already use; the backend job needs no action at all, only `curl` on the runner. **Single responsibility**: each `check` proves its app; each `deploy` publishes it; `frontend/vercel.json` holds every Vercel build setting, and Render's settings keep the backend's runtime configuration.

## 8. Files, order, risks, tests

**New**: `docs/plans/platform/PF-013-ci-deploy.md`, `docs/plans/platform/PF-013-refined-requirement.md`, `docs/knowledge/hosting.md`. **Modified**: `.github/workflows/frontend.yml` (the `deploy` job, `workflow_dispatch`, concurrency), `.github/workflows/backend.yml` (the `deploy` job, `workflow_dispatch`, concurrency), `frontend/vercel.json` (commands, `git.deploymentEnabled`), `frontend/.prettierignore` (`.vercel`, which a local `vercel build` writes under `frontend/`), `frontend/CLAUDE.md`, `backend/CLAUDE.md` (Deploy row), `CLAUDE.md` (production line), `README.md` (deploy sentence under the quality gates), `docs/architecture/frontend.md`, `docs/knowledge/README.md`, `docs/plans/README.md`, `docs/prd/backlog.md`.

**Order**: `frontend/vercel.json` → the frontend workflow → a local `vercel pull` and `vercel build --prod` from the repository root → the backend workflow → docs.

| Risk | Mitigation |
|---|---|
| The Vercel token expires and frontend deploys fail | The owner noted the expiry date; a failed `deploy` job leaves the live site untouched and shows in the Actions tab |
| The dashboard overrides and `vercel.json` disagree later | `vercel.json` wins over the dashboard; the owner can switch the overrides off |
| Changing `VITE_API_URL` in the Vercel settings does not rebuild the site by itself, because Vite bakes the value in at build time | Run the frontend workflow by hand (`workflow_dispatch`, D4) after changing a Vercel environment variable |
| A newer Vercel CLI changes flags | The CLI version is pinned in the workflow; Dependabot does not bump it, so upgrades are deliberate |
| `RENDER_DEPLOY_HOOK_URL` is missing or wrong | The curl step fails the `deploy` job (no silent success), and the live backend stays as it was |
| The backend job is green but Render's build fails | Render emails the owner and keeps the previous version (D9); the Render Events page shows the failed deploy |
| Render's auto-deploy and the workflow both deploy the same commit | The owner sets Auto-Deploy to Off before the merge, and the first hook call with `ref` turns it off anyway |

**Owner steps** (not code), before the merge: in Render, open `will-ly-portfolio-api` → Settings → Deploy Hook and copy the URL; store it as the repository secret `RENDER_DEPLOY_HOOK_URL` (GitHub → Settings → Secrets and variables → Actions); set Render's Auto-Deploy to Off. After the merge, optionally switch off the Install Command and Build Command overrides in the Vercel dashboard (`vercel.json` already wins). The project's Node.js Version setting no longer matters for frontend builds, because the build runs on the GitHub runner and `engines.node` selects Node 24 on Vercel anyway.

**Tests**: no unit tests; workflows and hosting config have no code paths of their own. Verified on 2026-11-23: the frontend workflow parses as YAML with jobs `check` and `deploy` and the three triggers; `vercel pull` from the repository root followed by `vercel build --prod`, with the pulled dashboard commands blanked locally, installed with pnpm 11.0.9 on Node 24 from `frontend/vercel.json` and wrote `.vercel/output` with the SPA rewrite (AC-5); the frontend gates passed (type, lint, format, 92 tests, branch coverage 92.91%). Verified on 2026-11-24: the backend workflow parses as YAML with jobs `check` and `deploy`, triggers `push`, `pull_request`, and `workflow_dispatch`, and the pull-request-only cancel rule. The deploy criteria (AC-1, AC-3, AC-4, AC-6, AC-8, AC-10, AC-11) are checked on the first runs after the merge: the merge commit touches both workflow files, so `frontend.yml` should run `check` then `deploy` (Vercel shows a CLI deployment, not a Git one) and `backend.yml` should run `check` then `deploy` (Render's Events page shows a deploy of the merge commit).
