# PF-004 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-004 — Backend platform: error model, correlation IDs, CORS, security, client info, visitor hashing, bot filter, rate limiting, and a Dockerfile that runs locally · **Plan**: [PF-004-backend-platform.md](PF-004-backend-platform.md) · **Master plan section**: `../portfolio-implementation-plan.md` §5.3, §5.5, §5.6, §7 Phase 3 · **Status**: **Confirmed** · **Last updated**: 2026-11-23 (D6 and review fixes)

## 1. Problem and goal

PF-005 (visits), PF-006 (contact), and PF-007 (projects) all need the same platform: one error format, correlation IDs, CORS, a security chain, the visitor's real client IP behind Render's proxy, a privacy-preserving visitor hash, a bot filter, and per-visitor rate limits. PF-004 builds that platform and a Docker image sized for Render Free, so the later tickets only add their endpoints. Non-Negotiables 3 (privacy), 4 (abuse limits), 5 (explicit errors), 8 (free tier), and 9 (no secrets) apply.

## 2. Scope

**In scope**

- The error model.
- Correlation IDs.
- CORS.
- The stateless security chain with the public list.
- Client IP resolution behind the proxy.
- Visitor hashing.
- Device and browser parsing.
- The bot filter.
- The per-visitor rate limiter, built and unit-tested, and wired to endpoints in PF-005 (D1).
- A Dockerfile whose image builds and runs locally.
- An off-by-default switch for the one-time forwarded-header check (D3).
- Docs updates.

**Out of scope (deferred)**

- New API endpoints and tables: PF-005 to PF-007 build them, and PF-004 adds no migration.
- The first deploy to Render and Neon, the confirmation of Render's proxy header, and the cold-start measurement: they move to PF-012 (D2).
- The referrer host: it comes from the visit request body, so PF-005 parses it.
- WireMock support: PF-006 or PF-007 adds it.
- Admin endpoints: stretch.

## 3. Functional requirements

