# Tooling

Facts about the libraries and tools this site uses. The entries marked **Carried over** were verified in the owner's earlier Spring Boot 4 and React scaffold on the date given, with the same toolchain this repository adopts; re-check each one when the code that depends on it lands, then replace the provenance with the PF ticket that confirmed it. Versions are as of the date in each entry.

## Spring Boot and Java

### Spring Initializr default and Boot-managed versions
- **Rule / Behavior**: The Initializr default was Spring Boot 4.1.2 (Java 17 preselected; 21, 25, and 27 offered). Boot 4.1.2 manages Spring Framework 7.0.10, Spring Security 7.1.2, Hibernate 7.4.13.Final, Jackson 3.1.7 (with Jackson 2.21.7 alongside), Flyway 12.4.0, Testcontainers 2.0.5, JUnit Jupiter 6.0.3, Mockito 5.23.0, AssertJ 3.27.7, and the PostgreSQL driver 42.7.14.
- **Source**: `https://start.spring.io/metadata/client` and `spring-boot-dependencies-4.1.2.pom` on Maven Central
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Shape of a generated Boot 4 Gradle project
- **Rule / Behavior**: A Gradle Kotlin DSL project zip has no top-level folder and ships Gradle wrapper 9.8.2. It uses split starters (`spring-boot-starter-webmvc`, `spring-boot-starter-flyway`, and one `-test` starter per module, such as `spring-boot-starter-webmvc-test`). Its `TestcontainersConfiguration` uses `org.testcontainers.postgresql.PostgreSQLContainer` without a type parameter, from `org.testcontainers:testcontainers-postgresql`. It also generates a `Test{Name}Application`, the entry point for `./gradlew bootTestRun`.
- **Source**: generated `build.gradle.kts`, `gradle/wrapper/gradle-wrapper.properties`, and test sources
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Libraries added outside the Boot BOM
- **Rule / Behavior**: Latest releases on Maven Central were `springdoc-openapi-starter-webmvc-ui` 3.2.0 and the Spotless Gradle plugin 8.11.0. Resilience4j, Bucket4j, WireMock, and Caffeine versions were not checked yet.
- **Source**: `maven-metadata.xml` of each artifact on Maven Central
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Boot 4 test support classes and moved packages
- **Rule / Behavior**: Integration tests can use `org.springframework.test.web.servlet.client.RestTestClient` through `@AutoConfigureRestTestClient` (`org.springframework.boot.resttestclient.autoconfigure`, from `spring-boot-resttestclient`). `@LocalServerPort` is `org.springframework.boot.test.web.server.LocalServerPort`. The health API (`Health`, `HealthIndicator`, `Status`) moved to `org.springframework.boot.health.contributor`. Jackson 3's `ObjectMapper` and `JsonMapper` are under `tools.jackson.databind`, while annotations stay in `com.fasterxml.jackson.annotation`.
- **Source**: class listings of the resolved 4.1.2 jars
- **Verified**: an integration test passed with `RestTestClient`; 2026-11-11
- **Discovered in**: Carried over

### Problem documents and Jackson 3
- **Rule / Behavior**: Spring Framework 7 with Jackson 3 serializes a `ProblemDetail` returned from `@RestControllerAdvice` with its custom properties flattened to top-level JSON members (`code`, `correlationId`, `errors`). Serializing a `ProblemDetail` directly with the `ObjectMapper` does not flatten them, so writers outside Spring MVC, such as a security entry point or a filter that rejects a request (the rate limiter), build a flat map instead.
- **Source**: an exception handler and a security problem writer
- **Verified**: integration tests asserting `$.code` at the top level; 2026-11-11
- **Discovered in**: Carried over

### Spring Boot 4 ignores `server.error.*`
- **Rule / Behavior**: `server.error.include-message`, `include-stacktrace`, and `include-binding-errors` are deprecated at level `error` in Boot 4.0, so they are no longer bound; the replacements are `spring.web.error.*`. Nothing fails at startup, so a stale key silently does nothing.
- **Source**: `META-INF/spring-configuration-metadata.json` in `spring-boot-web-server-4.1.2.jar`
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Jackson 3 API names and record serialization
- **Rule / Behavior**: Jackson 3 renamed `JsonNode.isTextual()` and `asText()` to `isString()` and `asString()`. On a record, Jackson also serializes public `isX()` methods as JSON properties unless they carry `@JsonIgnore`.
- **Source**: compilation against `tools.jackson.databind` 3.x
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Deterministic springdoc output
- **Rule / Behavior**: Declaring a server (`new Server().url("/")`) on the `OpenAPI` bean stops springdoc from emitting the request's host and random port, and `springdoc.writer-with-order-by-keys: true` sorts keys. Together they make `/v3/api-docs` byte-identical between runs, so the committed snapshot only changes when the API does.
- **Source**: an `OpenApiConfig` and an `OpenApiSnapshotIT`
- **Verified**: two regenerations of the snapshot diffed identical; 2026-11-11
- **Discovered in**: Carried over

