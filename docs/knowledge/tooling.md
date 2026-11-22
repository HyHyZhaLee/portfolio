# Tooling

Facts about the libraries and tools this site uses. The entries marked **Carried over** were verified in the owner's earlier Spring Boot 4 and React scaffold on the date given, with the same toolchain this repository adopts; re-check each one when the code that depends on it lands, then replace the provenance with the PF ticket that confirmed it. Versions are as of the date in each entry.

## Spring Boot and Java

### Spring Initializr default and Boot-managed versions
- **Rule / Behavior**: On 2026-11-22 the Initializr default was Spring Boot 4.2.0 (Java 17 preselected; 27, 25, 21, and 17 offered), and a generated Gradle project shipped wrapper 9.9.2. On 2026-11-11 the default had been 4.1.2, which manages Spring Framework 7.0.10, Spring Security 7.1.2, Hibernate 7.4.13.Final, Jackson 3.1.7 (with Jackson 2.21.7 alongside), Flyway 12.4.0, Testcontainers 2.0.5, JUnit Jupiter 6.0.3, Mockito 5.23.0, AssertJ 3.27.7, and the PostgreSQL driver 42.7.14.
- **Source**: `https://start.spring.io/metadata/client`, the generated `gradle/wrapper/gradle-wrapper.properties`, and `spring-boot-dependencies-4.1.2.pom` on Maven Central
- **Verified**: 4.2.0 and wrapper 9.9.2 on 2026-11-22; the 4.1.2 managed versions on 2026-11-11
- **Discovered in**: PF-002 (4.2.0); carried over (4.1.2)

### Shape of a generated Boot 4 Gradle project
- **Rule / Behavior**: A Gradle Kotlin DSL project zip has no top-level folder. It uses split starters (`spring-boot-starter-webmvc`, `spring-boot-starter-flyway`, and one `-test` starter per module, such as `spring-boot-starter-webmvc-test`). Its `TestcontainersConfiguration` uses `org.testcontainers.postgresql.PostgreSQLContainer` without a type parameter, from `org.testcontainers:testcontainers-postgresql`, with the image `postgres:latest` (pin it). It also generates a `Test{Name}Application`, the entry point for `./gradlew bootTestRun`. `spring-boot-starter-webmvc-test` already brings `spring-boot-resttestclient`, so `RestTestClient` needs no extra dependency.
- **Source**: generated `build.gradle.kts` and test sources; `./backend/gradlew -p backend dependencies --configuration testRuntimeClasspath`
- **Verified**: generated with Boot 4.2.0, compiled, and `bootTestRun` started against Testcontainers; 2026-11-22
- **Discovered in**: PF-002

### Libraries added outside the Boot BOM
- **Rule / Behavior**: `springdoc-openapi-starter-webmvc-ui` 3.2.1 works with Spring Boot 4.2.0 (`/v3/api-docs` and Swagger UI served, OpenAPI 3.1.0 output). The Spotless Gradle plugin 8.12.0 with palantir-java-format 2.103.0 formats under Java 21 and Gradle 9.9.2. Resilience4j, Bucket4j, WireMock, and Caffeine are not checked yet; each is added with its first caller (PF-002 plan, D2).
- **Source**: `maven-metadata.xml` of each artifact on Maven Central; `backend/build.gradle.kts`
- **Verified**: `./backend/gradlew -p backend check` and `OpenApiSnapshotIT` passing; 2026-11-22
- **Discovered in**: PF-002

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

### Spring Boot 4.2 renamed the forwarded-headers property
- **Rule / Behavior**: `server.forward-headers-strategy` is deprecated since 4.2.0 with the replacement `server.request.header.forwarded.strategy` (values such as `framework`). The old key still binds for now but is marked for removal.
- **Source**: `META-INF/spring-configuration-metadata.json` in `spring-boot-web-server-4.2.0.jar`
- **Verified**: read from the metadata; the application starts with the new key; 2026-11-22
- **Discovered in**: PF-002

### Spring Security autoconfiguration in Boot 4
- **Rule / Behavior**: `UserDetailsServiceAutoConfiguration` lives in `org.springframework.boot.security.autoconfigure` (module `spring-boot-security`). Excluding it stops Boot from creating an in-memory user and logging a generated password, which an API with no logins never needs. With a custom `SecurityFilterChain` that disables HTTP Basic and form login and ends in `denyAll()`, an unauthenticated request to any other path answers 403.
- **Source**: class listing of `spring-boot-security-4.2.0.jar`; `PortfolioApplication`, `SecurityConfig`
- **Verified**: `HealthIT` asserts 403 for `/actuator/env` and for `POST /actuator/health`; 2026-11-22
- **Discovered in**: PF-002

