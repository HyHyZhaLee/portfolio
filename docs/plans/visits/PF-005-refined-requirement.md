# PF-005 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-005 — Visit tracking and stats: the page_view table, POST /api/v1/visits, GET /api/v1/stats/summary, the frontend beacon with ?ref= and ?notrack=1, and the footer counter · **Plan**: [PF-005-visit-tracking.md](PF-005-visit-tracking.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5.1, §5.2, §6.3, §6.4, §7 Phase 4 · **Status**: **Confirmed** · **Last updated**: 2026-11-23

## 1. Problem and goal

The owner wants to know how many people read the site, which pages they open, and which application link (`?ref=<company>`) brought them, without tracking anyone (Non-Negotiable 3). The footer shows a live counter as part of the "live full-stack app" demo. PF-005 builds on PF-004's platform: client info, visitor hash, rate-limit key, bot flag, rate limiter, and problem JSON. Non-Negotiables 1 (content never waits), 3 (privacy), 4 (abuse limits), 5 (explicit errors), 6 (Flyway), and 8 (free tier) apply.

## 2. Scope

**In scope**

- A Flyway migration for the `page_view` table.
- `POST /api/v1/visits` (202).
- `GET /api/v1/stats/summary` (200, cached for 60 seconds).
- A frontend beacon, in production builds only, which waits out a cold start (D8).
- `?ref=` handling.
- The `?notrack=1` opt-out, and `?notrack=0` to undo it (D5).
- The footer visit counter.
- The live system panel's "counted" note.
- Docs updates.

**Out of scope (deferred)**

- An admin screen for ref results: the owner reads them with SQL in the Neon console (D4), and a protected admin view stays a stretch goal.
- The first deploy: it moves to PF-012.
- Per-page or per-ref statistics in the public API: the public API exposes totals only.
- Showing the "since" date in the footer (D6); the API still returns it.
- Daily rotation of the visitor hash: it is not needed for this scope.

## 3. Functional requirements

- **FR-1**: The frontend records one page view each time the visitor opens a route: the home page and each case study, including the first load. Anchor jumps within a page and query changes do not count. Source: D1, SITE-002
- **FR-2**: The beacon runs only in production builds, sends the path, the referrer reduced to its origin, and the ref tag, and never sets a cookie. It waits up to 75 seconds for an answer, so a view sent while the API wakes from a cold start is still recorded; the page never waits for it. Source: SITE-002, SITE-006, frontend CLAUDE.md, D8, implementation plan §6.3
- **FR-3**: No view is sent when the visitor has opened `?notrack=1` in that browser (remembered in local storage until `?notrack=0` removes it) or when Global Privacy Control is on; where storage is blocked, the opt-out holds for the rest of the page load. Source: SITE-002, Non-Negotiable 3, D5, D9
- **FR-4**: A `?ref=` value is read on load, kept for the browser session, sent with every view of that session, and removed from the address bar; `?notrack` is removed from the address bar too. Other query parameters and the hash stay. Source: SITE-003
- **FR-5**: `POST /api/v1/visits` accepts `{path, referrer, ref}`. `path` is required, starts with "/", has at most 255 characters, and has no query, fragment, or control character (U+0000 to U+001F, U+007F); `referrer` (optional) has at most 2048 characters; `ref` (optional) has at most 256 characters. Invalid input answers 400 `VALIDATION_FAILED` with field errors; a JSON body over 64 KB answers 400 `VALIDATION_FAILED` without field errors, before validation and the rate limit. Source: implementation plan §5.1, Non-Negotiable 4, D10, D11
- **FR-6**: The backend stores the path, the referrer's host only (nothing when the referrer is missing or not an http(s) URL), the ref tag only when it matches `^[a-z0-9-]{1,64}$` (otherwise the view is still stored without it), the visitor hash, the device type, and the browser family, with the time from the server clock. It never stores an IP address, a full user agent, or a full referrer URL. Source: SITE-002, SITE-003, SITE-006
- **FR-7**: A request whose user agent looks like a bot answers 202 like any other and is not stored. Source: SITE-002
- **FR-8**: Each client address may record at most 30 views per minute; more answer 429 `RATE_LIMITED` with `Retry-After`. The limit is checked before the bot filter, so bot-flagged requests count toward it too. Source: SITE-002, PF-004 D6, D7
- **FR-9**: `GET /api/v1/stats/summary` answers `{totalViews, uniqueVisitors, since}`: all stored views, the number of distinct visitor hashes, and the time of the first view (null when there is none). The answer may be up to 60 seconds old. Source: implementation plan §5.1
- **FR-10**: The footer shows "N visits from M visitors" with grouped digits whenever the stats call succeeds, without the "since" date. It hides quietly, without shifting the layout, while the API is checking, waking, or unreachable, or when the stats call fails. Source: D2, D6, SITE-001
- **FR-11**: When the API is online and this page load's view was recorded, the live system panel's note adds "Your visit was counted anonymously." It never says so under `?notrack=1`, Global Privacy Control, a development build, or a failed or rate-limited view. Source: D3
- **FR-12**: Page views are append-only: application code never updates or deletes them. Source: backend guide (Visits)

