# backend/CLAUDE.md

> Written before the code (PF-001) as the working contract for `backend/`. Commands are confirmed when PF-002 scaffolds the package, and class names from PF-004 on. Where this file and the code disagree, fix whichever is wrong in the same change.

## Quick Reference

| | |
|---|---|
| Language | Java 21: records, sealed types, pattern matching, `var`, virtual threads |
| Framework | Spring Boot 4 (latest GA from Spring Initializr): Spring Framework 7, Spring Security 7, Hibernate 7, Jackson 3 |
| Build | Gradle 9, Kotlin DSL, wrapper in `backend/`; Spotless for formatting, JaCoCo for coverage |
| Database | PostgreSQL 17 (Neon in production, Docker locally), Flyway migrations, JPA with `ddl-auto: validate` |
| External services | Resend (email over HTTPS) behind the `EmailSender` port; the GitHub REST API behind `GitHubClient`; both through `RestClient` with explicit timeouts |
| Resilience and limits | Resilience4j (retry for email, circuit breaker for GitHub), Caffeine caches, Bucket4j rate limits |
| API | REST under `/api/v1`, springdoc OpenAPI, RFC 9457 problem responses; public, no authentication |
| Tests | JUnit, AssertJ, Mockito, Testcontainers 2, WireMock, JaCoCo |
| Runtime target | Render Free: 512 MB RAM, 0.1 CPU, no persistent disk (Non-Negotiable 8) |
| Base package | `com.huygialy.portfolio` |

Spring Boot 4 traps (`KNOWN-BE-003` to `005` in `backend/docs/ARCHITECTURE.md`): split starters, Jackson 3 runtime packages under `tools.jackson`, and Testcontainers 2 artifact and class names. When a compile error contradicts what you expected, look up the current API. Never downgrade a dependency to make old code compile.

## Commands

_(Planned, PF-002: confirm each command when the package is scaffolded.)_ Agents run these from the repository root in exactly this form: it needs no `cd` and matches the permission allowlist.

```bash
make up                                              # PostgreSQL in Docker
./backend/gradlew -p backend bootRun                 # run with the local profile on :8080
./backend/gradlew -p backend bootTestRun             # run against Testcontainers; no compose needed
./backend/gradlew -p backend testUnit                # unit tier: no Spring context, no Docker
./backend/gradlew -p backend testUnit --tests "*VisitorHasherTest"
./backend/gradlew -p backend testIT                  # integration tier: Spring + Testcontainers + WireMock, needs Docker
./backend/gradlew -p backend testIT --tests "*ContactApiIT"
./backend/gradlew -p backend test                    # both tiers; ignores --tests (KNOWN-BE-001)
./backend/gradlew -p backend spotlessApply           # format; required before every commit
./backend/gradlew -p backend check                   # spotlessCheck + both tiers + branch coverage ≥ 80%
./backend/gradlew -p backend assemble testClasses    # compile main and test sources, run nothing
make openapi                                         # regenerate backend/openapi/openapi.json and the frontend types
```

## Naming Conventions

| Thing | Pattern | Example |
|---|---|---|
| Feature package | `com.huygialy.portfolio.{feature}` | `com.huygialy.portfolio.contact` |
| Controller | `{Feature}Controller` in `{feature}.api` | `ContactController` |
| Request body | `{Action}{Entity}Request` record | `CreateContactMessageRequest` |
| Response body | `{Entity}Response` record with `static from(...)` | `StatsSummaryResponse` |
| Read service | `{Feature}QueryService` | `StatsQueryService` |
| Write service | `{Feature}CommandService` | `ContactCommandService` |
| Transactional steps of a command that does network I/O | `{Feature}Lifecycle` | `ContactLifecycle` |
| Business rules | `{Feature}Validator` | `VisitValidator` |
| Entity | `{Entity}Entity` | `ContactMessageEntity` |
| Repository | `{Entity}Repository` (interface) | `PageViewRepository` |
| Port to an external service | a noun for the capability, adapter named after the provider | `EmailSender`, `ResendEmailSender` |
| Configuration | `{Feature}Properties` record, prefix `app.{feature}` | `ContactProperties` |
| Type that only serves one other type | nested in it, imported by its simple name | `EmailSender.Email` |
| Failure variants of one component | one exception, a factory per `ErrorCode` | `ApiException.rateLimited(...)` |
| Error code | `UPPER_SNAKE` constant in `ErrorCode` | `RATE_LIMITED` |
| Migration | `V{yyyyMMddHHmmss}__{snake_description}.sql` | `V20261201093000__create_page_view.sql` |
| Unit test | `{Class}Test`, untagged | `VisitorHasherTest` |
| Integration test | `{Subject}IT` with `@IntegrationTest` | `ContactApiIT` |

## Key Patterns

