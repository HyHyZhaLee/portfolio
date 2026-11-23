# PF-013 — Deploy the frontend from GitHub Actions

**Ticket**: PF-013 · **Refined requirement**: [PF-013-refined-requirement.md](PF-013-refined-requirement.md) · **Packages**: frontend (CI and hosting config only) · **Status**: Approved 2026-11-23 (owner approved the design in chat) · **Last updated**: 2026-11-23 (built and reviewed; verified with a local `vercel build`)

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

Production deploys of the frontend move from Vercel's Git integration to a `deploy` job in `.github/workflows/frontend.yml` that runs only after the `check` job passes (D1). The install and build commands that made the first Vercel build work, which lived only as dashboard overrides, move into `frontend/vercel.json` (D2). No visitor-facing behavior changes. This changes the CI/CD row of `../portfolio-implementation-plan.md` §2 ("Vercel and Render auto-deploy from `main`") for the frontend only, and step 3 of its §8.E runbook (private); Render keeps its own auto-deploy (PF-012).

## 4. Approach

One workflow owns the frontend from check to production. The `deploy` job `needs: check`, so a red check never reaches production, and `frontend/vercel.json` sets `git.deploymentEnabled: false`, so Vercel no longer builds pushes by itself and there is one path to production (D1). The job runs the Vercel CLI, pinned to `vercel@66.2.0` (the version Vercel's own build used), from the repository root, because the project's Root Directory is already `frontend` (D3):

1. `vercel pull --environment=production` downloads the project settings and environment variables, so `VITE_API_URL` stays in the Vercel settings and never enters the repository.
2. `vercel build --prod` builds on the GitHub runner with Node from `.nvmrc`, using `installCommand` and `buildCommand` from `frontend/vercel.json` (`npx --yes pnpm@11.0.9 …`), because Vercel ignored the `packageManager` field (D2, `docs/knowledge/hosting.md`).
3. `vercel deploy --prebuilt --prod` uploads the output. A failure in any step leaves the previous production deployment live.

The job runs on a push to `main` that touches the workflow's frontend paths and on a manual `workflow_dispatch` on `main`, which rebuilds production after `VITE_API_URL` changes in Vercel (D4). The workflow's concurrency now cancels an older run only on pull requests, so a deploy on `main` is never stopped halfway (D5). The job reads three repository secrets by name, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`, which the owner created on 2026-11-23 (Non-Negotiable 9). The two IDs are job environment variables, which the CLI reads; the token is passed only as `--token` to the three `vercel` commands, so the `npm install` step and its install scripts never see it.

| Alternative | Why not |
|---|---|
| Keep Vercel's Git integration and let it build `main` | Production would not wait for the checks, and a red build could still ship |
| Keep the Git integration and gate it on GitHub checks in Vercel | Depends on a Vercel-side setting outside the repository; the CLI job keeps the whole path in one versioned workflow |
| Run the CLI with `--cwd frontend` or from `frontend/` | The project's Root Directory is already `frontend`, so the CLI would look for `frontend/frontend` |
| Preview deployments for pull requests | Deferred (D6): Dependabot pull requests cannot read repository secrets, and previews are not needed yet |
| A GitHub `environment: production` with its URL | Deferred to launch (D7): environments are not available for private repositories on the GitHub Free plan |

**Reuse**: the existing `check` job, the `.nvmrc` pin, and the pinned `actions/checkout` and `actions/setup-node` versions it already uses. **Single responsibility**: `check` proves the build; `deploy` publishes it; `frontend/vercel.json` holds every Vercel build setting.

## 8. Files, order, risks, tests

**New**: `docs/plans/platform/PF-013-ci-deploy.md`, `docs/plans/platform/PF-013-refined-requirement.md`, `docs/knowledge/hosting.md`. **Modified**: `.github/workflows/frontend.yml` (the `deploy` job, `workflow_dispatch`, concurrency), `frontend/vercel.json` (commands, `git.deploymentEnabled`), `frontend/.prettierignore` (`.vercel`, which a local `vercel build` writes under `frontend/`), `frontend/CLAUDE.md`, `docs/architecture/frontend.md`, `docs/knowledge/README.md`, `docs/plans/README.md`, `docs/prd/backlog.md`.

**Order**: `frontend/vercel.json` → the workflow → a local `vercel pull` and `vercel build --prod` from the repository root → docs.

| Risk | Mitigation |
|---|---|
| The token expires and deploys fail | The owner noted the expiry date; a failed `deploy` job leaves the live site untouched and shows in the Actions tab |
| The dashboard overrides and `vercel.json` disagree later | `vercel.json` wins over the dashboard; the owner can switch the overrides off |
| Changing `VITE_API_URL` in the Vercel settings does not rebuild the site by itself, because Vite bakes the value in at build time | Run the workflow by hand (`workflow_dispatch`, D4) after changing a Vercel environment variable |
| A newer Vercel CLI changes flags | The CLI version is pinned in the workflow; Dependabot does not bump it, so upgrades are deliberate |

**Owner steps** (not code): after the merge, switch off the Install Command and Build Command overrides in the Vercel dashboard (optional, `vercel.json` already wins). The project's Node.js Version setting no longer matters for these builds, because the build runs on the GitHub runner and `engines.node` selects Node 24 on Vercel anyway.

**Tests**: no unit tests; a workflow and a hosting config have no code paths of their own. Verified on 2026-11-23: the workflow parses as YAML with jobs `check` and `deploy` and the three triggers; `vercel pull` from the repository root followed by `vercel build --prod`, with the pulled dashboard commands blanked locally, installed with pnpm 11.0.9 on Node 24 from `frontend/vercel.json` and wrote `.vercel/output` with the SPA rewrite (AC-5); the frontend gates passed (type, lint, format, 92 tests, branch coverage 92.91%). AC-1 to AC-4 and AC-6 are checked on the first runs after the merge: the push to `main` should run `check` then `deploy`, and Vercel's dashboard should show the deployment as coming from the CLI, not from Git.
