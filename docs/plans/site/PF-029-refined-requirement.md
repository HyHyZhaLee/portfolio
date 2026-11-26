# PF-029 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-029 — Launch audit: security, reliability, SEO, accessibility, and content fixes from the 2026-11-25 full-site audit; the content API is dropped · **Plan**: [PF-029-site-audit.md](PF-029-site-audit.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5, §8, §9, §12 and `../cv-portfolio-content-plan.md` §6 · **Status**: **Confirmed** · **Last updated**: 2026-11-26 · **Branch**: `fix/PF-029-site-audit`

## 1. Problem and goal

On 2026-11-25 the owner dropped the planned move of portfolio content into the backend (PF-014 Content API, PF-019 remaining copy, PF-020 certificates in R2) and asked for one last audit of the whole live site for best practices (frontend, backend, accessibility, performance, SEO, operations), all content, and security, with every fix planned as one ticket "that makes it best at once". Four read-only audits (frontend, backend and operations, security and privacy, content) plus read-only production header checks found no critical issue but a set of gaps: a possibly wrong client IP behind Render's proxy (rate limits and unique-visitor hashes), contact messages that can be lost silently, no security headers on the frontend beyond HSTS, soft 404s and missing sitemap, og-image, canonical and structured data, an empty HTML body without JavaScript (mobile LCP 3.0 s), stale claims in the This Portfolio case study, two accessibility gaps, and supply-chain and ops hygiene. Audience: a recruiter's 10-second scan and a hiring manager's deep read (the site is the pitch), engineers reviewing the public code, and the owner operating it on free tiers.

## 2. Scope

**In scope**

- (a) Decisions and docs: ADR 0001 for where data lives; PF-014, PF-019, PF-020 marked Dropped; stale docs fixed; an operations runbook.
- (b) Frontend serving and security headers.
- (c) SEO and sharing.
- (d) Backend privacy and abuse hardening.
- (e) Backend reliability.
- (f) Operations and supply chain.
- (g) Accessibility and resilience.
- (h) Content fixes.
- (i) Full static prerender with hydration.
- (j) A cold-start experiment.
- (k) PF-012's remaining in-repo items (sitemap.xml, og-image.png).

**Out of scope (deferred)**

- A data-retention job: the owner chose to keep data (D3).
- A rotating visitor-hash key: the owner chose permanent retention; revisit with retention.
- Changing the stats cache invalidation: PF-023 clears it on each view on purpose, and traffic is low.
- Smaller zod, router, or font builds and splitting case-study card data from article data: small gains.
- A lockfile for the Vercel CLI and a narrower `secrets: inherit`: low value, and the reason is documented.
- knip, Trivy, zizmor, OWASP dependency-check: new tools for little gain; Dependabot, dependency review, and CodeQL already run.
- Bigger diagram text on phones: the step list carries every fact.
- Hidden source maps: the repository is public.
- Distinct error codes for 413/415: contract churn for no visitor value.
- Vercel Web Analytics: dropped (D5).
- Any keep-alive pinger: ruled out by PF-027 D5.

## 3. Functional requirements