- **FR-1**: Every non-2xx response, including framework errors and security denials, is RFC 9457 problem JSON with `type`, `title`, `status`, `detail`, `instance`, plus `code`, `correlationId`, and `timestamp`; a validation failure adds `errors` as a list of `{field, message}`. No response contains a stack trace, SQL, a class name, or framework or provider text. The one exception: a cross-origin request, preflight or not, from an origin not on the allowed list answers Spring's plain 403 with no allow headers, because the browser blocks it either way (D5). This includes errors that never reach a controller, such as a URL that Spring Security's firewall rejects, which are rendered through the /error dispatch. Source: Non-Negotiable 5, rest-api-conventions
- **FR-2**: The codes are `VALIDATION_FAILED` 400 (invalid or malformed input), `NOT_FOUND` 404 (an unknown path, a path outside the public list, or a method the path does not allow; D4), `RATE_LIMITED` 429 with a `Retry-After` header in whole seconds, and `INTERNAL_ERROR` 500 for anything unexpected. Source: rest-api-conventions, D4
- **FR-3**: Every response carries `X-Correlation-Id`. A well-formed incoming value (1 to 64 letters, digits, or hyphens) is kept; anything else is replaced by a new UUID. The same ID is in the logging context for the request and in problem bodies. Source: backend guide principle 13, rest-api-conventions
- **FR-4**: CORS allows only the origins in the allowed-origins setting (exact origins or origin patterns), methods GET and POST plus preflight, and request headers `Content-Type` and `X-Correlation-Id`; it exposes `X-Correlation-Id` and `Retry-After` and never allows credentials. A request from any other origin gets no CORS allow headers. Source: rest-api-conventions, implementation plan §5.5
- **FR-5**: The security chain stays stateless: no sessions, cookies, CSRF tokens, or logins; default security headers are on; only the public list is reachable (health by GET and HEAD, the OpenAPI document, and Swagger UI; later tickets add their endpoints). Source: implementation plan §5.5, PF-002
- **FR-6**: The client IP is the `X-Forwarded-For` entry added by the trusted proxy: counting from the right, the entry at the configured number of trusted proxy hops (default 1). Without the header, it is the connection's address. The leftmost, client-supplied entries are never trusted. The IP never leaves the component that resolves it and is never stored or logged, except for the one-time check in D3. Source: backend guide principle 9, D3
- **FR-7**: The visitor hash is HMAC-SHA256 of the secret over `ip + "|" + user agent`, as 64 lowercase hex characters. The secret has a default only in the local profile; the prod profile fails at startup without it. Source: product guide glossary, backend guide principles 9 and 12
- **FR-8**: Device type (desktop, mobile, tablet) and browser family are parsed from the user agent; the full user agent is never stored or logged. Source: implementation plan §5.2 (the `device_type` and `browser` columns arrive in PF-005)
- **FR-9**: A request is a bot when its user agent matches bot, crawl, spider, slurp, preview, headless, lighthouse, or monitor (case-insensitive). Source: implementation plan §5.5, SITE-002
- **FR-10**: Per-visitor rate limits are keyed by a rate-limit key, an HMAC of the client IP alone (with the same secret), so changing the user agent does not reset a limit; the visitor hash stays the identity for counting visits. The limits are visits 30 per minute (SITE-002) and contact messages 3 per hour (SITE-004). A rejected request answers 429 `RATE_LIMITED` with `Retry-After` set to the seconds until the next request would be allowed. Limits live in memory, may reset when the service restarts, and use bounded memory. Source: SITE-002, SITE-004, backend guide principle 10, D1, D6
- **FR-11**: The Dockerfile builds the backend into an image that runs as a non-root user with the Render Free JVM flags (`-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1`); `docker build` and `docker run` work locally against the compose PostgreSQL, and health answers UP. Source: implementation plan §5.6, D2
- **FR-12**: The allowed origins and the visitor-hash secret have defaults only in the local profile; the prod profile fails at startup when either is missing. Source: backend guide principle 12
- **FR-13**: An off-by-default setting makes the service log the raw `X-Forwarded-For` header once per process start, so PF-012 can confirm which entry Render adds without a code change; PF-012 turns it on once, reads the log, and turns it off. Source: D3

## 4. Product rules and edge cases

- **SITE-002** limits visits to 30 per minute, and **SITE-004** limits contact messages to 3 per hour; both apply per client address (D6). PF-004 builds the limiter; PF-005 wires the visit limit and PF-006 wires the contact limit.
- **SITE-006**: an IP address, a full user agent, or a full referrer URL is never stored or logged. The single exception is the one-time, owner-approved check in D3, which is off by default.
- In-memory limits reset when the service restarts. This is acceptable on the free tier.
- A spoofed `X-Forwarded-For` cannot change the resolved client IP when the hop count is right.
- **API down or asleep:** not applicable; PF-004 adds no frontend behaviour. The frontend keeps showing static content (Non-Negotiable 1).
- **Privacy:** PF-004 stores nothing. It computes the visitor hash, device type, and browser family in memory, and it never keeps or logs the IP or the full user agent (Non-Negotiable 3).
- **Abuse:** the rate limiter and the bot filter are the shared defences; PF-005 and PF-006 attach them to their endpoints (Non-Negotiable 4).

## 5. Interface decisions

**API**: No new endpoint. The problem JSON fields and the four codes are in FR-1 and FR-2. The headers are `X-Correlation-Id` on every response and `Retry-After` on 429. CORS is as in FR-4.

**UI**: None. PF-004 changes no frontend code.

**Content**: None: PF-004 adds no public text.

## 6. Open questions