### Spring Boot's scheduler defaults to one thread and does not wait at shutdown
- **Rule / Behavior**: In Boot 4.1.2, `spring.task.scheduling.pool.size` defaults to 1, `spring.task.scheduling.shutdown.await-termination` to false, and `await-termination-period` has no default, so one slow `@Scheduled` job delays every other job, and shutdown interrupts a running one. Relevant to the contact retry job.
- **Source**: `META-INF/spring-configuration-metadata.json` in `spring-boot-autoconfigure-4.1.2.jar`
- **Verified**: read from the metadata and asserted by an integration test; 2026-11-13
- **Discovered in**: Carried over

### Gradle 9.8 deprecations in the Kotlin DSL
- **Rule / Behavior**: `val x by tasks.registering(Type::class) { }` is deprecated and scheduled for removal in Gradle 10; `tasks.register<Type>("x") { }` is the replacement. Gradle 9 also fails a `Test` task whose `--tests` filter matches nothing.
- **Source**: `./backend/gradlew -p backend check --warning-mode all`
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

## PostgreSQL

### `CHAR(n)` pads with blanks
- **Rule / Behavior**: A value shorter than `n` written to a `CHAR(n)` column is read back through JDBC padded with spaces to `n` characters, so string equality with the original fails. Hashes and codes are `VARCHAR(n)` with a format `CHECK`.
- **Source**: a hash column that was changed from `CHAR(64)` to `VARCHAR(64)`
- **Verified**: the integration test failed with `CHAR(64)` and passed with `VARCHAR(64)`; 2026-11-11
- **Discovered in**: Carried over

### `JdbcTemplate` runs inside the JPA transaction
- **Rule / Behavior**: In a `@Transactional` method managed by `JpaTransactionManager`, `JdbcTemplate` uses the transaction's own connection, so session settings such as `SET TRANSACTION READ ONLY` apply to every later statement of that transaction, JPA or JDBC.
- **Source**: a query service mixing JPA and `JdbcTemplate`
- **Verified**: an integration test read `SHOW transaction_read_only` in the same transaction; 2026-11-12
- **Discovered in**: Carried over

## Shell and Docker tooling

### macOS ships bash 3.2
- **Rule / Behavior**: `/bin/bash` on macOS is 3.2.57 and is the `bash` found on `PATH`, so `#!/usr/bin/env bash` scripts run under it. Bash 4 features fail there, such as `${var^^}` and `mapfile`. Repository scripts stay bash 3.2 compatible.
- **Source**: `bash -c 'echo $BASH_VERSION'`
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Reading compose state and port owners
- **Rule / Behavior**: `docker compose ps --all --format '{{.State}} {{.Health}}' <service>` prints `running healthy` for a healthy service and nothing for a service with no container. `docker compose port <service> <port>` prints `0.0.0.0:<host port>`. Docker Desktop's port forwards show up in `lsof` as the command `com.docke`.
- **Source**: `scripts/check-services.sh`
- **Verified**: Docker Engine 29.4.2 with Compose 5.1.3; 2026-11-11
- **Discovered in**: Carried over

### A self-timer does not stop child processes
- **Rule / Behavior**: `perl -e 'alarm N; exec @ARGV' …` ends the process it execs. `pnpm dev` runs Vite as a child, so Vite keeps running after the timer fires. Self-time the Vite binary itself, or stop the dev server by hand.
- **Source**: an orphaned Vite process found after a live check
- **Verified**: `ps` showed the Vite process re-parented to PID 1 and still listening; 2026-11-11
- **Discovered in**: Carried over

## Node and frontend tooling

### Vite 8 needs a recent Node
- **Rule / Behavior**: Vite 8.3.8 declares `engines.node` as `^20.19.0 || >=22.12.0`. The repository pins Node 24.22.0 in `.nvmrc`; agents run Node commands through `scripts/with-node.sh`.
- **Source**: `npm view vite engines`
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Frontend toolchain facts
- **Rule / Behavior**: The Vite 8 `react-ts` template pins TypeScript 7.0.2 and ships oxlint rather than ESLint. typescript-eslint 8.72.2 supports only `typescript >=4.8.4 <6.1.0`, and `openapi-typescript` 7.13.0 declares `typescript ^5` but works on 6.0.3. pnpm 11.0.9 ignores `save-exact` in `.npmrc` and reads `saveExact` from `pnpm-workspace.yaml`. MSW 3 renamed the `listen` option `onUnhandledRequest` to `onUnhandledFrame`. `openapi-fetch` 0.17 captures `globalThis.fetch` when the client is created.
- **Source**: a working `package.json`, `pnpm-workspace.yaml`, API client, and test setup
- **Verified**: install, type check, lint, tests, and the build, all passing; 2026-11-11
- **Discovered in**: Carried over

### Frontend package versions
- **Rule / Behavior**: The newest published versions were vite 8.3.8, react 19.3.1, @tanstack/react-query 5.107.1, react-router-dom 7.18.5, zod 4.6.7, react-hook-form 7.91.0, vitest 5.1.0, openapi-typescript 7.13.0, msw 3.0.5, @vitejs/plugin-react 6.3.0, eslint 10.14.0, prettier 3.9.10, and pnpm 12.18.0. Tailwind CSS and `@vercel/analytics` were not checked yet.
- **Source**: `npm view <package> version`
- **Verified**: 2026-11-11
- **Discovered in**: Carried over