## 4. Product rules and edge cases

- **SITE-002** now says explicitly that each route opened counts (D1), that `?notrack=0` re-enables tracking (D5), and that bot-flagged requests count toward the address's limit (D7); the owner approved these under the blanket approval of 2026-11-23, and /dev writes them into `docs/product/product-guide.md`. **SITE-003** (the ref tag) and **SITE-006** (no IP, full user agent, or full referrer URL) apply as written.
- A rate-limited or failed beacon is silent for the visitor.
- The page never waits for the beacon or the stats call (Non-Negotiable 1).
- A visitor's ref tag lasts for the browser session only.
- **Cold start:** the first view after an idle period waits up to 75 seconds for the API to wake (D8); if the visitor leaves first, `keepalive` lets the request finish where the browser supports it. The counted note appears only once that view is recorded.
- **Address bar:** only `ref` and `notrack` are removed; other query parameters and the hash stay, and the cleanup never moves the page.
- **Not-found page:** it is a route, so opening it counts as a view of its path; a path longer than 255 characters is rejected with 400 and the beacon ignores it.
- **Storage blocked:** When the browser blocks local or session storage, views are still sent, except that `?notrack=1` still stops every view for the rest of that page load. It cannot be remembered past a reload. The ref tag goes with the first view only.
- **API down or asleep:** the site shows all its content as usual. The footer counter stays hidden without shifting the layout, the panel shows no "counted" note, and the beacon fails silently (Non-Negotiable 1).
- **Privacy:** the database keeps the path, the referrer host, the valid ref tag, the visitor hash, the device type, the browser family, and the time. It never keeps an IP address, a full user agent, or a full referrer URL. No cookie is set, and `?notrack=1` and Global Privacy Control are honored (Non-Negotiable 3).
- **Abuse:** the path, referrer, and ref lengths are validated on the server, each client address is limited to 30 views per minute (bots included, D7), and the bot filter drops bot views (Non-Negotiable 4). JSON request bodies are capped at 64 KB (D11).

## 5. Interface decisions

**API**: Two endpoints. `POST /api/v1/visits` (operationId `recordVisit`) takes `{path, referrer?, ref?}` and answers 202 with no body, 400 `VALIDATION_FAILED`, or 429 `RATE_LIMITED` with `Retry-After` (bots included once the limit is reached, D7). `GET /api/v1/stats/summary` (operationId `getStatsSummary`) answers 200 with `{totalViews, uniqueVisitors, since}`, where `since` may be null, cached for 60 seconds. Fields and limits are in FR-5 and FR-9.

**UI**: The footer counter reads "N visits from M visitors" with grouped digits, without the "since" date (D6), and is hidden in every other state (FR-10). The live system panel's note adds "Your visit was counted anonymously." only after this visit was recorded (FR-11). These are UI strings, not portfolio copy.

**Content**: None: PF-005 adds no portfolio copy.

## 6. Open questions

