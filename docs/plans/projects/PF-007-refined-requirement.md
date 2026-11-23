# PF-007 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the agent that planned and built PF-007 (the owner's brief of 2026-11-23 named it the only author).

**Ticket**: PF-007 — Open-source projects: GitHub client with cache, circuit breaker, and fallback, `GET /api/v1/projects`, the section with static fallback data · **Plan**: [PF-007-open-source-projects.md](PF-007-open-source-projects.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5.1, §5.3, §6.3, §7 Phase 6 · **Status**: Confirmed · **Last updated**: 2026-11-23

## 1. Problem and goal

A hiring manager reading the home page should see that Will writes code in public, and the list itself should prove the site is a live full-stack app: it comes from GitHub through the backend. A recruiter scanning must never wait for it or see the page move. So the Open source section shows the owner's public repositories, live when the API answers and from a static list otherwise.

## 2. Scope

**In scope**

- A GitHub adapter that lists the public repositories of `app.github.username` with explicit timeouts and an optional token.
- The selection rule: drop forks, archived, and private repositories; featured repositories first.
- `GET /api/v1/projects`, cached for 1 hour, with a circuit breaker and a fallback, answering 200 even when GitHub is down.
- WireMock standing in for GitHub in integration tests.
- The Open source section on the home page with the static fallback list, the cold-start hint, and a link to the GitHub profile.

**Out of scope (deferred)**

- Reviewed descriptions for the fallback repositories: PF-012 swaps the placeholders (PF-003 D2).
- Making the `portfolio` repository public: a launch step (PF-009).
- Pagination beyond 100 repositories, per-repository detail pages, and a header navigation link to the section: not needed for about 40 repositories and a five-link header.

## 3. Functional requirements

- **FR-1**: The backend reads the public repositories of the configured GitHub user through GitHub's REST API with a 2 s connect and a 5 s read timeout. Source: backend guide principle 8, implementation plan Phase 6
- **FR-2**: A GitHub token is optional in every profile; when set it is sent as a Bearer token and only raises the rate limit; it is never logged. Source: Projects guideline, D8
- **FR-3**: The list drops forks, archived repositories, and private repositories; featured repositories (`app.github.featured`, default `BK2023_Thesis_SmartPole`, `portfolio`) come first in the configured order, matched case-insensitively; the rest follow by last push, newest first. Source: SITE-005, D6, D7
- **FR-4**: A successful result is cached for 1 hour (`app.github.cache-ttl`). Source: SITE-005, implementation plan §5.1
- **FR-5**: A circuit breaker guards the GitHub call; when GitHub fails or the circuit is open, the endpoint answers with the last good result, else an empty list. Source: SITE-005, D9
- **FR-6**: `GET /api/v1/projects` answers 200 `{items: [{name, description, url, homepage, language, stars, topics, updatedAt}]}`; `updatedAt` is the time of the last push. Source: implementation plan Phase 6, D11
- **FR-7**: The home page shows an Open source section between Experience and Education, with a link to the GitHub profile. Source: product guide §3, content plan §6.2, D1
- **FR-8**: The section renders the static list at once and swaps in the first six live repositories once the API is online; it keeps its height in every state. Source: SITE-001, implementation plan §6.3, D2 to D4
- **FR-9**: While the API or the list is still loading after about 3 s, the section shows "Waking up the free-tier API…"; when the API is unreachable, fails, or returns no repositories, it keeps the static list and says live data is unavailable; when live data shows, it says so. Source: implementation plan §6.3, D5
- **FR-10**: Integration tests stub GitHub with WireMock; no test calls the real GitHub API. Source: backend guide principle 14

## 4. Product rules and edge cases

- SITE-005: public repositories that are neither forks nor archived, featured first, cached for an hour, falling back to the last good result and then to the frontend's static list. The home page shows six and links to the profile for the rest (D2).
- A private repository is never listed, even if a token could see it (D7).
- A featured name that is not public (such as `portfolio` before launch) is simply absent from the live list.
- Only successes are cached: after a failure the next request tries GitHub again, unless the circuit breaker is open (D9).
- **API down or asleep:** the six static repositories show from the first paint; the section never waits for the API and never changes height (SITE-001, Non-Negotiable 1).
- **Privacy:** the endpoint reads no visitor data and stores nothing; it sets no cookie (Non-Negotiable 3).
- **Abuse:** a read-only endpoint served from memory; no rate limit; GitHub calls are bounded by the cache, a single refresh at a time, and the breaker (D10).

## 5. Interface decisions

**API**: `GET /api/v1/projects` (`listProjects`), public, 200 `{items}` in every GitHub state; `description`, `homepage`, `language`, and `updatedAt` may be `null`; no error code is added.

**UI**: section `#open-source`, heading "Open source", six fixed-height cards (name linked to the repository, a two-line description, the language and a star count when above zero), one status line above them, and an "All repositories on GitHub" link below. No new route, title, or meta description.

**Content**: fallback repository names and URLs are the owner's public repositories (Tier A): the two featured ones, then the four most recently pushed as of 2026-11-23 (`Intelligent-Systems-Project`, `TrainningReactAndSpring`, `TrainningReactjsAndNextjs`, `TRAINING_WPF_and_WindowsApplications`). Their descriptions are placeholders until PF-012. The profile link is `profile.links.github` (Tier A). Status texts are UI strings about the site.

## 6. Open questions

None. Every question was decided with its recommended default, pre-approved by the owner (blanket approval, 2026-11-23).

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | The section sits between Experience and Education with the anchor `#open-source`; no header navigation link. Pre-approved by the owner (blanket approval, 2026-11-23) | The site map and content plan §6.2 order; the header keeps its five links |
| D2 | 2026-11-23 | The backend returns the whole filtered list (one page of up to 100); the home page shows the first six and links to the profile. Pre-approved by the owner (blanket approval, 2026-11-23) | About 40 public repositories; six keep the section short and its height fixed |
| D3 | 2026-11-23 | The fallback list has six repositories, mirroring today's live order, so loading, live, and fallback all show six cards; no skeleton. Pre-approved by the owner (blanket approval, 2026-11-23) | Reserved space with no layout shift in any state; two fallback cards plus skeletons would shrink whenever the API is down |
| D4 | 2026-11-23 | The projects query waits until the shared health check reports the API online. Pre-approved by the owner (blanket approval, 2026-11-23) | Same rule as the visit counter (PF-005 D2): a request to a sleeping API times out and retries for up to about 48 s |
| D5 | 2026-11-23 | One status line: empty for the first 3 s, then "Waking up the free-tier API…" while waiting; "Live from the GitHub API, refreshed hourly." for live data; "Live data is unavailable right now, so this is a saved list." for the fallback. Pre-approved by the owner (blanket approval, 2026-11-23) | Implementation plan §6.3; the live note shows the visitor the backend at work |
| D6 | 2026-11-23 | Featured names match case-insensitively in the configured order; the rest sort by last push, newest first, unknown last, then by name. Pre-approved by the owner (blanket approval, 2026-11-23) | A stable, owner-controlled order; GitHub names are case-insensitive |
| D7 | 2026-11-23 | Private repositories are dropped as well. Pre-approved by the owner (blanket approval, 2026-11-23) | Defense in depth for disclosure: a token with wider scope must never surface a private name |
| D8 | 2026-11-23 | The token is optional in every profile, including `prod`; backend guide principle 12 no longer lists it as required. Pre-approved by the owner (blanket approval, 2026-11-23) | The Projects guideline: it only raises the rate limit, and the client works without it |
| D9 | 2026-11-23 | The breaker opens after 2 of the last 4 calls failed, stays open 10 minutes (`app.github.circuit-open-for`), then allows one trial call; only successes are cached. Pre-approved by the owner (blanket approval, 2026-11-23) | At most two slow failures before answering at once; a failure never hides GitHub's recovery for an hour |
| D10 | 2026-11-23 | No rate limit on `GET /api/v1/projects`. Pre-approved by the owner (blanket approval, 2026-11-23) | Read-only and served from memory, like the stats summary |
| D11 | 2026-11-23 | `updatedAt` carries GitHub's `pushed_at`; nullable fields are marked nullable in the contract. Pre-approved by the owner (blanket approval, 2026-11-23) | The last push reflects code activity; `updated_at` also changes on stars and settings |
| D12 | 2026-11-23 | The fallback list is content, not `placeholderData` in the query. Pre-approved by the owner (blanket approval, 2026-11-23) | Fallback entries carry only names, URLs, and placeholder descriptions, not invented API fields |

## 8. Acceptance criteria (refined)

- **AC-1**: With GitHub answering, `GET /api/v1/projects` returns 200 with forks, archived, and private repositories removed and the featured ones first, then by last push.
- **AC-2**: The request to GitHub carries the Bearer token when one is configured and none otherwise.
- **AC-3**: With GitHub failing (error status, rate limit, or timeout) after a success, the endpoint answers 200 with the last good items; before any success it answers 200 `{items: []}`.
- **AC-4**: Once the breaker is open, requests answer 200 without reaching GitHub.
- **AC-5**: A result younger than the cache TTL is served without a GitHub call.
- **AC-6**: The home page shows the Open source section with six repositories and the profile link even when the API is unreachable, with no projects request in that case.
- **AC-7**: With the API online, the first six live repositories replace the static ones and the live note shows; an empty list or a problem response keeps the static list with the fallback note; after about 3 s of waiting the waking hint shows.
- **AC-8**: The OpenAPI snapshot and the generated frontend types include `listProjects`.