- Deferred with its default in force: a missing or blank user agent. Proposed default: treat it as a bot.
- Deferred with its default in force: which browser families to report. Proposed default: Chrome, Edge, Firefox, Safari, Opera, Samsung Internet, and Other.
- Deferred with its default in force: Vercel preview deployments in the allowed origins. Proposed default: none in PF-004; PF-012 sets the production origin and decides on a preview pattern.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-23 | Visitor hashing, the bot filter, and the rate limiter stay in PF-004, built and unit-tested; PF-005 wires them to the visits endpoint with integration tests. | Matches the backlog and master plan and keeps PF-005 a manageable size. |
| D2 | 2026-11-23 | The first backend deploy to Render and Neon moves to PF-012, together with the frontend deploy; PF-004 ends with the Docker image building and running locally. The proxy-header confirmation and the cold-start measurement move with it. | The owner prefers to deploy both halves together. |
| D3 | 2026-11-23 | Render's proxy header is confirmed by logging the raw `X-Forwarded-For` value once on Render (during PF-012's deploy), reading it, and switching the log off; this is a one-time, owner-approved exception to the rule that IP addresses are never logged. | The owner chose the direct check over a count-only check. |
| D4 | 2026-11-23 | Any path outside the public list, an unknown path, or a method a path does not allow answers 404 problem JSON with code `NOT_FOUND`; the existing 403 behaviour goes away. | The API reveals only what is public, and 403 `ACCESS_DENIED` stays reserved for future admin endpoints. |
| D5 | 2026-11-23 | A cross-origin request from an origin outside the allowed list, preflight or not, answers Spring's plain 403 with no allow headers instead of problem JSON; it is the only non-2xx response that is not problem JSON. | The browser blocks the response either way; replacing Spring's CORS processing costs more than it gains. Approved with the plan. |
| D6 | 2026-11-23 | Rate limits are keyed by an HMAC of the client IP alone instead of the visitor hash, so a client cannot reset its limit by changing the user agent; SITE-002 and SITE-004 now say 'each client address'. The key is never stored or logged. | /review PF-004 finding: keyed by the visitor hash, a spammer rotating user agents got a fresh limit on every request. Approved by the owner. |

## 8. Acceptance criteria (refined)

- **AC-1**: GET of an unknown path, GET `/actuator/env`, and POST `/actuator/health` each answer 404 problem JSON with code `NOT_FOUND` and a `correlationId`. A URL the security firewall rejects, such as one containing a semicolon, answers 400 problem JSON with code `VALIDATION_FAILED`.
- **AC-2**: A well-formed `X-Correlation-Id` comes back unchanged in the response header and the problem body; a malformed one is replaced by a new UUID.
- **AC-3**: A CORS preflight from an allowed origin gets the allow headers for GET and POST with the two request headers; one from another origin gets no `Access-Control-Allow-Origin`. A cross-origin request from another origin answers 403 without allow headers (D5).
- **AC-4**: An unexpected failure answers 500 `INTERNAL_ERROR` without any exception text, and a validation failure answers 400 `VALIDATION_FAILED` with field errors.
- **AC-5**: The same IP and user agent give the same 64-hex visitor hash; a different IP, user agent, or secret gives a different one.
- **AC-6**: With one trusted hop the rightmost `X-Forwarded-For` entry is the client IP, with two the second from the right; a spoofed leftmost entry is ignored; with no header the connection address is used.
- **AC-7**: Known bot user agents are flagged and common browsers are not; device type and browser family are parsed for a small table of real-world user agents.
- **AC-8**: The 31st visit in a minute from one visitor is rejected with a positive `Retry-After` while another visitor is unaffected; the 4th contact message in an hour is rejected. Changing the user agent does not reset a client's limit (D6).
- **AC-9**: The prod profile fails at startup without the visitor-hash secret or the allowed origins.
- **AC-10**: `docker build` succeeds, and `docker run` against the compose PostgreSQL answers UP on `/actuator/health` (checked by hand).
- **AC-11**: Health, Swagger UI, and the OpenAPI document still answer as in PF-002, and the OpenAPI snapshot changes only if the error model adds documented schemas.
