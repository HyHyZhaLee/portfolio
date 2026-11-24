# PF-022 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-022 — Wake the backend on page load, count every visit, show the live service state · **Plan**: [PF-022-wake-and-live-status.md](PF-022-wake-and-live-status.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5 (visits, cold-start handling) and §8.F (keep-alive) · **Status**: **Confirmed** · **Last updated**: 2026-11-24

## 1. Problem and goal

The owner asked on 2026-11-24: "Fix for me that when ever we go to the page, it should send 1 signal to wake up the backend then sending email won't take so long and it should be able to count visitors correctly, also the status color here should reflect correct state of the services". The attached screenshot of the hero status panel shows all four rows green (Your browser Here, React frontend Loaded, Spring Boot API Online, PostgreSQL Connected) and the note "The API is online and answering." without "Your visit was counted anonymously." Production (Render backend, Neon database) had 0 stored page views on 2026-11-24 after the owner visited the live site. A production cold start of the Render backend measured 78.8 s to the first byte, and the site's cold-start timeout was 75 s, so after every sleep the health check, the visit, and the contact message timed out. Today a page load sends one health check (100 s timeout, no retry) and, in parallel, one visit (100 s timeout, no retry), so a cold start longer than one attempt or one dropped request loses the view for good and leaves the panel grey "Unreachable" even after the API wakes. A local production build against a local backend did record the view, but the footer counter read 0, because the totals were requested at the same moment as the view and the backend caches the totals for 60 s. The goal: every page load wakes the backend early so a contact message sent soon after does not wait for a cold start, every visit is counted and shows in the footer counter, and the status colors follow the real state of each service. The audiences are a recruiter or hiring manager visiting the site, and the owner reading the stats.

## 2. Scope

**In scope**

- One wake signal per page load: the shared health check starts as soon as the app starts, on every route (D1).
- Two retries of a failed health check, and a bounded periodic re-check while the tab is visible (D2, D3).
- The page view sent only after the health check has answered, with queued views sent in order (D4).
- The footer counter including the visitor's own visit, by evicting the backend's cached totals when a view is stored and refreshing the counter afterwards (D5).
- The status colors: green, amber, red, and grey, with their meanings (D6).
- Public `GET` and `HEAD /actuator/health/liveness`, with no database check (D7).
- Product-rule updates to SITE-001 (the status reflects the live state, with the colors) and SITE-002 (when a view is sent), and the related docs.

**Out of scope (deferred)**

- Switching Render's Health Check Path to `/actuator/health/liveness` and creating the UptimeRobot monitor on it every 5 minutes: owner steps, not code.
- Making the contact email delivery asynchronous: not requested; the early wake removes the cold-start wait instead.
- Ad-blocker-proof tracking: a view blocked by the visitor's browser stays uncounted.
- Any new public copy beyond the existing status labels: the colors are the only visible change.

## 3. Functional requirements

- **FR-1**: The shared health check (`GET /actuator/health`) starts as soon as the app starts, when the app mounts, on every route. Source: D1
- **FR-2**: The status panel and the footer dot read this same health check; a page load sends no second wake request. Source: D1
- **FR-3**: A failed health check attempt (timeout or network error) is retried twice, after 3 s and after 10 s, before the panel shows Unreachable, so a cold start longer than one 100 s attempt still ends Online. Source: D2
- **FR-4**: While the tab is visible, the health check repeats every 60 s for the first 15 minutes on the page. Source: D3
- **FR-5**: When the visitor returns to the tab after more than 60 s, the health check runs again. Source: D3
- **FR-6**: A hidden tab never re-checks, and no re-check starts after the first 15 minutes on the page (a return to the tab after that does not restart the cap). Source: D3
- **FR-7**: The page view is sent only after the health check has answered. A route opened before that is queued, and the queued views are sent in route order once it answers. Source: D4
- **FR-8**: A view is never retried, because a retry could count one view twice. If the API never answers during the page load, the queued views are not sent. Source: D4
- **FR-9**: The existing visit rules of SITE-002 still apply unchanged: no view is sent with `?notrack` in the URL, with Global Privacy Control on, or outside a production build. Source: SITE-002 (unchanged)
- **FR-10**: When the backend stores a view, it drops its cached totals, so the next totals request counts that view. Source: D5
- **FR-11**: After the frontend's view is recorded, the footer counter refreshes, so it includes the visitor's own visit. Source: D5
- **FR-12**: The API row of the panel and the footer dot use these tones: green when the API answered, amber (breathing) while waking or re-checking after a failure, red when the API is unreachable after the retries, and grey while not known yet (the first 3 s of checking). Source: D6
- **FR-13**: The database row uses these tones: green when connected, red when the API reports its database unavailable, grey while waiting and when the API is unreachable. The browser and frontend rows stay green. Source: D6
- **FR-14**: The tone is never the only signal: each row keeps its text label. Source: D6, SITE-001
- **FR-15**: `GET` and `HEAD /actuator/health/liveness` are public and answer 200 while the application runs. The answer has no database component, so a keep-alive on it never wakes Neon. `/actuator/health` stays the page's check because it reports the database. Source: D7
- **FR-16**: Each health check attempt, the visit, and the contact message wait up to 100 s for an answer before failing (D8). Source: D8

## 4. Product rules and edge cases