- **Layering.** Controller → `{Feature}QueryService` or `{Feature}CommandService` → repositories and ports. A controller binds the request, validates its shape with Bean Validation, calls one service method, and maps the result to a response record. It holds no business logic and never touches a repository.
- **Command shape.** Validate the input, load what it acts on (throw not-found), apply business rules through the validator, then mutate through entity methods. Never interleave these steps.
- **Transactions.** Query services are `@Transactional(readOnly = true)`. Write transactions are short and cover database work only. A command that calls the email provider or the GitHub API is orchestrated by a non-transactional command service, which calls a `{Feature}Lifecycle` bean for each transactional step (`KNOWN-BE-006`, Non-Negotiable 7).
- **Contact outbox.** `POST /api/v1/contact-messages` saves the message as `PENDING` in one transaction, sends it through `EmailSender` with no transaction open, and records `SENT` or `FAILED` in a second transaction. A filled honeypot field stores the row as `SPAM`, answers 202 like any other message, and never sends. A `@Scheduled` job retries `FAILED` rows up to 3 attempts; it claims each row with a compare-and-set update (`UPDATE … SET attempts = attempts + 1 WHERE id = :id AND status = 'FAILED' AND attempts = :seen`), so two instances never send the same message twice.
- **External services.** Features depend on a port they own: `contact` on `EmailSender`, `project` on `GitHubClient`. Only the adapter talks to the provider. Adapters use `RestClient` with explicit connect and read timeouts. Email gets a Resilience4j retry with exponential backoff; GitHub gets a circuit breaker whose fallback is the last good result, else an empty list. The `local` profile wires a sender that logs only the message ID, so no email leaves a developer machine.
- **Errors.** `throw new ApiException(ErrorCode.X, "client-safe detail")`, or one of its factories. Add codes to `ErrorCode` with their HTTP status. Never return `null` for "not found", never put framework, SQL, or provider text in `detail`, and never add a second `@RestControllerAdvice`.
- **Entities.** Created through static factories; state changes only through guarded methods that throw on an illegal transition. No public setters. Keys are `BIGINT GENERATED ALWAYS AS IDENTITY`. Timestamps are `Instant` mapped to `TIMESTAMPTZ` and taken from the injected `Clock`. Mutable entities (`ContactMessageEntity`) carry `@Version`; append-only ones (`PageViewEntity`) do not. Lombok is allowed on entities only.
- **Visitor identity.** `ClientInfoResolver` turns a request into the client IP, a parsed device type and browser, and `visitorHash = HMAC-SHA256(app.visitor-hash-secret, ip + "|" + userAgent)` as 64 hex characters. The raw IP and the full user agent never leave that resolver: not into a column, a log line, or a response (Non-Negotiable 3). Referrers are reduced to their host.
- **Abuse resistance.** Every public `POST` has Bean Validation on its request record and a Bucket4j limit keyed by `visitorHash`: visits 30 per minute, contact messages 3 per hour. A rejected request answers 429 `RATE_LIMITED` with `Retry-After`. Bot user agents are dropped from visit counting (Non-Negotiable 4).
- **Caching.** Caffeine: `statsSummary` for 60 s and `githubRepos` for 1 h. A cache never holds personal data.
- **Scheduled jobs.** The job is the feature's own component with an `app.{feature}.*-enabled` switch, such as `app.contact.retry-enabled`. Its `@Scheduled` method returns at once when the switch is off. Integration tests turn the switch off and call the job's work method directly. It takes its work from the current state ("what is still `FAILED`") and claims each item with a compare-and-set, never with a scheduler lock.
- **Configuration.** Validated `@ConfigurationProperties` records under `app.*`; YAML values as `${ENV_VAR:default}`; secrets have no default outside `application-local.yml`, and the `prod` profile fails at startup when one is missing. `server.port: ${PORT:8080}` (Render injects `PORT`), `server.forward-headers-strategy: framework`, and a Hikari pool of 3.
- **Logging.** SLF4J (`LoggerFactory.getLogger`). Log identifiers and outcomes, never request bodies, IP addresses, user agents, email addresses, message text, or tokens. Business failures at WARN without a stack trace; unexpected failures at ERROR with one.
- **Java style.** Constructor injection only. Records for DTOs and value objects. `final` locals where they are not reassigned. `Optional` only as a return type.

### The contact outbox, the shape to copy

```java
// ContactCommandService: not transactional, so no transaction is open while the email is sent.
public Accepted submit(CreateContactMessageRequest body, ClientInfo client) {
    rateLimiter.check(RateLimit.CONTACT, client.visitorHash());           // 429 RATE_LIMITED when exhausted
    var message = lifecycle.savePending(body, client.visitorHash());     // TX 1: PENDING, or SPAM when the honeypot is filled
    if (message.isSpam()) {
        return Accepted.of(message);                                     // same 202 as a real message; never sent
    }
    try {
        var providerId = emailSender.send(EmailSender.Email.from(message)); // network I/O, no transaction open
        lifecycle.markSent(message.id(), providerId);                    // TX 2
    } catch (EmailSender.DeliveryException e) {
        lifecycle.markFailed(message.id(), e.reason());                  // TX 2; the retry job picks it up
    }
    return Accepted.of(message);                                         // the visitor gets 202 either way
}
```

