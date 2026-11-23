# backend/CLAUDE.md

> Written before the code (PF-001) as the working contract for `backend/`. The commands were confirmed when PF-002 scaffolded the package; class names are confirmed from PF-004 on. Where this file and the code disagree, fix whichever is wrong in the same change. This package has no docs folder: its design guide is `docs/architecture/backend.md` and its plans live in `docs/plans/`.

## Quick Reference

| | |
|---|---|
| Language | Java 21: records, sealed types, pattern matching, `var`, virtual threads |
| Framework | Spring Boot 4.2.0 (the Spring Initializr default when PF-002 generated the package): Spring Framework 7, Spring Security 7, Hibernate 7, Jackson 3 |
| Build | Gradle 9.9 wrapper in `backend/`, Kotlin DSL; Spotless with palantir-java-format for formatting, JaCoCo for coverage |
| Database | PostgreSQL 17 (Neon in production, Docker locally), Flyway migrations, JPA with `ddl-auto: validate` |
| External services | Resend (email over HTTPS) behind the `EmailSender` port; the GitHub REST API behind `GitHubClient`; both through `RestClient` with explicit timeouts |
| Resilience and limits | Resilience4j (retry for email, circuit breaker for GitHub), Caffeine caches, Bucket4j rate limits |
| API | REST under `/api/v1`, springdoc OpenAPI, RFC 9457 problem responses; public, no authentication |
| Tests | JUnit, AssertJ, Mockito, Testcontainers 2, WireMock, JaCoCo |
| Runtime target | Render Free: 512 MB RAM, 0.1 CPU, no persistent disk (Non-Negotiable 8) |
| Base package | `com.huygialy.portfolio` |

Spring Boot 4 traps (`KNOWN-BE-003` to `005` in `docs/architecture/backend.md`): split starters, Jackson 3 runtime packages under `tools.jackson`, and Testcontainers 2 artifact and class names. When a compile error contradicts what you expected, look up the current API. Never downgrade a dependency to make old code compile.

## Commands

Confirmed in PF-002. Agents run these from the repository root in exactly this form: it needs no `cd` and matches the permission allowlist.