- **Content never waits for the API (SITE-001, Non-Negotiable 1):** the page renders at once; the health check, retries, and queued views run in the background and never block or hide content.
- **Bot-flagged views:** a view the backend flags as a bot is not stored, so it does not evict the totals cache.
- **Background re-checks:** while a re-check runs after a success, the panel keeps showing the last known state.
- **Failed re-check:** a re-check that fails after its retries turns the API row red; a later successful re-check turns it green again and sends any queued views.
- **Slower Unreachable:** with the retries, Unreachable appears after about 13 s plus the attempt times; the panel shows grey, then amber, in the meantime.
- **A visitor who leaves during a cold start** is not counted, because the view waits for the API. This is accepted: before this change such a view usually timed out as well.
- **Free-tier fit (Non-Negotiable 6):** re-checks run only in a visible tab and only for 15 minutes, so a forgotten tab cannot keep Render and Neon awake. The 24/7 keep-alive uses the liveness path, which never reaches the database. Neon Free has 100 compute-hours a month and a database kept awake all day needs about 186.
- **Privacy:** nothing new is stored about a visitor. A view stays anonymous; the health check carries no visitor data.
- **Abuse:** rate limits are unchanged, 30 views per minute per client address. The liveness path is read-only and has no input.
- **API down or asleep:** the content shows as usual; the panel moves from grey to amber to red, and no view is sent until the API answers.

## 5. Interface decisions

**API**: `GET /actuator/health/liveness` answers 200 `{"status":"UP", ...}` with no `db` component, and `HEAD` answers 200. Both are public with no rate limit, like `/actuator/health`. `/actuator/health` and `POST /api/v1/visits` are unchanged, and the OpenAPI contract does not list actuator paths.

**UI**: no new components or copy. The status dot gains a red tone next to its text label, and the amber tone also shows while re-checking after a failure. The existing labels, the page title, and the meta description are unchanged.

**Content**: no new public text.

## 6. Open questions

None. The defaults in the decision log are in force; the owner may change them.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | One wake signal per page load: the shared health check starts as soon as the app starts, when the app mounts, on every route. It is the same request the panel and the footer read; there is no second wake request. | The owner wants one signal on every page load so a contact message does not wait for a cold start. Reusing the existing request avoids a duplicate call. |
| D2 | 2026-11-24 | A failed health check attempt (timeout or network error) is retried twice, after 3 s and 10 s, before the panel shows Unreachable. Supersedes PF-003's "one health check per page load, no retry" (PF-003 FR-9, FR-10). | A cold start longer than one 100 s attempt, or one dropped request, left the panel grey after the API woke. |
| D3 | 2026-11-24 | While the tab is visible, the health check repeats every 60 s for the first 15 minutes on the page, and again when the visitor returns to the tab after more than 60 s. A hidden tab never re-checks. | The panel stays true while the visitor reads. The 15-minute cap stops a forgotten tab from keeping Render and Neon awake. |
| D4 | 2026-11-24 | The page view is sent only after the health check has answered. Routes opened before that are queued and sent in order. A view is never retried. If the API never answers during the page load, the queued views are not sent. Supersedes PF-005's parallel beacon. | Production stored 0 views because the view raced the cold start. A retry could count one view twice when the first attempt reached the server late. |
| D5 | 2026-11-24 | The footer counter includes the visitor's own visit: the backend drops its cached totals whenever a view is stored (an application event from visit to stats, keeping the dependency one-way), and the frontend refreshes the counter after the view is recorded. | The counter read 0 locally because the totals were fetched with the view and cached for 60 s. Evicting on write is exact. |
| D6 | 2026-11-24 | Status colors: green = the service answered or the database is connected; amber (breathing) = waking up, or re-checking after a failure; red = the API is unreachable after the retries, or the API reports its database unavailable; grey = not known yet (the first 3 s of checking, and the database row while waiting or when the API is unreachable). The browser and frontend rows stay green. The color is never the only signal: the text label stays. | The owner wants the colors to reflect the correct state of each service. Grey for "down" hid real failures. |
| D7 | 2026-11-24 | `GET` and `HEAD /actuator/health/liveness` become public. It never checks the database, so Render's health check and an UptimeRobot keep-alive can keep the API warm 24/7 without keeping Neon awake. `/actuator/health` stays the page's check because it reports the database. | `/actuator/health` checks the database, and a database kept awake 24/7 needs about 186 of Neon Free's 100 compute-hours a month. Spring Boot 4.2 serves the liveness path, but the security chain answers it 404 today. |
| D8 | 2026-11-24 | The cold-start timeout shared by the health check, the visit beacon, and the contact form goes from 75 s to 100 s. | Render's cold start measured 78.8 s, longer than 75 s; with 100 s one attempt survives a cold start, and a message sent while the API wakes is no longer reported as failed when it actually arrives. |

All decisions were chosen by Claude as defaults on 2026-11-24, after the owner asked for the fix; the owner may change them.

## 8. Acceptance criteria (refined)

- **AC-1**: A page load sends exactly one health check request at start (plus retries only after a failure), shared by the panel and the footer.
- **AC-2**: With the first attempt failing and the second succeeding, the panel ends Online (green) and the view is then sent.
- **AC-3**: With every attempt failing, the panel shows Unreachable in red and no view is sent.
- **AC-4**: No view is sent before the health check answers; views queued before then are sent in route order afterwards.
- **AC-5**: After a recorded view, the footer counter includes it (the totals cache was evicted).
- **AC-6**: The database row is red when the health answer reports the database down.
- **AC-7**: `GET /actuator/health/liveness` answers 200 with no `db` component, and `HEAD` answers 200.
- **AC-8**: A hidden tab sends no re-check, and re-checks stop after 15 minutes.
- **AC-9**: A request that Render holds during a cold start of up to about 100 s still succeeds.
