---
paths:
  - "backend/**/*"
---

# Java / Spring Boot conventions

Applies to everything under `backend/`. The principles behind these rules are in `docs/architecture/backend.md`; names and commands are in `backend/CLAUDE.md`.

## Structure

- Package by feature under `com.huygialy.portfolio`: `visit`, `stats`, `contact`, `project`. Controllers and request and response records go in `{feature}.api`; shared code goes in `platform`.
- Layering is Controller → `{Feature}QueryService` or `{Feature}CommandService` → repositories and ports. Controllers never hold business logic or call repositories.
- External HTTP sits behind a port owned by its feature: only the email adapter in `contact` calls the email provider, and only the GitHub client in `project` calls the GitHub API.
- A file is for a type with its own behavior or its own callers. A type that only serves one other type nests inside it, and callers import it by its simple name. Exception variants that differ only by `ErrorCode` are one exception with factory methods, not a subclass each. A small static helper belongs on the type it serves (`ProjectResponse.from(...)`), not in its own utility class.
- Fewer files never overrides single responsibility: a class with its own reason to change (a scheduled job, an HTTP adapter, a filter) keeps its own file.

## Writing code

- Use Java 21 idioms: records for DTOs and value objects, `final var` for locals that are not reassigned, switch expressions and pattern matching where they read better.
- Constructor injection only; no `@Autowired` fields.
- Commands run validate → load (throw not-found) → business rules through the validator → mutate through entity methods, never interleaved.
- Query services are `@Transactional(readOnly = true)`. Write transactions cover database work only; never call the email provider, the GitHub API, or any HTTP client inside one. The transactional steps of a command that performs network I/O live on a `{Feature}Lifecycle` bean, because self-invocation skips the transaction proxy.
- Every outbound HTTP client is a `RestClient` with explicit connect and read timeouts. Retries and circuit breakers come from Resilience4j and are bounded.
- Failures throw `ApiException(ErrorCode, detail)`. Never return `null` for "not found", never put framework, SQL, or provider messages in `detail`, and never add a second `@RestControllerAdvice`.
- Time is an `Instant` from the injected `Clock`. No `java.util.Date`, `Calendar`, or `java.sql.Timestamp`.
- Configuration binds to validated `@ConfigurationProperties` records under `app.*`. No `@Value`. Secrets have no default outside `application-local.yml`.

## Privacy and abuse (Non-Negotiables 3 and 4)

- Read the client IP and user agent only through the platform's client-info resolver; it returns the visitor hash, the rate-limit key, device type, browser family, and a bot flag. Nothing else keeps the raw values.
- Store a referrer as its host only. Store a `ref` tag only after it matches `^[a-z0-9-]{1,64}$`.
- Every public `POST` has Bean Validation with explicit maximum lengths, and its command service calls `RateLimiter.check` with its `RateLimit` before doing any work.

## Persistence

- Schema changes go only through Flyway: `src/main/resources/db/migration/V{yyyyMMddHHmmss}__{snake_description}.sql`. Never edit a migration that has been applied.
- `ddl-auto` stays `validate`. Constraints (`NOT NULL`, `CHECK`, `UNIQUE`, foreign keys) live in the database.
- Primary keys are `BIGINT GENERATED ALWAYS AS IDENTITY`; instants are `TIMESTAMPTZ`; hashes are `VARCHAR(64)` with a hex `CHECK`, never `CHAR`; statuses are `VARCHAR` with a `CHECK`.
- Entities are created through static factories, change state only through guarded methods, and expose no public setters. Mutable entities carry `@Version`. Lombok is allowed on entities only.
- Uniqueness and concurrency are enforced by constraints, `@Version`, and compare-and-set updates, never by check-then-act code.

## Logging

- SLF4J through `LoggerFactory.getLogger`. Log identifiers and outcomes, never request bodies, API keys, IP addresses, user agents, email addresses, or message text.
- Business failures log at WARN without a stack trace; unexpected failures log at ERROR with one.

## Free tier (Non-Negotiable 8)

- Nothing is written to the local filesystem; Render wipes it on every restart.
- No new dependency without a reason in the plan; prefer what Spring Boot already brings.
- Caches are bounded (Caffeine with a maximum size and expiry).

## Tests

- Unit tests are untagged `{Class}Test` classes without a Spring context. Integration tests are `{Subject}IT` classes annotated `@IntegrationTest`.
- Apply the integration-test gate from principle 14 of `docs/architecture/backend.md`. No `@MockitoBean` in integration tests; external HTTP is stubbed with WireMock.
- Assert on the problem `code` and HTTP status, not on message text. Use synthetic data only.
- Filter runs with `testUnit --tests` or `testIT --tests`, never on the aggregate `test` task.

## Before handing back

- Format and compile: `./backend/gradlew -p backend spotlessApply`, then `./backend/gradlew -p backend assemble testClasses`.
- After an API change, run `make openapi` and include the regenerated snapshot in the same change.