- **FR-1**: Frontend responses carry a strict Content-Security-Policy with no `unsafe-inline` (`connect-src` limited to the environment's API origin), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that denies unused features, `frame-ancestors 'none'` plus `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy: same-origin`, on production and on staging (staging keeps `X-Robots-Tag: noindex`). Source: audit SEC-1, FE-26
- **FR-2**: Hashed files under `/assets/` are cached for one year as immutable. Source: FE-5
- **FR-3**: Unknown URLs answer HTTP 404 with the not-found page; `/` and the seven case-study routes answer 200. Source: FE-1
- **FR-4**: API responses carry `Strict-Transport-Security` and a restrictive Content-Security-Policy (`default-src 'none'; frame-ancestors 'none'`), except Swagger UI and the API docs. Source: SEC-9, BE-18
- **FR-5**: No code path logs a raw IP address: the one-time forwarded-for log (PF-004 D3) is removed. A probe logs only masked addresses (IPv4 /24, IPv6 /48) and only for requests whose `X-Forwarded-For` carries the documentation address `192.0.2.1`. Source: SEC-6, BE-5, D8
- **FR-6**: The client address used for visitor hashing and rate limits is verified against Render's real `X-Forwarded-For` layout on staging, recorded in `docs/knowledge/hosting.md`, and `TRUSTED_PROXY_HOPS` is set to match on both Render services (owner step). Source: SEC-3, BE-6
- **FR-7**: IPv6 client addresses are reduced to their /64 prefix before hashing and rate limiting. Source: SEC-5
- **FR-8**: A global contact limit of 20 submissions per hour across all clients protects the email provider's free quota and counts only messages that would be emailed (honeypot hits excluded), on top of the per-client limit of 3 per hour, which still includes honeypot hits; both answer 429 `RATE_LIMITED`, and the form shows a neutral 429 text, "Too many messages are arriving right now. Please try again later, or reach me on LinkedIn." Source: SEC-4, D14
- **FR-9**: The contact name and subject reject every Unicode control, format, and line or paragraph separator character; the message rejects them too, except tab, line feed, and carriage return. Source: SEC-11
- **FR-10**: `POST /api/v1/visits` stores nothing when the request carries `Sec-GPC: 1`, and answers 202 as usual. Source: SEC-20
- **FR-11**: `POST /api/v1/visits` accepts only the paths `/` and `/work/<slug>` (slug shape `[a-z0-9]+(-[a-z0-9]+)*`, at most 64 characters) and answers anything else with 400 `VALIDATION_FAILED`; the beacon sends only such paths. Source: BE-10, D10
- **FR-12**: The visitor-hash secret is redacted from the configuration record's `toString`; its length is not enforced. Source: SEC-7, D15
- **FR-13**: CSRF protection stays disabled, with the reason written next to the code and in the backend guide; GitHub CodeQL alert #1 is dismissed as "won't fix" with that reason once the owner agrees. Source: SEC-8
- **FR-14**: A contact message left `PENDING` for more than 5 minutes (a crash or shutdown during a send) is moved to `FAILED` by the scheduled retry job, so it is retried within the attempt limit. Source: BE-1
- **FR-15**: The backend shuts down gracefully: in-flight requests may finish for up to 25 seconds. Source: BE-1
- **FR-16**: A permanent email-provider failure (HTTP 400, 401, 403, 422) uses up the message's remaining attempts at once. Source: BE-19
- **FR-17**: `/actuator/health` lists a `contactOutbox` component: `UP` normally, `ATTENTION` when a message has used every attempt without being sent or a `PENDING` message is older than 15 minutes. It never changes the overall status or the HTTP status that visitors' health checks see, and it exposes no details. Source: BE-2
- **FR-18**: The JVM's memory flags fit 512 MB with headroom and the process exits on an OutOfMemoryError; the connection pool suits Neon's scale-to-zero; the image runs the `prod` profile by default. Source: BE-7, BE-9, BE-27
- **FR-19**: `GET /api/v1/projects`, its package, its dependency, configuration, environment variables, tests, and docs are removed; the OpenAPI snapshot and the frontend's generated types are regenerated. Source: BE-4, FE-16, D5
- **FR-20**: A scheduled GitHub Actions workflow runs once a day and on demand against production: the read-only live smoke test, plus a health check that requires status `UP`, `db` `UP`, and `contactOutbox` `UP`; a failed run notifies the owner through GitHub. Source: BE-12
- **FR-21**: Pull-request CI builds the backend Docker image. Source: BE-15
- **FR-22**: Dependabot updates the Docker base images (backend Dockerfile and `compose.yaml`), and the images are pinned by digest. Source: SEC-17, BE-14
- **FR-23**: The Gradle wrapper verifies the distribution's checksum. Source: SEC-18, BE-26
- **FR-24**: The Vercel token is absent from the environment of the step that installs dependencies and builds. Source: SEC-13
- **FR-25**: An operations runbook covers backup and restore on Neon's free plan, the rollback rule (schema migrations expand, then contract), and what to do when the daily check fails. Source: BE-13, BE-23
- **FR-26**: Every indexable route has a canonical URL and `og:url` on the production origin, plus `og:image` (a 1200×630 PNG with alt text), `og:site_name`, and `twitter:card` `summary_large_image`. Source: FE-2, PF-012
- **FR-27**: The home page's prerendered HTML carries the home title and meta description. Source: FE-13, CT-11
- **FR-28**: The home page carries JSON-LD `Person` (name, job title, URL, GitHub and LinkedIn in `sameAs`; no email). Source: FE-2
- **FR-29**: The build generates `sitemap.xml` with `/` and the seven case studies, and `robots.txt` names it. Source: FE-2, FE-24, PF-012
- **FR-30**: Page titles are at most 60 characters and meta descriptions 120–160 characters; a case study may carry a shorter SEO title, and its display title is unchanged. Source: CT-12, CT-13
- **FR-31**: Full static prerender: every prerendered route's HTML contains its page body, the client hydrates it with no hydration error, content shows with JavaScript disabled, and the HTML has no inline executable script. Source: FE-3, FE-4, D4
- **FR-32**: A case-study deep link loads its page chunk without a waterfall. Source: FE-6
- **FR-33**: On a route change (not an anchor jump), focus moves to the page's main heading and a polite live region announces the new page title. Source: FE-10
- **FR-34**: Form fields and interactive skill chips have borders with at least 3:1 contrast. Source: FE-11
- **FR-35**: An error in the system panel, the visit counter, or the status dot shows a quiet fallback and never takes down the page; the router has a root error element. Source: FE-12
- **FR-36**: The mobile menu dialog and its navigation have distinct accessible names, and the contact form says that every field is required. Source: FE-17, FE-18
- **FR-37**: End-to-end tests run axe on `/`, one case study, the open mobile menu, and the certificate dialog, fail on serious or critical violations, and check focus after a route change. Source: FE-22, FE-23
- **FR-38**: Unused exports and dead code are removed. Source: FE-15
- **FR-39**: Content fixes that change no claim ship without approval: "the five projects above" points to Featured work below; typos and US spelling; one term per concept ("frontend", "project" on cards and buttons, "Amazon Cognito"); consistent punctuation in At a glance; the duplicate skills hint; "I joined the Clockwork team in June 2026"; "without traffic" in the waking note; the retired GitHub item removed from the This Portfolio lesson; SEO title and description lengths (FR-30). Source: CT-3, CT-11–13, CT-15, CT-20, CT-22–27, CT-31
- **FR-40**: Content changes that alter a claim were approved by the owner on 2026-11-25 (D13) and ship as drafted in the plan's content table; the web-port deep dive is removed, hero proof point 3 is unchanged, and the Code Race date waits for the owner's certificate check. The approved changes are: the This Portfolio case study (live today, CI browsers, the waking and unreachable states, releases from tags with staging, the header version), the AI principle in the first person in two places, skill chips added to each case study's Tech used where Skills links to it, and the footer privacy note (opt-outs and retention). Source: CT-1, CT-2, CT-5–8, CT-14, CT-16, CT-19, CT-30
- **FR-41**: The content length rule becomes "depth over length": case studies 300–800 words, About 80–180 words, never padded, in the content conventions and the product guide. Source: CT-4, CT-21, D6
- **FR-42**: SITE-006 and the footer privacy note say that messages and visit records are kept with no fixed deletion date, in wording approved 2026-11-25 (D13). Source: D3
- **FR-43**: ADR 0001 records where data lives; PF-014, PF-019, PF-020 are Dropped in the backlog and their plan docs; stale docs are fixed (README, `docs/architecture/overview.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `docs/plans/README.md`, the PF-012 docs). Source: D1, BE-25, FE-14, CT-32
- **FR-44**: Cold-start experiment: run the extracted jar with class-data sharing (and lazy initialization if it helps), measure the staging cold start before and after, keep the change only if it is at least 20% faster, and record the result in `docs/knowledge/` either way. Source: BE-8

## 4. Product rules and edge cases

- SITE-001 and Non-Negotiable 1 hold: prerendered bodies render the same loading states for API-backed parts that the client's first render shows; nothing waits for the API.
- SITE-002 clarification (approved 2026-11-25, D13): only `/` and `/work/<slug>` count as page views; other paths are rejected by the API and not sent by the beacon.
- SITE-004 additions (approved 2026-11-25, D13): the global limit of 20 submissions per hour, counting only messages that would be emailed; the stricter character rule.
- SITE-005: the retired endpoint is removed, not just unused.
- SITE-006 (approved 2026-11-25, D13): data is kept with no fixed deletion date (D3); the server also honors `Sec-GPC: 1`.
- **API down or asleep:** unchanged from today; the daily check wakes the API once a day (about 0.02 instance hours) and is not a keep-alive.
- **Privacy:** no raw IP is ever logged after this ticket; the probe logs masked addresses only for the marker request; IPv6 /64 grouping makes a household's rotating addresses one visitor; retention is permanent by the owner's choice.
- **Abuse:** per-client and global contact limits; visit path allowlist; existing honeypot and Bean Validation unchanged.
- **CSP:** the HTML must never contain inline executable script; JSON-LD is a data block (verify browsers do not block it under the policy).
- **404:** a prerendered `404.html` renders a generic not-found body (the path is no longer echoed, so hydration matches any path).

## 5. Interface decisions

**API**: no new endpoints; `GET /api/v1/projects` removed; `POST /api/v1/visits` path rule tightened (400 `VALIDATION_FAILED`) and `Sec-GPC` honored; contact validation stricter, plus a global 429; health gains the `contactOutbox` component with custom status `ATTENTION`, ordered so the aggregate stays `UP`; new response headers (HSTS, CSP) on the API.

**UI**: no layout change. Focus and announcement on route change; darker field and chip borders; "All fields are required." line on the form (exact wording in the plan); generic not-found body; the form's 429 message is neutral: "Too many messages are arriving right now. Please try again later, or reach me on LinkedIn." (replaces "You have sent several messages in the last hour. …"); feature-level error fallbacks render nothing or the status text.

**Content**: safe fixes per FR-39; claim changes per FR-40 drafted in the plan's content table for approval; the og-image shows the owner's name, title, and the "WL" monogram, no portrait (default); JSON-LD omits email and employer (default).

## 6. Open questions

The other questions were resolved on 2026-11-25 by the owner's plan approval, each with its default: full static prerender stays in this ticket (D4), the projects API is removed and Vercel Analytics dropped (D5), the length rule is amended (D6), the SITE-002 path allowlist is accepted (D10), the og-image is text plus the "WL" monogram with no portrait, the global contact limit is 20 per hour, and JSON-LD omits `worksFor`. One item is still open:

- Code Race date: the owner checks the certificate. Default: keep 04/2023 until then.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-25 | Drop PF-014, PF-019, PF-020: editorial copy stays in the frontend; ADR 0001 records the rule (copy that changes only through a pull request and is the same for every visitor ships in the frontend bundle; data created at runtime, aggregated, per visitor, private, needing a secret, or describing the running system lives in the backend; the backend refers to frontend content by slug only). | The content API produced three copies of the same text with no visitor-facing change. Source: owner. |
| D2 | 2026-11-25 | One ticket for all audit fixes, built in slices of one sitting and shipped as several pull requests. | The owner asked to fix everything at once; slices keep each sitting small. Source: owner. |
| D3 | 2026-11-25 | Data retention: keep forever; no deletion job; SITE-006 and the privacy note state it. | Owner's choice in the clarifying round. Source: owner. |
| D4 | 2026-11-25 | Full static prerender of page bodies with hydration, as the last slices. | Biggest lever for mobile LCP and no-JavaScript readers; recommended default, confirmed by the owner's plan approval on 2026-11-25. Source: default. |
| D5 | 2026-11-25 | Remove `GET /api/v1/projects`; drop `@vercel/analytics` from PF-012. | Unused code and a duplicate analytics source; the ADR 0001 rule. Source: default, confirmed by the owner's plan approval on 2026-11-25. |
| D6 | 2026-11-25 | Content length rule amended to depth over length (case studies 300–800 words, About 80–180). | Held Tier B items make 500 words unreachable without padding. Source: default, confirmed by the owner's plan approval on 2026-11-25. |
| D7 | 2026-11-25 | PF-012's remaining in-repo items (sitemap.xml, og-image.png) move into PF-029; PF-012 is Done when PF-029's SEO slice merges; PF-012's owner steps move to PF-029's owner checklist. | One ticket owns the whole SEO slice. Source: default. |
| D8 | 2026-11-25 | Verify the client IP layout on staging with a marker-gated, masked probe; remove the raw one-time log. | Settles an unverified assumption without logging a raw IP (Non-Negotiable 3). Source: default. |
| D9 | 2026-11-25 | The audit's low-value items are not done (see Out of scope). | Small gains do not justify the cost. Source: default. |
| D10 | 2026-11-25 | Visits accepted only for `/` and `/work/<slug>` paths. | Bounds stored paths with the data kept forever. Source: default, confirmed by the owner's plan approval on 2026-11-25 as a SITE-002 change. |
| D11 | 2026-11-25 | Content: changes that alter no claim ship without approval; claim changes ship only once approved at the gate. | Nothing is invented and Tier B needs approval. Source: Non-Negotiable 2. |
| D12 | 2026-11-25 | The two possible Tier C hits (a client name in Experience and a bug-bounty vendor reference in a case study) are covered by the owner's 2026-11-22 decision to keep product, vendor, and client names in "Name - descriptor" form matching the master CV; no change. | Already decided by the owner. Source: owner decision 2026-11-22. |
| D13 | 2026-11-25 | The owner approved the plan and its content table: every row marked approved ships as drafted (the This Portfolio outcome, cold-start, staging-and-releases, static-HTML and deep-dive lines; the first-person AI principle; skill chips added to Tech used; the footer privacy note and the counted-visit note; the og-image; the rule changes to the length rule, SITE-002, SITE-004, SITE-005 and SITE-006). The TPMA/DCA web-port deep dive is removed. Hero proof point 3 keeps today's text. The Code Race date waits for the owner's certificate check. | Owner approval at the plan gate (Non-Negotiable 2). |
| D14 | 2026-11-26 | The global contact limit (20 per hour for all clients) counts only messages that would be emailed: honeypot hits no longer count toward it, but still count toward the per-client limit of 3 per hour. The form's 429 message becomes neutral: "Too many messages are arriving right now. Please try again later, or reach me on LinkedIn." Accepted cost: honeypot spam is bounded per client only. | Review finding #2, owner-approved: bots must not be able to lock real visitors out, and the message must not blame a visitor who sent nothing. |
| D15 | 2026-11-26 | The visitor-hash secret has no minimum length; only the redacted `toString` from FR-12 stays. | Owner decision 2026-11-26: requiring a longer secret is not necessary, and it would force a secret change on both Render services. |

## 8. Acceptance criteria (refined)

- **AC-1**: Production and staging HTML responses carry the FR-1 headers, staging also carries `X-Robots-Tag: noindex`, and the site works with the CSP enforced: no CSP violation in the console on `/`, a case study, and the contact form.
- **AC-2**: A hashed file under `/assets/` is served with a one-year immutable cache header.
- **AC-3**: `/no-such-page` and `/work/no-such-study` answer 404 with the not-found page on staging, while `/` and each of the seven case-study routes answer 200.
- **AC-4**: API responses carry `Strict-Transport-Security` and the restrictive CSP, and Swagger UI and the API docs still load.
- **AC-5**: A staging request carrying `X-Forwarded-For` with `192.0.2.1` logs only masked addresses, no log line holds a raw IP, and `docs/knowledge/hosting.md` records the layout and the `TRUSTED_PROXY_HOPS` value.
- **AC-6**: Two different IPv6 addresses in one /64 share one rate-limit bucket and hash to the same visitor.
- **AC-7**: The 21st contact submission within an hour that would be emailed, sent from different clients, answers 429 `RATE_LIMITED`; honeypot hits do not count toward that limit; a fourth submission from one client answers 429.
- **AC-8**: A contact name containing U+2028 answers 400, and a message containing a line feed is accepted.
- **AC-9**: A visit with `Sec-GPC: 1` answers 202 and stores no row.
- **AC-10**: A visit with path `/admin` answers 400 `VALIDATION_FAILED`, and visits for `/` and `/work/<slug>` answer 202.
- **AC-11**: The configuration record's `toString` shows no secret.
- **AC-12**: A `PENDING` contact message older than 5 minutes is retried by the scheduled job and ends `SENT` or within its attempt limit.
- **AC-13**: A 401 from the email provider leaves the message at its maximum attempts after one try.
- **AC-14**: Health shows `contactOutbox` `ATTENTION` for an exhausted message with overall status `UP` and HTTP 200, and exposes no details.
- **AC-15**: `GET /api/v1/projects` answers 404 and no code, config, test, or doc references the projects API.
- **AC-16**: The daily workflow runs green against production and fails when health is not `UP` for the overall status, `db`, and `contactOutbox`.
- **AC-17**: Pull-request CI builds the backend Docker image, Dependabot covers Docker, and base images are pinned by digest.
- **AC-18**: The Gradle wrapper verifies its checksum, and the Vercel token is absent from the install and build step's environment.
- **AC-19**: `sitemap.xml` lists eight URLs and `robots.txt` names it.
- **AC-20**: Each route's HTML has canonical, `og:url`, `og:image`, and `twitter:card`, the home page has JSON-LD `Person` without email, and no browser reports a CSP block on it.
- **AC-21**: Every page title is at most 60 characters and every meta description is 120–160 characters.
- **AC-22**: With JavaScript disabled, `/` and a case study show their text, the HTML has no inline executable script, and end-to-end tests show no hydration error.
- **AC-23**: Mobile Lighthouse performance on `/` is at least 97 locally.
- **AC-24**: axe reports no serious or critical violation on `/`, one case study, the open mobile menu, and the certificate dialog, and focus lands on the new page's heading after a route change.
- **AC-25**: Form field and skill chip borders measure at least 3:1, the mobile menu dialog and navigation have distinct accessible names, and the form says that every field is required.
- **AC-26**: A thrown error in the system panel, visit counter, or status dot leaves the page working with a quiet fallback.
- **AC-27**: Approved content changes match the plan's content table, unapproved ones are absent, the safe fixes of FR-39 are present, and the length rule reads "depth over length" in the conventions and the product guide.
- **AC-28**: ADR 0001 exists, PF-014, PF-019, and PF-020 show Dropped in the backlog and their plan docs, the stale docs are fixed, and the runbook exists.
- **AC-29**: The cold-start result is recorded in `docs/knowledge/`, and the change is kept only if staging cold start improved by at least 20%.