A delivery failure is the owner's problem, not the visitor's: the message is safe in the database and the retry job resends it.

### Adding an endpoint _(planned; confirmed in PF-005)_

1. Write a migration if the data model changes.
2. Add or extend the entity (factory, guarded transitions) and its repository.
3. Put business rules in the feature's validator and add any new `ErrorCode` entries.
4. Add the query or command service method, plus a `{Feature}Lifecycle` bean if the command calls an external service.
5. Add the request and response records and the controller method; add the path to the public allowlist in the security chain and give a public `POST` its rate limit.
6. Write an `@IntegrationTest` covering success, each error code, and the rate limit; stub external HTTP with WireMock.
7. Run `make openapi` and commit the regenerated snapshot with the change.

## Project Structure _(planned, PF-002 and PF-004)_

```
backend/
├── build.gradle.kts · settings.gradle.kts · gradlew
├── Dockerfile                           # multi-stage build; JVM flags sized for Render Free
├── openapi/openapi.json                 # committed API contract snapshot
├── docs/ARCHITECTURE.md · docs/{domain}/ # design guide and implementation plans
└── src/
    ├── main/java/com/huygialy/portfolio/
    │   ├── platform/                    # error, web (correlation ID), security (CORS, filter chain), ratelimit, client (ClientInfoResolver, visitor hash, bot filter), openapi
    │   ├── visit/                       # page views: service, entity, repository, validator
    │   │   └── api/                     # POST /api/v1/visits
    │   ├── stats/                       # summary query and its cache
    │   │   └── api/                     # GET /api/v1/stats/summary
    │   ├── contact/                     # outbox: command service, lifecycle, entity, EmailSender port + Resend adapter, retry job
    │   │   └── api/                     # POST /api/v1/contact-messages
    │   └── project/                     # GitHubClient, cache, circuit breaker
    │       └── api/                     # GET /api/v1/projects
    ├── main/resources/
    │   ├── application.yml · application-{local,prod}.yml
    │   └── db/migration/                # Flyway migrations
    └── test/java/com/huygialy/portfolio/
        ├── support/                     # @IntegrationTest, TestcontainersConfiguration, WireMock setup (test-only)
        └── …                            # mirrors main
```

## Database Migrations

- Location `src/main/resources/db/migration/`, naming `V{yyyyMMddHHmmss}__{snake_description}.sql`.
- Never edit a migration once it has been applied anywhere; add a new one.
- Put constraints in the database: `NOT NULL`, `CHECK` for enumerated statuses and hex hashes, `UNIQUE`, foreign keys.
- Use `BIGINT GENERATED ALWAYS AS IDENTITY` keys and `TIMESTAMPTZ` for instants. Hashes are `VARCHAR(64)` with `CHECK (col ~ '^[0-9a-f]{64}$')`, never `CHAR(64)` (`KNOWN-BE-010`).
- Index every filter-and-sort combination a query uses, ending with `id` as a tie-break.
- `ddl-auto: validate` means a missing or wrong migration fails startup. That is intended.

## API and OpenAPI

- REST rules live in `.claude/rules/rest-api-conventions.md`.
- After any API change, run `make openapi` and commit `backend/openapi/openapi.json` together with `frontend/src/api/schema.d.ts`. Nothing checks this automatically, so look at `git status` after regenerating.
- Swagger UI is served at `/swagger-ui.html`.

## Testing

- `testUnit` holds untagged tests of pure logic (the visitor hasher, the bot filter, the referrer reducer, validators), using Mockito where collaborators are needed and no Spring context.
- `testIT` holds `@IntegrationTest` classes. They share one Spring context with a Testcontainers PostgreSQL and a WireMock server that stands in for Resend and GitHub, and never use `@MockitoBean` (`KNOWN-BE-008`). No test reaches a real external service.
- The integration-test gate (principle 14 in `backend/docs/ARCHITECTURE.md`) decides when a change needs an integration test.
- Build test data in code through small factories. Data is synthetic: invented names, `example.com` emails, documentation IP ranges such as `203.0.113.0/24`.
- Assert on problem `code` and HTTP status, never on message text.
- Branch coverage stays at or above 80%; `check` enforces it.

## Important Notes

- Do not start `bootRun` while a Gradle test task runs in the same project.
- `--tests` must target `testUnit` or `testIT`, never the aggregate `test` (`KNOWN-BE-001`).
- Never read, print, or create `.env` files. Configuration defaults for local runs belong in `application-local.yml`.
- Production settings (Render environment variables, Neon connection details, the Resend key, the GitHub token) are the owner's. Agents never create, change, or read them; they write out the steps for the owner. The list of variables is in §5.4 of `portfolio-implementation-plan.md` in the private parent folder.
- Nothing is written to the local disk at runtime: Render wipes it on every restart (Non-Negotiable 8).