```bash
make up                                              # PostgreSQL in Docker
./backend/gradlew -p backend bootRun                 # run with the local profile on :8080 (SPRING_PROFILES_ACTIVE overrides it)
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
docker build -t portfolio-backend backend            # the Render image (backend/Dockerfile); runs anywhere with DB_URL, DB_USERNAME, DB_PASSWORD, ALLOWED_ORIGINS, VISITOR_HASH_SECRET, RESEND_API_KEY, CONTACT_TO_EMAIL
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
- **Contact outbox.** `POST /api/v1/contact-messages` saves the message as `PENDING` in one transaction, sends it through `EmailSender` with no transaction open, and records `SENT` or `FAILED` in a second transaction. A filled honeypot field stores the row as `SPAM`, answers 202 like any other message, and never sends. `ContactRetryJob` retries `FAILED` rows until a message has had 3 delivery attempts in total; it claims each row with a compare-and-set update (`UPDATE … SET status = PENDING, attempts = attempts + 1, version = version + 1 WHERE id = :id AND status = 'FAILED' AND attempts = :seen`), so two instances never send the same attempt twice, then delivers it through the same `deliver` as a new message.
- **External services.** Features depend on a port they own: `contact` on `EmailSender`, `project` on `GitHubClient`. Only the adapter talks to the provider. Adapters use `RestClient` with explicit connect and read timeouts. Email gets a Resilience4j retry with exponential backoff; GitHub gets a circuit breaker whose fallback is the last good result, else an empty list. The `local` profile wires a sender that logs only the message ID, so no email leaves a developer machine.
- **Errors.** `throw new ApiException(ErrorCode.X, "client-safe detail")`, or one of its factories. Add codes to `ErrorCode` with their HTTP status. Never return `null` for "not found", never put framework, SQL, or provider text in `detail`, and never add a second `@RestControllerAdvice`.
- **Entities.** Created through static factories; state changes only through guarded methods that throw on an illegal transition. No public setters. Keys are `BIGINT GENERATED ALWAYS AS IDENTITY`. Timestamps are `Instant` mapped to `TIMESTAMPTZ` and taken from the injected `Clock`. Mutable entities (`ContactMessageEntity`) carry `@Version`; append-only ones (`PageViewEntity`) do not. Lombok is allowed on entities only.
- **Visitor identity.** `ClientInfoResolver` turns a request into `ClientInfo`: a parsed device type and browser family, a bot flag, a `rateLimitKey` (an HMAC of the IP alone), and `visitorHash = HMAC-SHA256(app.client.visitor-hash-secret, ip + "|" + userAgent)` as 64 hex characters, with the IP taken from the trusted proxy's `X-Forwarded-For` entry. The raw IP and the full user agent never leave that resolver: not into a column, a log line, or a response (Non-Negotiable 3). Referrers are reduced to their host.
- **Abuse resistance.** Every public `POST` has Bean Validation on its request record and a Bucket4j limit keyed by `ClientInfo.rateLimitKey()` (an HMAC of the IP alone): visits 30 per minute, contact messages 3 per hour. A rejected request answers 429 `RATE_LIMITED` with `Retry-After`. Bot user agents are dropped from visit counting (Non-Negotiable 4).
- **Caching.** Caffeine, built where it is used, with no cache starter or proxy: the stats summary in `StatsQueryService` (one entry, `app.stats.cache-ttl`, 60 s by default, read straight through when zero as in the test profile; built in PF-005). The GitHub list is not a Caffeine cache: `ProjectQueryService` keeps one snapshot for 1 h and refreshes it under a `ReentrantLock`, because a Caffeine loader runs inside a `synchronized` bin and would pin a virtual thread's carrier during the GitHub call (PF-007 P7). A cache never holds personal data.
- **Scheduled jobs.** The job is the feature's own component with an `app.{feature}.*-enabled` switch, such as `app.contact.retry-enabled`. Its `@Scheduled` method returns at once when the switch is off. Integration tests turn the switch off and call the job's work method directly. It takes its work from the current state ("what is still `FAILED`") and claims each item with a compare-and-set, never with a scheduler lock.
- **Configuration.** Validated `@ConfigurationProperties` records under `app.*`; YAML values as `${ENV_VAR:default}`; secrets have no default outside `application-local.yml`, and the `prod` profile fails at startup when one is missing. The datasource settings have no default in `application.yml`; `application-local.yml` derives them from the `POSTGRES_*` variables that `compose.yaml` uses. `server.port: ${PORT:8080}` (Render injects `PORT`; locally `SERVER_PORT` overrides it), `server.request.header.forwarded.strategy: none` (`ClientInfoResolver` reads `X-Forwarded-For` itself and trusts only `app.client.trusted-proxy-hops` from the right), and a Hikari pool of 3.
- **Logging.** SLF4J (`LoggerFactory.getLogger`). Log identifiers and outcomes, never request bodies, IP addresses, user agents, email addresses, message text, or tokens. Business failures at WARN without a stack trace; unexpected failures at ERROR with one.
- **Java style.** Constructor injection only. Records for DTOs and value objects. `final` locals where they are not reassigned. `Optional` only as a return type.

### The contact outbox, the shape to copy

```java
// ContactCommandService: not transactional, so no transaction is open while the email is sent.
public void submit(CreateContactMessageRequest body, ClientInfo client) {
    rateLimiter.check(RateLimit.CONTACT, client.rateLimitKey());         // 429 RATE_LIMITED when exhausted
    final var message = lifecycle.savePending(body, client.visitorHash()); // TX 1: PENDING, or SPAM when the honeypot is filled
    if (message.isSpam()) {
        return;                                                         // same 202 as a real message; never sent
    }
    deliver(message);                                                   // the visitor gets 202 either way
}

