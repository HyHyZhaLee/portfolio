# PF-012 — robots.txt

**Ticket**: PF-012 · **Refined requirement**: [PF-012-refined-requirement.md](PF-012-refined-requirement.md) · **Packages**: frontend · **Status**: Approved 2026-11-25 · **Last updated**: 2026-11-25

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

Serve a valid `robots.txt` that lets every crawler read every page, one of the PF-012 deploy items (`../portfolio-implementation-plan.md` §6 SEO checklist and §8). Today `/robots.txt` falls through the SPA rewrite and returns `index.html`, which Lighthouse's `robots-txt` audit rejects: SEO scores 92 on `/` and 91 on a case study (PF-015 S5, PF-026 S5), the only failing SEO audit. `sitemap.xml`, `og-image.png`, and `@vercel/analytics` stay open in PF-012.

## 4. Approach

- **D1 — A static file.** `frontend/public/robots.txt` with a one-line comment, `User-agent: *`, and `Allow: /`. Vite copies `public/` into `dist/`, and Vercel serves a file from the output before the `vercel.json` rewrite, the same mechanism that serves the prerendered case-study pages (PF-009), so no config changes.
- **D2 — No `Sitemap:` line yet.** It needs an absolute URL, and `/sitemap.xml` does not exist, so the line would point at the SPA rewrite. It is added with `sitemap.xml` (PF-012, planned).
- **D3 — Allow everything.** The site is a public portfolio meant to be found; the API lives on another origin, so nothing on this origin needs hiding. No crawler-specific rules (for example for AI crawlers) without an owner decision; default: allow all.

| Alternative | Why not |
|---|---|
| Generate `robots.txt` in the build (plugin or prerender step) | No value without a dynamic part; a static file is simpler and reviewable |
| `Disallow:` with an empty value | Equivalent; `Allow: /` reads more plainly |
| Add the `Sitemap:` line now with the Vercel URL | Points at HTML until `sitemap.xml` exists, which crawlers report as an error |

## 8. Files, order, risks, tests

**New**: `frontend/public/robots.txt`, `docs/plans/site/PF-012-robots-txt.md`, `docs/plans/site/PF-012-refined-requirement.md`. **Modified**: `frontend/e2e/smoke.spec.ts`, `frontend/CLAUDE.md` (structure line for `public/`), `docs/architecture/frontend.md` (principle 13: what `public/` holds now and what is planned), `docs/prd/backlog.md` (PF-012 row).

**Order**: one slice. The file, then the e2e test, then Lighthouse SEO on `vite preview`, then the docs.

| Risk | Mitigation |
|---|---|
| Vercel's rewrite catches `/robots.txt` anyway | Vercel checks the output files before rewrites (PF-009 relies on it for the case-study pages); the deploy job's success is checked after merge |
| A future rule blocks the site by mistake (`Disallow: /`) | The e2e test asserts `Allow: /` and no `Disallow: /` |

**Tests** (within the test budget):

- `e2e/smoke.spec.ts`: `GET /robots.txt` answers 200 with a `text/plain` content type, contains `User-agent: *` and `Allow: /`, contains no `Disallow: /`, and is not HTML.
- Checked at build time, not asserted: Lighthouse SEO 100 on `/` and a case study, mobile and desktop.

**Results (2026-11-25)**:

| Check | Result |
|---|---|
| `/robots.txt` on `vite preview` | 200, `text/plain`, 65 bytes, ASCII with LF endings and no BOM |
| Lighthouse SEO | 100 on `/` and on `/work/legacy-app-web-port`, mobile and desktop (was 92 and 91); `robots-txt` passes. Performance, accessibility, and best practices unchanged (94, 100, 100 mobile on `/`) |
| Gates | type, lint, format; 146 unit tests; 50 e2e tests |

