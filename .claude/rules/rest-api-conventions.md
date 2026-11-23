---
paths:
  - "backend/**/*"
  - "frontend/src/api/**/*"
---

# REST API conventions

The contract between `backend/` and `frontend/`. Every endpoint follows these rules. The published form is the OpenAPI snapshot in `backend/openapi/openapi.json`.

## Resources and methods

- Paths are `/api/v1/{plural-kebab-resource}`, for example `/api/v1/contact-messages`. A singleton view of a resource is a sub-path: `/api/v1/stats/summary`.
- `GET` reads and `POST` creates. An action that is not plain CRUD is a `POST` to a sub-resource.
- Partial updates, if ever needed, use `PATCH` with explicit fields, never `PUT`.
- Changes within `v1` are additive only: new optional fields or new endpoints. Removing or renaming anything requires a new version, because a deployed frontend can lag behind the backend.

## Endpoints today

Rows marked _(planned)_ arrive with the ticket named.

| Method and path | Purpose | Success | Ticket |
|---|---|---|---|
| `POST /api/v1/visits` (`recordVisit`) | Record a page view | 202 | PF-005 |
| `GET /api/v1/stats/summary` (`getStatsSummary`) | Total views, unique visitors, first visit time (`since`, null before the first view) | 200 | PF-005 |
| `POST /api/v1/contact-messages` _(planned)_ | Accept a contact message for delivery | 202 | PF-006 |
| `GET /api/v1/projects` _(planned)_ | Public GitHub repositories, featured first | 200 | PF-007 |
| `GET /actuator/health` | Health, Render health check, keep-alive ping | 200 | PF-002 |

## Status codes

| Situation | Status and code |
|---|---|
| Created, and the client can read it back | 201, with a `Location` header and the created resource |
| Accepted, but the client cannot read it back (a page view, a contact message) | 202, with no identifier in the body |
| Read, or an action's result | 200 |
| Malformed or invalid input | 400 `VALIDATION_FAILED`, with `errors` |
| Resource does not exist | 404, with a resource-specific code, or `NOT_FOUND` |
| Too many requests from one visitor | 429 `RATE_LIMITED`, with a `Retry-After` header in seconds |
| Unexpected failure | 500 `INTERNAL_ERROR` |
| Missing or invalid credentials (admin endpoints only, stretch goal) | 401 `UNAUTHENTICATED` |
| Authenticated but not allowed (admin endpoints only, stretch goal) | 403 `ACCESS_DENIED` |

An upstream outage (GitHub, the email provider) is not passed to the client as an error when a fallback exists: the projects endpoint answers 200 from its fallback, and a contact message is accepted and retried later.

## Errors

- Every non-2xx response is `application/problem+json` (RFC 9457): `type`, `title`, `status`, `detail`, `instance`, plus `code`, `correlationId`, `timestamp`, and, for validation failures, `errors` as a list of `{field, message}`.
- `code` is a stable `UPPER_SNAKE` identifier and is what clients branch on. `detail` is for people and may change.
- No response ever contains a stack trace, SQL, a class name, or a provider message.
- A honeypot hit is answered exactly like a success (202), so a bot learns nothing.

## Headers and access

- Public endpoints need no authentication; abuse is limited by validation and a per-visitor rate limit (Non-Negotiable 4).
- CORS allows only the origins in `app.cors.allowed-origins` (the Vercel production URL, and a preview pattern if PF-012 adds one), methods `GET` and `POST` (plus `HEAD`), and no credentials; a cross-origin request from any other origin gets a plain 403 (PF-004 D5).
- `X-Correlation-Id` is accepted when well-formed and always returned.

## Payloads

- JSON property names are camelCase; enum values are `UPPER_SNAKE`.
- Instants are ISO-8601 UTC strings such as `2026-11-22T09:30:00Z`; dates without a time are `YYYY-MM-DD`.
- Request bodies are `{Action}{Entity}Request` records and responses are `{Entity}Response` records. Never expose entities, database IDs of visitor data, hashes, or internal statuses.
- Request strings have explicit maximum lengths in Bean Validation, mirrored by the frontend's zod schemas.

## Collections

- A small, unpaged list answers `{items}`. A paged list answers `{items, total, page, size}` with `page` from 0, `size` defaulting to 20 with a maximum of 100, and ordering that ends with a stable tie-break.

## Workflow

- After any API change, run `make openapi`, then commit the snapshot and the regenerated `frontend/src/api/schema.d.ts` together.
- Give every operation a stable `operationId`, such as `recordVisit` or `listProjects`, so generated code stays readable.
