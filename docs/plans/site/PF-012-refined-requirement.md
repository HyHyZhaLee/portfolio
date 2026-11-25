# PF-012 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-012 — Reviewed copy and first deploy · **Plan**: [PF-012-robots-txt.md](PF-012-robots-txt.md) · **Master plan section**: `../portfolio-implementation-plan.md` §6 SEO checklist and §8 · **Status**: Confirmed · **Last updated**: 2026-11-25

## 1. Problem and goal

PF-012 is a large ticket. Its content swap is done (plan `PF-012-content-swap.md`); this first version of the refined requirement covers the remaining frontend deploy items, and only `robots.txt` is in this slice. Later slices (`sitemap.xml`, `og-image.png`, `@vercel/analytics`) fold into this document. Today `/robots.txt` falls through the SPA rewrite and returns the HTML page, so search crawlers get no valid crawl rules and Lighthouse's `robots-txt` audit fails. SEO scores 92 on `/` and 91 on a case study, and this is its only failing SEO audit. On 2026-11-25 the owner asked to "do PF-012 robots.txt the same way" as PF-015 and PF-026: plan, build, review, pull request, and merge without asking for permission.

## 2. Scope

**In scope**

- A static `robots.txt` that allows every crawler on every path.

**Out of scope (deferred)**

- `sitemap.xml` and the `Sitemap:` line: still PF-012, planned, in a later slice.
- `og-image.png`: still PF-012, planned, in a later slice.
- `@vercel/analytics`: still PF-012, planned, in a later slice.
- Crawler-specific rules (for example for AI crawlers): they need an owner decision.

## 3. Functional requirements

- **FR-1**: `/robots.txt` is served as plain text and allows every user agent on every path. Source: master plan §6, clarified 2026-11-25
- **FR-2**: It carries no `Sitemap:` line until `sitemap.xml` exists. Source: clarified 2026-11-25
- **FR-3**: Nothing else changes: pages, titles, and the SPA rewrite. Source: clarified 2026-11-25

## 4. Product rules and edge cases

- **Allow all:** the site is a public portfolio meant to be found, and the API lives on another origin, so nothing on this origin needs hiding.
- **API down or asleep:** not applicable; this is a static file.
- **Privacy:** nothing is stored or sent about a visitor.
- **Abuse:** not applicable, because there are no new endpoints or forms.
- **Guard against a blocked site:** a future rule must not block the whole site by mistake, so the test rejects `Disallow: /`.

## 5. Interface decisions

**API**: none.

**UI**: no visible change. No new UI strings, and page titles and meta descriptions are unchanged.

**Content**: no new public content blocks; disclosure tiers are unaffected.

## 6. Open questions

- Should specific crawlers (for example AI training crawlers) be blocked? Proposed default: allow all, until the owner decides.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-25 | `robots.txt` is a static file in `frontend/public/`, with no config changes. | Vite copies `public/` into `dist/`, and Vercel serves a file from the output before the `vercel.json` rewrite, as it does for the prerendered case-study pages (PF-009). A generated file adds nothing without a dynamic part. |
| D2 | 2026-11-25 | No `Sitemap:` line yet. | It needs an absolute URL and `/sitemap.xml` does not exist, so the line would point at the SPA rewrite and crawlers would report an error. It is added with `sitemap.xml`. |
| D3 | 2026-11-25 | Allow everything, with no crawler-specific rules. | A public portfolio meant to be found; blocking specific crawlers needs an owner decision. |
| D4 | 2026-11-25 | The owner asked for no permission prompts, so the plan was approved by the orchestrating session on 2026-11-25. | Owner instruction 2026-11-25. |

## 8. Acceptance criteria (refined)

- **AC-1**: An e2e test: `GET /robots.txt` answers 200 with a `text/plain` content type, contains `User-agent: *` and `Allow: /`, does not contain `Disallow: /`, and is not HTML.
- **AC-2**: Lighthouse SEO is 100 on `/` and on a case study, mobile and desktop, on `vite preview` (checked at build time).
- **AC-3**: All existing unit and e2e tests still pass.