None. Resolved: "Does `?notrack=0` re-enable tracking?" → yes (D5). "Should the counter show the since date?" → no (D6).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | Each route the visitor opens counts as a page view (home and each case study), not only the first load. | Shows which case studies get read; matches frontend/CLAUDE.md. |
| D2 | 2026-11-23 | The footer counter shows whenever the stats call succeeds, with no minimum threshold, and hides when the API is down or slow. | As the master plan describes. |
| D3 | 2026-11-23 | The live system panel adds "Your visit was counted anonymously." only after this visit was actually recorded. | The approved mockup's note, without ever claiming a visit that was not counted. |
| D4 | 2026-11-23 | Ref-tag results are read with SQL in the Neon console; no admin screen or endpoint in PF-005. | An admin view needs authentication, which is a stretch goal. |
| D5 | 2026-11-23 | `?notrack=0` removes the stored opt-out and re-enables tracking in that browser. | The recommended default for the open question; lets the owner undo the opt-out without clearing site data. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D6 | 2026-11-23 | The footer counter does not show the "since" date; the API still returns it. | The recommended default; keeps the footer line short. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D7 | 2026-11-23 | The rate limit is checked before the bot filter, so a bot-flagged request counts toward its address's 30 views per minute and answers 429 like any other request once the limit is reached. | Backend guide principle 10 and the contact flow check the limit before any work; the stored data is unchanged and a bot learns nothing useful. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D8 | 2026-11-23 | The beacon waits up to 75 seconds (the client's cold-start timeout) and uses `keepalive`, so the first view after an idle period is still counted. | The free-tier API sleeps after 15 idle minutes and can take up to a minute to wake; with the default 15-second timeout most views on a quiet site would be lost (implementation plan §6.3). Pre-approved by the owner (blanket approval, 2026-11-23). |
| D9 | 2026-11-23 | With storage blocked, `?notrack=1` is kept in memory and holds for the page load. | Non-Negotiable 3: an opt-out must not be silently ignored when storage is unavailable. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D10 | 2026-11-23 | The visit path rejects control characters, so a NUL answers 400 instead of a database 500. | PostgreSQL rejects NUL in text; validating first keeps the error a clean 400. Pre-approved by the owner (blanket approval, 2026-11-23). |
| D11 | 2026-11-23 | Public JSON bodies are capped at 64 KB (`spring.jackson.factory.constraints.read.max-document-length`). | An oversized body cannot fill the 512 MB instance's heap before validation and the rate limit (Non-Negotiables 4 and 8). Pre-approved by the owner (blanket approval, 2026-11-23). |

## 8. Acceptance criteria (refined)

- **AC-1**: A valid `POST /api/v1/visits` answers 202 and stores one row with the path, the referrer host only, the valid ref tag, a 64-hex visitor hash, the device type, and the browser family, and no IP, user agent, or full referrer.
- **AC-2**: An invalid path (no leading slash, or a control character such as NUL) answers 400 `VALIDATION_FAILED` with a field error; an invalid ref tag stores the view without the tag.
- **AC-3**: A bot user agent answers 202 and stores nothing.
- **AC-4**: The 31st view in a minute from one client address answers 429 `RATE_LIMITED` with `Retry-After`.
- **AC-5**: `GET /api/v1/stats/summary` reflects new views (within the cache window) with the right total and distinct-visitor counts, and `since` is the first view's time.
- **AC-6**: In a production build the beacon posts on the first load and on each route change (not on an anchor jump), with the ref tag kept for the session and removed from the address bar and the referrer sent as its origin only; it posts nothing in a development build, after `?notrack=1` (for the rest of the page load even when storage is blocked), or under Global Privacy Control, and posts again after `?notrack=0`.
- **AC-7**: The footer counter shows formatted counts ("1,284 visits from 312 visitors"; singular "1 visit from 1 visitor") when the API is online and the stats call succeeds, never asks while the API is unreachable, and is empty otherwise, with no layout shift.
- **AC-8**: The panel note mentions the counted visit only after a successful view, and not after a rate-limited one.
- **AC-9**: The migration runs on an empty database through Flyway; the OpenAPI snapshot and the generated frontend types include the two operations.