// Shared with ContactRetryJob; never throws, so an outcome-write failure is logged with the ID only.
void deliver(ContactMessageEntity message) {
    final var email = Email.from(message);
    try {
        final String providerId;
        try {
            providerId = emailSender.send(email);                       // network I/O, no transaction open
        } catch (DeliveryException e) {
            lifecycle.markFailed(email.messageId(), e.reason());        // TX 2; the retry job picks it up
            return;
        }
        lifecycle.markSent(email.messageId(), providerId);              // TX 2
    } catch (RuntimeException e) {
        log.error("Contact message {} attempt {}: delivery outcome not recorded", email.messageId(), email.attempt(), e);
    }
}
```

A delivery failure is the owner's problem, not the visitor's: the message is safe in the database and the retry job resends it.

### Adding an endpoint (confirmed in PF-005)

1. Write a migration if the data model changes.
2. Add or extend the entity (factory, guarded transitions) and its repository.
3. Put business rules in the feature's validator and add any new `ErrorCode` entries.
4. Add the query or command service method, plus a `{Feature}Lifecycle` bean if the command calls an external service.
5. Add the request and response records and the controller method; add the path to the public allowlist in the security chain and give a public `POST` its rate limit.
6. Write an `@IntegrationTest` covering success, each error code, and the rate limit; stub external HTTP with WireMock.
7. Run `make openapi` and commit the regenerated snapshot with the change.

## Project Structure

```
backend/
├── build.gradle.kts · settings.gradle.kts · gradlew
├── Dockerfile · .dockerignore           # multi-stage build on pinned Temurin 21 images; JVM flags sized for Render Free
├── openapi/openapi.json                 # committed API contract snapshot
└── src/
    ├── main/java/com/huygialy/portfolio/
    │   ├── platform/                    # error, web (correlation ID), security (chain, CORS), client (ClientInfoResolver, visitor hash, user agent, bot filter), ratelimit, openapi, ClockConfig
    │   ├── visit/                       # page views: command and query services, entity, repository, validator (PF-005)
    │   │   └── api/                     # POST /api/v1/visits
    │   ├── stats/                       # summary query and its cache, StatsProperties (PF-005)
    │   │   └── api/                     # GET /api/v1/stats/summary
    │   ├── contact/                     # outbox: command service, lifecycle, entity, repository, EmailSender port + Resend and logging adapters, retry job, properties (PF-006)
    │   │   └── api/                     # POST /api/v1/contact-messages
    │   └── project/                     # GitHubClient port + GitHubRestClient adapter, RepositoryFilter, ProjectQueryService (1 h snapshot, circuit breaker), ProjectConfig, GitHubProperties (PF-007)
    │       └── api/                     # GET /api/v1/projects
    ├── main/resources/
    │   ├── application.yml · application-{local,prod}.yml
    │   └── db/migration/                # Flyway migrations
    └── test/java/com/huygialy/portfolio/
        ├── support/                     # @IntegrationTest, TestcontainersConfiguration, WireMockSupport (PF-006; GitHub base URL since PF-007)
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
- The integration-test gate (principle 14 in `docs/architecture/backend.md`) decides when a change needs an integration test.
- Build test data in code through small factories. Data is synthetic: invented names, `example.com` emails, documentation IP ranges such as `203.0.113.0/24`.
- Assert on problem `code` and HTTP status, never on message text.
- Branch coverage stays at or above 80%; `check` enforces it.

## Important Notes

- Do not start `bootRun` while a Gradle test task runs in the same project.
- `--tests` must target `testUnit` or `testIT`, never the aggregate `test` (`KNOWN-BE-001`).
- Never read, print, or create `.env` files. Configuration defaults for local runs belong in `application-local.yml`.
- Production settings (Render environment variables, Neon connection details, the Resend key, the GitHub token) are the owner's. Agents never create, change, or read them; they write out the steps for the owner. The list of variables is in §5.4 of `portfolio-implementation-plan.md` in the private parent folder.
- Nothing is written to the local disk at runtime: Render wipes it on every restart (Non-Negotiable 8).