### Spring Security authorizes the error dispatch and matches HEAD separately
- **Rule / Behavior**: Spring Security 7 also authorizes `ERROR` dispatches, so with `anyRequest().denyAll()` every response rendered through `/error` (a 404 from `sendError`, an uncaught 500) reaches the client as 403 unless `.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()` comes first. A `requestMatchers(HttpMethod.GET, …)` rule does not cover `HEAD`, even though Spring MVC answers `HEAD` for `GET` handlers.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/platform/security/SecurityConfig.java`
- **Verified**: `HealthIT` failed with 403 for `GET /swagger-ui/missing.js` and `HEAD /actuator/health`, and passed with 404 and 200 after the two rules were added; 2026-11-22
- **Discovered in**: PF-002

### `spring.mvc.problemdetails` exposes framework text
- **Rule / Behavior**: With `spring.mvc.problemdetails.enabled: true`, Boot's `ProblemDetailsExceptionHandler` answers framework exceptions itself, with framework wording in `detail` (for example `"No static resource missing.js."`) and no `code` or `correlationId`. With it off, the same request goes through `sendError` to `/error`, whose default body carries `timestamp`, `status`, `error`, and `path` but no message.
- **Source**: `curl localhost:8080/swagger-ui/missing.js` with the setting on and off
- **Verified**: 2026-11-22
- **Discovered in**: PF-002

### Testcontainers service connections need no datasource defaults
- **Rule / Behavior**: With `spring.datasource.url: ${DB_URL}` (no default) in `application.yml` and no `DB_URL` in the environment, `@ServiceConnection` on the Testcontainers PostgreSQL still supplies the connection, and the context starts. The placeholder only matters where no service connection exists, such as `bootRun` without the `local` profile.
- **Source**: `backend/src/main/resources/application.yml`, `support/TestcontainersConfiguration`
- **Verified**: `testIT` and `bootTestRun` pass after the defaults moved to `application-local.yml`; 2026-11-22
- **Discovered in**: PF-002

### Health components and springdoc startup warnings in Boot 4.2
- **Rule / Behavior**: With `management.endpoint.health.show-components: always`, `/actuator/health` lists `db`, `diskSpace`, `livenessState`, `ping`, `readinessState`, and `ssl` (status only, no details). springdoc 3.2.1 logs a startup WARN that `/v3/api-docs` and `/swagger-ui.html` are "enabled by default" unless `springdoc.api-docs.enabled` and `springdoc.swagger-ui.enabled` are set explicitly.
- **Source**: `curl localhost:8080/actuator/health`; the `bootRun` log
- **Verified**: 2026-11-22
- **Discovered in**: PF-002

### Jackson 3 API names and record serialization
- **Rule / Behavior**: Jackson 3 renamed `JsonNode.isTextual()` and `asText()` to `isString()` and `asString()`. On a record, Jackson also serializes public `isX()` methods as JSON properties unless they carry `@JsonIgnore`.
- **Source**: compilation against `tools.jackson.databind` 3.x
- **Verified**: 2026-11-11
- **Discovered in**: Carried over

### Deterministic springdoc output
- **Rule / Behavior**: Declaring a server (`new Server().url("/")`) on the `OpenAPI` bean stops springdoc from emitting the request's host and random port, and `springdoc.writer-with-order-by-keys: true` sorts keys. Together they make `/v3/api-docs` byte-identical between runs, so the committed snapshot only changes when the API does.
- **Source**: an `OpenApiConfig` and an `OpenApiSnapshotIT`
- **Verified**: two regenerations of the snapshot diffed identical; 2026-11-11. Re-confirmed with springdoc 3.2.1 on 2026-11-22
- **Discovered in**: Carried over; re-checked in PF-002

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

### Gradle 9.9 passes a tag-filtered test task that finds no tests
- **Rule / Behavior**: A `Test` task whose JUnit Platform tag filter (`excludeTags("integration")`) matches no test passes; it does not need `failOnNoDiscoveredTests = false`. Only a `--tests` filter that matches nothing fails the task.
- **Source**: `testUnit` in `backend/build.gradle.kts` before any unit test exists
- **Verified**: `./backend/gradlew -p backend testUnit --rerun` exits 0 with Gradle 9.9.2; 2026-11-22
- **Discovered in**: PF-002

### A file written by a test is not a task output unless declared
- **Rule / Behavior**: Gradle does not know that `OpenApiSnapshotIT` writes `backend/openapi/openapi.json`, so `testIT` stays UP-TO-DATE after the file is edited or reverted, and `make openapi` silently keeps the stale file. Declaring `outputs.file("openapi/openapi.json")` on `testIT` makes a changed file put the task out of date.
- **Source**: `backend/build.gradle.kts`
- **Verified**: with the output declared, overwriting the snapshot made `make openapi` rerun `testIT` and restore an identical file, and a second run was UP-TO-DATE; 2026-11-22
- **Discovered in**: PF-002

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
- **Discovered in**: Carried over; re-checked in PF-002

### Frontend toolchain facts
- **Rule / Behavior**: The Vite 8 `react-ts` template pins TypeScript 7 and ships oxlint rather than ESLint. typescript-eslint 8.72.2 and 8.73.0 support only `typescript >=4.8.4 <6.1.0`, and `openapi-typescript` 7.13.0 declares `typescript ^5` but works on 6.0.3. pnpm 11 ignores `save-exact` in `.npmrc` and reads `saveExact` from `pnpm-workspace.yaml`. MSW 3 renamed the `listen` option `onUnhandledRequest` to `onUnhandledFrame`. `openapi-fetch` 0.17 captures `globalThis.fetch` when the client is created. eslint-plugin-react-hooks 7.1.1 exposes its flat config as `configs.flat['recommended-latest']`.
- **Source**: `frontend/package.json`, `frontend/pnpm-workspace.yaml`, `frontend/eslint.config.js`, `frontend/src/test/setup.ts`, the packages' `peerDependencies` and type definitions
- **Verified**: install, type check, lint, tests, and the build, all passing; 2026-11-22
- **Discovered in**: PF-002 (first verified in the owner's earlier scaffold on 2026-11-11)

### Corepack picks the pnpm version from the working directory
- **Rule / Behavior**: `scripts/with-node.sh pnpm --dir frontend …` runs from the repository root, which has no `package.json`, so corepack runs its own default pnpm (11.0.9 with corepack 0.36.0). pnpm then compares itself with `frontend/package.json` and fails when `packageManager` names a different version ("This project is configured to use … Your current pnpm is v11.0.9"). So `packageManager` pins the version corepack runs by default.
- **Source**: `frontend/package.json`
- **Verified**: `pnpm --dir frontend add` failed with `pnpm@11.28.12` pinned and succeeded with `pnpm@11.0.9`; 2026-11-22
- **Discovered in**: PF-002

### React Router 8
- **Rule / Behavior**: React Router 8 (8.0.0 released 2026-06-17) is a single `react-router` package with peers `react >=19.2.7` and Node `>=22.22.0`. `createBrowserRouter`, `RouterProvider`, `createMemoryRouter`, `MemoryRouter`, `Outlet`, `Link`, and `useLocation` keep their React Router 7 names and usage.
- **Source**: `npm view react-router@8.5.1 peerDependencies engines`; `frontend/src/app/`
- **Verified**: type check and route tests passing with 8.5.1; 2026-11-22
- **Discovered in**: PF-002

### openapi-fetch middleware error routing
- **Rule / Behavior**: In openapi-fetch 0.17, `onError` runs only when `fetch` itself rejects (no response, abort, timeout). An error thrown from `onRequest` or `onResponse` skips `onError` and rejects the client call directly, and the 2xx body is parsed with `JSON.parse` after all middleware, outside any of them. So the client converts its own failures in `onRequest`, reads and checks 2xx bodies in `onResponse`, and handles network failures in `onError`. A contract with no endpoints generates `export type paths = Record<string, never>`.
- **Source**: `node_modules/openapi-fetch/dist/index.mjs`; `frontend/src/api/client.ts`; `frontend/src/api/schema.d.ts`
- **Verified**: `client.test.ts` covers problem, non-problem, network, and timeout paths; 2026-11-22
- **Discovered in**: PF-002

### MSW reads a mocked body before answering
- **Rule / Behavior**: MSW 3 consumes a mocked response's body stream before it hands the response to `fetch`, so a stream that errors fails the whole request as a network error. To test a body that breaks off after the headers, stub `globalThis.fetch` itself with a `Response` over the erroring stream.
- **Source**: `frontend/src/api/client.test.ts`
- **Verified**: the MSW version of the test passed through `onError` and left the body-read branch uncovered; the `fetch` stub covered it; 2026-11-22
- **Discovered in**: PF-002

### Frontend package versions
- **Rule / Behavior**: On 2026-11-22 the newest published versions were react 19.3.1, vite 8.3.8, @vitejs/plugin-react 6.3.0, tailwindcss and @tailwindcss/vite 4.3.5, @tanstack/react-query 5.108.2, react-router 8.5.2, openapi-fetch 0.17.0, openapi-typescript 7.13.0, react-hook-form 7.92.0, zod 4.6.7, eslint 10.15.0, typescript-eslint 8.73.0, prettier 3.10.1, vitest 5.1.1, msw 3.0.7, jsdom 31.0.1, @testing-library/jest-dom 8.0.0, and typescript 7.0.2. Where the newest release was less than a week old, PF-002 installed the newest one that was at least a week old (see `frontend/package.json` and the PF-002 plan, D10). `@vercel/analytics` is not checked yet.
- **Source**: `npm view <package> version` and `npm view <package> time`
- **Verified**: 2026-11-22
- **Discovered in**: PF-002
