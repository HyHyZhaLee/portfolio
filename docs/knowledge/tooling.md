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
- **Rule / Behavior**: `springdoc-openapi-starter-webmvc-ui` 3.2.1 works with Spring Boot 4.2.0 (`/v3/api-docs` and Swagger UI served, OpenAPI 3.1.0 output). The Spotless Gradle plugin 8.12.0 with palantir-java-format 2.103.0 formats under Java 21 and Gradle 9.9.2. Bucket4j 8.22.0 and Boot-managed Caffeine arrived in PF-004. `io.github.resilience4j:resilience4j-retry` 2.4.0 (published 2026-03-14, not managed by Boot) and, test-only, `org.wiremock:wiremock-standalone` 3.13.2 (published 2025-11-14) arrived in PF-006 and pass `check` with Boot 4.2.0.
- **Source**: `maven-metadata.xml` of each artifact on Maven Central; `backend/build.gradle.kts`
- **Verified**: `./backend/gradlew -p backend check` and `OpenApiSnapshotIT` passing; 2026-11-22; the PF-006 versions by the `last-modified` header of each POM on Maven Central and `check`, 2026-11-23
- **Discovered in**: PF-002, PF-006

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

### springdoc 3.2.1 output for request and response records
- **Rule / Behavior**: A record component is listed in the schema's `required` when it carries `@NotBlank` or `@Schema(requiredMode = Schema.RequiredMode.REQUIRED)`; one with only `@Size` stays optional and also gets `minLength: 0`. `@Schema(types = {"string", "null"})` on an `Instant` emits `"type": ["string", "null"]` with `format: date-time`, which openapi-typescript 7.13.0 generates as `since?: string | null`. A `void` handler with `@ResponseStatus(HttpStatus.ACCEPTED)` gets a `202` response described "Accepted" with no content (`content?: never` in the generated operation). A handler without `produces` lists its 200 body under `*/*`, and openapi-fetch 0.17 still types `data` from it, because its default media type is the template `${string}/${string}` (openapi-typescript-helpers 0.1.0).
- **Source**: `backend/src/main/java/com/huygialy/portfolio/visit/api/RecordVisitRequest.java`, `stats/api/StatsSummaryResponse.java`, `visit/api/VisitController.java`; `backend/openapi/openapi.json`; `frontend/src/api/schema.d.ts`; `MediaType` in `openapi-typescript-helpers/dist/index.d.ts`
- **Verified**: `make openapi` output read after PF-005 S2, and `check:type` passing with `data.totalViews` read from `getStatsSummary`; 2026-11-23
- **Discovered in**: PF-005

### Security denials and problem JSON in Spring 7
- **Rule / Behavior**: An `AuthenticationEntryPoint` and an `AccessDeniedHandler` that call the MVC `HandlerExceptionResolver` bean named `handlerExceptionResolver` (`resolveException(request, response, null, ex)`) make the `@RestControllerAdvice` render security denials, so they answer the same problem JSON as MVC errors. With Jackson 3, values set through `ProblemDetail.setProperty(...)` serialize as top-level members (`$.code`, not `$.properties.code`). A correlation filter registered through a `FilterRegistrationBean` at the highest precedence runs before the security chain, so denials carry the ID too.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/platform/security/SecurityConfig.java`, `platform/error/GlobalExceptionHandler.java`, `platform/web/WebConfig.java`
- **Verified**: `PlatformWebIT` asserts 404 `application/problem+json` with top-level `code` and `correlationId` for `GET /actuator/env` and `POST /actuator/health`; 2026-11-23
- **Discovered in**: PF-004

### CORS rejection bypasses the exception handler
- **Rule / Behavior**: With `http.cors(withDefaults())` and a `CorsConfigurationSource` bean, Spring Security answers a preflight from an allowed origin with 200 before authorization, even when the path ends in `denyAll()` for other methods. A cross-origin request from any other origin gets 403 with no allow headers from Spring's `DefaultCorsProcessor`, which does not go through the `@RestControllerAdvice`, so it is not problem JSON.
- **Source**: `DefaultCorsProcessor.rejectRequest` in spring-web; `backend/src/main/java/com/huygialy/portfolio/platform/security/SecurityConfig.java`
- **Verified**: `PlatformWebIT` preflights from `https://allowed.example` (200 with `Access-Control-Allow-Origin`) and `https://evil.example` (403 without it); 2026-11-23
- **Discovered in**: PF-004

### Boot 4.2 class locations used by platform code and tests
- **Rule / Behavior**: `FilterRegistrationBean` is still `org.springframework.boot.web.servlet.FilterRegistrationBean`. For `ApplicationContextRunner` tests, `ConfigurationPropertiesAutoConfiguration` is in `org.springframework.boot.autoconfigure.context` and `ValidationAutoConfiguration` in `org.springframework.boot.validation.autoconfigure` (module `spring-boot-validation`, brought by `spring-boot-starter-validation`).
- **Source**: `backend/src/main/java/com/huygialy/portfolio/platform/web/WebConfig.java`; `backend/src/test/java/com/huygialy/portfolio/platform/PlatformPropertiesTest.java`
- **Verified**: both compile and pass against Boot 4.2.0; 2026-11-23
- **Discovered in**: PF-004

### Bucket4j 8.22 API
- **Rule / Behavior**: The Java 17+ artifact is `com.bucket4j:bucket4j_jdk17-core`. A limit is `Bandwidth.builder().capacity(n).refillGreedy(n, period).build()`, a bucket `Bucket.builder().addLimit(bandwidth).withCustomTimePrecision(timeMeter).build()`, and `tryConsumeAndReturnRemaining(1)` returns a probe with `isConsumed()` and `getNanosToWaitForRefill()`. A custom `TimeMeter` that reads an injected `Clock` lets tests move time. 8.23.0 was published on 2026-11-22, so PF-004 pinned 8.22.0 (2026-11-03).
- **Source**: `backend/src/main/java/com/huygialy/portfolio/platform/ratelimit/RateLimiter.java`; Maven Central `maven-metadata.xml`
- **Verified**: `RateLimiterTest` rejects the 31st visit in a minute and passes again after the clock moves one minute; 2026-11-23
- **Discovered in**: PF-004

### Backend Docker image baseline
- **Rule / Behavior**: `backend/Dockerfile` builds on `eclipse-temurin:21.0.13_9-jdk` and runs on `eclipse-temurin:21.0.13_9-jre` (both Ubuntu-based, so `useradd` exists). The image is about 600 MB. Under `docker run --memory=512m` with the Render Free JVM flags it starts in about 2.4 s on a developer laptop and uses about 250 MiB after startup; Render's 0.1 CPU will be far slower, which PF-012 measures. Without a required setting such as `ALLOWED_ORIGINS` it stops at startup with a binding error naming the property.
- **Source**: `backend/Dockerfile`; `docker run` against the compose PostgreSQL
- **Verified**: health UP with `db` UP on the image, `docker stats`, and the failed start without `ALLOWED_ORIGINS`; 2026-11-23
- **Discovered in**: PF-004

### Firewall rejections reach `/error`, not the advice
- **Rule / Behavior**: Spring Security's `StrictHttpFirewall` rejects URLs such as one containing a semicolon before any controller and answers 400 through `sendError`, so the response goes through the `/error` dispatch. Boot's `BasicErrorController` then writes its default body (`timestamp`, `status`, `error`, `path` as `application/json`), bypassing the `@RestControllerAdvice`. A bean implementing `org.springframework.boot.webmvc.error.ErrorController` (Boot 4 package) replaces `BasicErrorController`; on that dispatch the status is in `RequestDispatcher.ERROR_STATUS_CODE` and the original path in `RequestDispatcher.ERROR_REQUEST_URI`.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/platform/error/ProblemErrorController.java`
- **Verified**: a probe test saw Boot's default body for `GET /api/v1/x;jsessionid=1`; with the controller, `PlatformWebIT` gets 400 problem JSON with `code` `VALIDATION_FAILED` and the original path as `instance`; 2026-11-23
- **Discovered in**: PF-004

### `bootTestRun` is a separate `BootRun` task
- **Rule / Behavior**: Configuration on `tasks.named<BootRun>("bootRun")` does not reach `bootTestRun`, which is another `BootRun` task (it runs the test entry point against Testcontainers). Settings meant for both, such as a default profile, go on `tasks.withType<BootRun>().configureEach { … }`.
- **Source**: `backend/build.gradle.kts`
- **Verified**: `bootTestRun` failed at startup without the `local` profile's settings, then started with `The following 1 profile is active: "local"` and answered health UP on a spare port; 2026-11-23
- **Discovered in**: PF-004

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

### `gradle dependencies` downloads POM files, not jars
- **Rule / Behavior**: `./gradlew dependencies` resolves each configuration's graph, which needs only the POM metadata, so a Docker layer that runs it holds no jars and the next step downloads them all. A task that declares the configurations as inputs (`inputs.files(files(configurations.compileClasspath, …))`) makes Gradle download the artifacts before it runs, and a later `--offline` build proves nothing is missing.
- **Source**: `backend/build.gradle.kts` (`downloadDependencies`), `backend/Dockerfile`
- **Verified**: the image build's `bootJar` step downloaded jars after the `dependencies` layer; with `downloadDependencies` the `--offline` `bootJar` step passes; 2026-11-24
- **Discovered in**: PF-024

### Gradle `--rerun` applies to one task
- **Rule / Behavior**: `--rerun` is an option of the task named just before it, not of the whole build: `gradlew testUnit testIT --rerun check` reran only `testIT` and left `testUnit` UP-TO-DATE. Put `--rerun` after each task that must run again (`testUnit --rerun testIT --rerun`).
- **Source**: `./backend/gradlew -p backend …` with Gradle 9.9.2
- **Verified**: the task log showed `> Task :testUnit UP-TO-DATE` and the unit-test result timestamps stayed old until `testUnit --rerun` was run; 2026-11-23
- **Discovered in**: PF-005

### WireMock standalone on the Boot 4 test classpath
- **Rule / Behavior**: `org.wiremock:wiremock-standalone:3.13.2` runs inside the shared Spring Boot 4.2 integration-test context next to Tomcat, Jakarta Servlet 6.1, and Jackson 3 without classpath clashes, because the jar shades Jetty, `jakarta.servlet`, Jackson, and Apache HttpClient under `wiremock.`. A `WireMockServer` bean with `initMethod = "start"` and a `DynamicPropertyRegistrar` reading `server::baseUrl` points an adapter at it. The JDK `HttpClient` needs `HttpClient.Version.HTTP_1_1` against WireMock's plain-HTTP port, or it tries an h2c upgrade.
- **Source**: `backend/src/test/java/com/huygialy/portfolio/support/WireMockSupport.java`
- **Verified**: `ResendEmailSenderIT`, `ContactApiIT`, and `ContactRetryJobIT` green in `check`; 2026-11-23
- **Discovered in**: PF-006

### Resilience4j retry rethrows the last exception
- **Rule / Behavior**: In `resilience4j-retry` 2.4.0, `Retry.executeSupplier` with `retryOnException(predicate)` retries only exceptions the predicate accepts, rethrows any other exception at once, and after `maxAttempts` rethrows the last attempt's exception itself (not a wrapper). `IntervalFunction.ofExponentialBackoff(Duration, double)` gives the waits between tries; the core module needs only `slf4j-api`.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/contact/ResendEmailSender.java`
- **Verified**: `ResendEmailSenderIT`: 503 on every try throws `DeliveryException` `HTTP_503` after exactly 3 requests, and 400 after exactly 1; 2026-11-23
- **Discovered in**: PF-006

### Spring Framework 7.1 `RestClient` message converters
- **Rule / Behavior**: `RestClient.Builder.messageConverters(Iterable)` is deprecated for removal in Spring Framework 7.1; `configureMessageConverters(builder -> builder.withStringConverter(...).withJsonConverter(new JacksonJsonHttpMessageConverter(jsonMapper)))` replaces it. With `JdkClientHttpRequestFactory.setReadTimeout`, a response slower than the timeout surfaces as `ResourceAccessException`, and a 4xx or 5xx from `retrieve()` as `RestClientResponseException`.
- **Source**: `ResendEmailSender`; compiler warning `[removal]` on `assemble`
- **Verified**: `assemble` warning, then `ResendEmailSenderIT` (a 1 s WireMock delay against a 500 ms read timeout); 2026-11-23
- **Discovered in**: PF-006

### Hibernate 7 HQL enum shorthand and nested constructor results
- **Rule / Behavior**: Hibernate 7 accepts an unqualified enum constant when the other side is an enum attribute, in a comparison (`where m.status = FAILED`) and in an update's `set` (`set m.status = PENDING`), and a constructor expression for a nested record written with `$` (`select new com.example.Repo$RetryCandidate(m.id, m.attempts)`). A bulk `update` does not bump `@Version`; set `m.version = m.version + 1` explicitly.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/contact/ContactMessageRepository.java`
- **Verified**: Spring Data validated both queries at startup and `ContactRetryJobIT` ran them; 2026-11-23
- **Discovered in**: PF-006

### `@ConfigurationPropertiesScan` honors `@Profile`
- **Rule / Behavior**: A `@ConfigurationProperties` record annotated `@Profile("!local")` is not bound when the `local` profile is active, so its `@NotBlank` settings cannot fail a local start; under any other profile it is bound and validated. `spring.profiles.active` set as a property in an `ApplicationContextRunner` is enough to test it.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/contact/ResendProperties.java`
- **Verified**: `ContactPropertiesTest`; 2026-11-23
- **Discovered in**: PF-006

### Jackson 3 fails on a missing primitive by default
- **Rule / Behavior**: In `jackson-databind` 3.1.8, `DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES` is on by default, so reading JSON into a record with a primitive component (`boolean`, `int`) fails with `MismatchedInputException: Cannot map null into type boolean` when the JSON omits that field; a `RestClient` surfaces it as `RestClientException` ("Error while extracting response"). `JsonMapper.builder(...).disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)` reads the absent field as `false` or 0. An `Instant` field reads from an ISO-8601 string with no extra module.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/project/GitHubRestClient.java`
- **Verified**: `ProjectApiIT` failed with that exception for repositories without a `fork` field and passed once the feature was disabled; 2026-11-23
- **Discovered in**: PF-007

### Boot's Jackson read cap applies to the injected `JsonMapper`
- **Rule / Behavior**: `spring.jackson.factory.constraints.read.max-document-length` (65536 in `application.yml`) is applied to Boot's auto-configured `JsonMapper` bean, so an adapter that parses a provider response with the injected mapper fails on any body over the cap. A mapper built with `JsonMapper.builder(JsonFactory.builder().streamReadConstraints(StreamReadConstraints.builder().maxDocumentLength(n).build()).build())` is not affected.
- **Source**: `backend/src/main/resources/application.yml`, `GitHubRestClient`
- **Verified**: a throwaway integration test: the injected `JsonMapper` rejected a 70,000-character document with a length error; `ProjectApiIT` parses a GitHub body over 64 KB with the adapter's own mapper; 2026-11-23
- **Discovered in**: PF-007

### Resilience4j circuit breaker counting
- **Rule / Behavior**: In `resilience4j-circuitbreaker` 2.4.0 with a `COUNT_BASED` window, `minimumNumberOfCalls(2)`, and `failureRateThreshold(50)`, one success followed by one failure opens the circuit, because a 50% failure rate meets the threshold. While it is open, `executeSupplier` throws `CallNotPermittedException` without calling the supplier. `reset()` returns it to `CLOSED` with empty metrics, so integration tests can share one breaker bean and reset it before each test.
- **Source**: `backend/src/main/java/com/huygialy/portfolio/project/ProjectConfig.java`, `ProjectQueryService`
- **Verified**: `ProjectApiIT`: after `reset()`, three API calls (a success, a 403, then one more) sent exactly two requests to WireMock; 2026-11-23
- **Discovered in**: PF-007

### Boot 4.2 serves the liveness and readiness groups by default
- **Rule / Behavior**: In Spring Boot 4.2, `management.endpoint.health.probes.enabled` defaults to `true` (its configuration metadata says so), so `/actuator/health` lists `livenessState` and `readinessState` and reports `"groups":["liveness","readiness"]`, and `/actuator/health/liveness` answers without the `db` component outside Kubernetes too. A security chain that permits only the exact `/actuator/health` path answers the group path 404 until it is added to the public rules.
- **Source**: `spring-boot-health-4.2.0.jar` configuration metadata; `platform/security/SecurityConfig.java`; `HealthIT`
- **Verified**: production `GET /actuator/health/liveness` answered 404 `NOT_FOUND` before PF-023; `HealthIT.livenessIsPublicAndNeverChecksTheDatabase` passes after it; 2026-11-24
- **Discovered in**: PF-023

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

## GitHub Actions

### A called workflow sees environment secrets only when the caller passes secrets
- **Rule / Behavior**: In a called workflow (`on: workflow_call`), a job with `environment:` does not read that environment's secrets by itself: unless the caller passes secrets (`secrets: inherit`, or the secret by name), `secrets.<NAME>` resolves to an empty string, whether or not `<NAME>` is declared under `on.workflow_call.secrets`. The caller cannot read the environment's secrets itself, so it uses `secrets: inherit`. With no `secrets:` declared in the called workflow, actionlint does not type-check `secrets.*` there.
- **Source**: `.github/workflows/ci-cd.yml` (`secrets: inherit` on the `staging` and `production` jobs), `.github/workflows/deploy.yml`; GitHub docs, Reuse workflows ("If the caller workflow doesn't pass an environment secret, the secret resolves to an empty string"); actions/runner issue 4453
- **Verified**: runs 45592131148 (secret declared, not passed) and 45593658140 (not declared, not passed) both logged `RENDER_DEPLOY_HOOK_URL:` empty, and curl failed with "URL rejected: Bad hostname", while the `staging` environment held the secret; actionlint 1.7.12 passes with neither a declaration nor an ignore entry; 2026-11-25
- **Discovered in**: PF-027

### Linting workflows and scripts without installing tools
- **Rule / Behavior**: `docker run --rm -v "$PWD":/repo -w /repo rhysd/actionlint:<version>` lints every workflow and runs shellcheck on each `run:` block; `docker run --rm -v "$PWD":/mnt -w /mnt koalaman/shellcheck:<version> <scripts>` checks shell scripts. A plain YAML scalar containing `: ` (for example `run: echo "to $ENV: $URL"`) is a parse error, so such a step needs a `run: |` block.
- **Source**: `.github/workflows/`, `scripts/release-gate.sh`, `scripts/wait-for-commit.sh`
- **Verified**: actionlint 1.7.12 and shellcheck v0.11.0 on PF-027's workflows and scripts; 2026-11-25
- **Discovered in**: PF-027

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

### React Router 8 scroll restoration and jsdom
- **Rule / Behavior**: `<ScrollRestoration />` needs a data router (`createBrowserRouter`, `createMemoryRouter`). After a navigation whose location has a hash it calls `scrollIntoView()` on the element with that id, and otherwise scrolls to the top with `window.scrollTo`, so `<Link to={{ pathname: '/', hash: '#work' }}>` lands on the section from any route with no extra effect. jsdom implements neither `window.scrollTo` nor `Element.prototype.scrollIntoView`, so the test setup stubs both.
- **Source**: `useScrollRestoration` in `node_modules/react-router/dist/development/lib/dom/lib.js`; `frontend/src/app/RootLayout.tsx`; `frontend/src/test/setup.ts`
- **Verified**: `CaseStudyPage.test.tsx` clicks a header link from a case study and sees `scrollIntoView` called on the home page; 2026-11-23
- **Discovered in**: PF-003

### openapi-fetch rejects a relative URL in Node
- **Rule / Behavior**: With an empty `baseUrl`, openapi-fetch 0.17 builds `new Request('/actuator/health')`. Browsers resolve that against the page, but Node's `Request` throws `TypeError` (`ERR_INVALID_URL`) inside `client.GET`, before any middleware, so the call rejects with a raw `TypeError` rather than an `ApiError`, and MSW never sees a request. Vitest therefore sets `test.env.VITE_API_URL` to an absolute origin (`http://api.test`).
- **Source**: `frontend/vite.config.ts`; `frontend/src/features/api-status/api.ts`
- **Verified**: a probe test of `getHealth()` failed with `ERR_INVALID_URL` and passed against the default MSW handler once the origin was set; 2026-11-23
- **Discovered in**: PF-003

### Fontsource variable fonts
- **Rule / Behavior**: `@fontsource-variable/bricolage-grotesque` 5.3.0 and `@fontsource-variable/source-serif-4` 5.3.1 ship `opsz.css` (roman, weight and optical-size axes; Source Serif 4 also has `opsz-italic.css`) and register the families as `'Bricolage Grotesque Variable'` and `'Source Serif 4 Variable'`, not the plain names. Each subset is its own `@font-face` with a `unicode-range` and `font-display: swap`; Vite emits every subset's woff2, and a browser downloads only the subsets its text uses. The Latin files are 76.9 kB and 122.4 kB.
- **Source**: `node_modules/@fontsource-variable/*/opsz.css`; `scripts/with-node.sh pnpm --dir frontend build` output
- **Verified**: production build of PF-003; 2026-11-23
- **Discovered in**: PF-003

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

### Vitest `stubEnv` and the production flag
- **Rule / Behavior**: In Vitest 5.1, `vi.stubEnv('PROD', true)` makes `import.meta.env.PROD` true for code that reads it while the test runs, and `vi.unstubAllEnvs()` in `afterEach` restores it. So production-only code reads the flag when it is called, not into a module constant, to stay testable.
- **Source**: `frontend/src/features/visits/tracking.ts` (`trackingAllowed`); `frontend/src/features/visits/useTrackPageView.test.tsx`
- **Verified**: the beacon test posts with `PROD` stubbed true and posts nothing with it stubbed false; 2026-11-23
- **Discovered in**: PF-005

### `useEffectEvent` and the hooks lint
- **Rule / Behavior**: React 19.3.1 exports `useEffectEvent` from `react` with types. eslint-plugin-react-hooks 7.1.1, with `exhaustive-deps` at `error`, accepts an effect that calls a `useEffectEvent` function without listing it, so an effect keyed only on `pathname` can read the latest `search` and `hash` without a suppression comment.
- **Source**: `frontend/src/features/visits/useTrackPageView.ts`; `frontend/eslint.config.js`
- **Verified**: `check:lint` (`--max-warnings 0`) and `check:type` pass; 2026-11-23
- **Discovered in**: PF-005

### Playwright smoke suite against `vite preview`
- **Rule / Behavior**: The repository marks elements with `data-test-id`, so `playwright.config.ts` sets `use.testIdAttribute: 'data-test-id'`; without it `getByTestId` times out. `vite preview` has no proxy, so an unmocked `/api/` call would receive `index.html`: abort `/api/` and `/actuator/` requests with `page.route`. Keep Playwright output inside `node_modules` (`outputDir: ./node_modules/.tmp/test-results`) so Prettier, ESLint, and git ignore it, and set `include-hidden-files: true` when uploading that folder because `actions/upload-artifact` skips dot folders. Limit Vitest's `include` to `src/**/*.test.{ts,tsx}` so it never collects `e2e/`.
- **Source**: `frontend/playwright.config.ts`, `frontend/e2e/smoke.spec.ts`, the `e2e` job in `.github/workflows/ci-cd.yml` (`.github/workflows/e2e.yml` before PF-027)
- **Verified**: four tests passed against the production build in about 2 s with Chromium headless shell 159 and `@playwright/test` 1.65.1; the first run failed on `getByTestId` until the attribute was set; 2026-11-24
- **Discovered in**: PF-008

### Per-route prerendered HTML and `vite preview`
- **Rule / Behavior**: `vite build --ssr src/app/routeMeta.ts --outDir node_modules/.tmp/ssr` bundles a TypeScript module that Node 24 then imports as plain ESM, so a build script can reuse the app's content modules with no new dependency. `vite preview` serves a prerendered `dist/work/<slug>/index.html` only at the trailing-slash URL; `/work/<slug>` falls through to the SPA `index.html` (Vercel serves both). Node's regex `replace` needs a function replacement when the text contains `$`.
- **Source**: `frontend/scripts/prerender.mjs`, `frontend/src/app/routeMeta.ts`, `frontend/e2e/smoke.spec.ts`
- **Verified**: `pnpm build` wrote seven files; the smoke test passed in Chromium and WebKit; 2026-11-24
- **Discovered in**: PF-009

### Lighthouse 13.5.0 against `vite preview`
- **Rule / Behavior**: `CHROME_PATH` pointed at Playwright's `Google Chrome for Testing` binary (`~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/`) with `--chrome-flags="--headless=new --no-sandbox"` runs `pnpm dlx lighthouse@13.5.0`; `--preset=desktop` selects desktop, and the default is mobile with simulated slow 4G. A server started with a plain background `&` inside a short command can die before the run, so start it as its own background task. Lighthouse 13 adds an "agentic-browsing" category (`llms-txt`, an agent schema) next to the four classic ones. Splitting the contact form (react-hook-form, zod) into a `React.lazy` chunk cut the entry bundle from 164 kB to 127 kB gzip and raised the mobile performance score from 88 to 90 to 92.
- **Source**: `docs/plans/site/PF-009-polish.md` (Results)
- **Verified**: four runs before and four after; 2026-11-24
- **Discovered in**: PF-009

### Playwright Firefox on this macOS machine
- **Rule / Behavior**: `playwright install firefox webkit` downloads Firefox 159 and WebKit 27.2. WebKit runs the smoke suite; the Firefox binary exits with "Could not find profile folder" even when launched by hand with a fresh `-profile` directory, so its results are unavailable here. `E2E_ALL_BROWSERS=1` adds both projects without touching CI.
- **Source**: `frontend/playwright.config.ts`
- **Verified**: WebKit 6 of 6 passed; Firefox failed at launch in three attempts, one with the sandbox disabled; 2026-11-24
- **Discovered in**: PF-009

### AWS Architecture Icons package
- **Rule / Behavior**: The icons page says "We allow customers and partners to use these toolkits and assets to create architecture diagrams" and names whitepapers, presentations, data sheets, and posters; it states no rule on recolouring or cropping, and the zip holds no licence or terms file, so the page is the only source of the terms. Packages ship quarterly (end of January, April, and July; none in Q4); the current one is `Icon-package_07312026`. Service icons sit at `Architecture-Service-Icons_07312026/Arch_{Category}/48/Arch_{Service}_48.svg`, and a "48" SVG declares `width="64px" height="64px"` with a 64-unit viewBox, so size it by the attributes you set, not by its name.
- **Source**: https://aws.amazon.com/architecture/icons/ and the package zip (14 MB); `frontend/src/assets/aws/`
- **Verified**: downloaded and unzipped the package, read the page text; 2026-11-24
- **Discovered in**: PF-022

### Vite asset inlining and `?no-inline`
- **Rule / Behavior**: Vite inlines an imported asset under 4 kB as a data URI inside the JavaScript chunk; an SVG goes in URL-encoded, which compresses worse than the file. Importing with the `?no-inline` suffix (typed in `vite/client`) keeps it a separate file: for three AWS icons this cut the entry bundle by 3.8 kB gzip (150.6 kB to 146.8 kB) and the browser fetches the files as images, off the critical path.
- **Source**: `frontend/src/components/diagram/DiagramCanvas.tsx`; `frontend/node_modules/vite/client.d.ts`
- **Verified**: `pnpm build` output before and after; 2026-11-24
- **Discovered in**: PF-022

### Playwright `page.evaluate` in the e2e type-check
- **Rule / Behavior**: `tsconfig.node.json` (which covers `e2e/`) has `lib: ["ES2023"]` and no DOM types, so `page.evaluate(() => document.documentElement.scrollWidth)` fails `check:type` with "Cannot find name 'document'". Pass the expression as a string with an explicit result type instead: `page.evaluate<boolean>('document.documentElement.scrollWidth <= window.innerWidth')`. A standalone Playwright script outside the test runner also needs `selectors.setTestIdAttribute('data-test-id')` before `getByTestId` finds anything.
- **Source**: `frontend/e2e/smoke.spec.ts`, `frontend/tsconfig.node.json`
- **Verified**: `check:type` failed, then passed with the string form; the smoke test passes at 360 px; 2026-11-24
- **Discovered in**: PF-022

### Tailwind CSS 4 `@utility` with nested at-rules
- **Rule / Behavior**: An `@utility` body can nest `@media`, `@supports`, `@starting-style`, and `&` selectors (such as `&::after` or `&[open]::backdrop`), and the build keeps them nested correctly; a custom `@utility` is emitted only once a class name using it appears in a scanned file, so check the generated CSS with the class in use. The minifier rewrites `animation-range: entry 0% entry 100%` as the equivalent `animation-range: entry`, and keeps `animation-timeline` after the `animation` shorthand, which would otherwise reset it.
- **Source**: `frontend/src/index.css` (`touch-target`, `reveal`, `menu-sheet`)
- **Verified**: `pnpm build` with a temporary scanned file naming the classes, then the emitted CSS inspected; 2026-11-24
- **Discovered in**: PF-015

### React hooks lint: refs in spread props and resetting state in effects
- **Rule / Behavior**: `react-hooks/refs` rejects spreading an object that holds a ref onto an element (`<dialog {...props}>` where `props.ref` is a ref object), so a hook returns the ref on its own (`dialogRef`) next to the spread props. `react-hooks/set-state-in-effect` rejects a reset such as `setActive(null)` in an effect's disabled branch; derive the value at return instead (`return enabled ? active : null`).
- **Source**: `frontend/src/components/useModalDialog.ts`, `frontend/src/app/useActiveSection.ts`
- **Verified**: `eslint` failed on the first form and passed on the second; 2026-11-24
- **Discovered in**: PF-015

### Chromium focus scrolling and a sticky header inside `scroll-padding-top`
- **Rule / Behavior**: With `html { scroll-padding-top: 5rem }` and a `position: sticky; top: 0` header that is shorter than the padding, Chromium treats each focused header link as outside the visible area and scrolls the page to reveal it; because the header is sticky, it never counts as revealed, so every Tab through the header jumps the page (about 392 px per press at 1366×768). A `position: fixed` header with a spacer of its height keeps the same layout and is never scrolled for focus, and `scroll-padding-top` can stay for anchors and focused content.
- **Source**: `frontend/src/sections/Header.tsx`, `frontend/src/index.css`
- **Verified**: Playwright Chromium, Tab from mid-page through the header: `scrollY` fell 4794, 4402, 4010 … on `main` and on the sticky build, and stayed at 4794 with the fixed header; anchors still landed 80 px down; 2026-11-25
- **Discovered in**: PF-015

### Lighthouse simulated paints count every request started before them
- **Rule / Behavior**: Lighthouse's default mobile run (simulated throttling) estimates FCP and LCP from the requests that started before the paint observed in the real, unthrottled trace, so a lazy chunk, an image, or a font requested during the first render still costs simulated time even when it blocks nothing. On `/`, loading the contact chunk only near the viewport (−38 kB) and an 80px portrait from a 160w file (−28 kB) raised mobile performance from 87 to 90; preloading the two critical `woff2` files cut the simulated FCP from 2.7 s to 1.7 s (90 to 94).
- **Source**: `docs/plans/site/PF-026-mobile-performance.md` (S0); `frontend/vite.config.ts` (`preloadFonts`)
- **Verified**: Lighthouse 13.5.0 mobile against `vite preview`, three runs per build, 2026-11-25
- **Discovered in**: PF-026

### React Router 8 `ScrollRestoration` and fresh page loads
- **Rule / Behavior**: Every fresh document load (a typed URL, a new tab, a reload) has no router state, so its location key is `default`, and the default `ScrollRestoration` keys saved positions by location key: two different pages loaded fresh in one tab share one saved position (stored in `sessionStorage` under `react-router-scroll-positions`, which a new tab opened from the page copies). A case study opened by URL after scrolling the home page to 3,000px opened 3,000px down. `getKey={(location) => (location.key === 'default' ? location.pathname : location.key)}` separates them and leaves in-app history as it was.
- **Source**: `frontend/src/app/RootLayout.tsx` (`scrollKey`); `react-router` 8.5.2 `dist/development/lib/dom/lib.js` (`getScrollRestorationKey`)
- **Verified**: Playwright on `vite preview`, `main` and this branch, `sessionStorage` read as `{"default":3000}` after the home page; e2e "a case study opened by URL after scrolling the home page starts at the top"; 2026-11-25
- **Discovered in**: PF-026

### React Router 8 navigation and `React.lazy` route elements
- **Rule / Behavior**: `RouterProvider` wraps router state updates in `React.startTransition` unless `useTransitions={false}`, so a page that suspends on a `React.lazy` chunk keeps the previous page on screen during in-app navigation, but only when the nearest `Suspense` boundary is already on screen: a boundary created with the new route element shows its fallback even inside a transition, which left `main` empty for the whole chunk download. The boundary therefore sits in `RootLayout` around `<Outlet />`. A route's own `lazy` property instead leaves the router uninitialized, rendering nothing, until the matched route's chunk loads.
- **Source**: `react-router` 8.5.2 `dist/development/lib/components.js` (`RouterProvider`) and `lib/router/router.js` (`initialMatches.some((m) => m.route.lazy)` sets `initialized = false`)
- **Verified**: read the source, 2026-11-25; Playwright with the chunk held back: the route-level boundary blanked `main`, the layout boundary kept the home page (`frontend/e2e/performance.spec.ts`, "the home page stays on screen while the case-study chunk loads")
- **Discovered in**: PF-026

### `vite preview` proxies the API to a running local backend
- **Rule / Behavior**: `vite preview` inherits `server.proxy` from `vite.config.ts`, so `/api` and `/actuator` reach whatever listens on `SERVER_PORT` (default 8080); a "no backend" measurement such as a Lighthouse run needs that port dead (for example `SERVER_PORT=9`), or its page views land in the local database.
- **Source**: `frontend/vite.config.ts` (`server.proxy`)
- **Verified**: 2026-11-25, a Lighthouse run against `vite preview` posted page views to a local backend on :8080; rerun with `SERVER_PORT=9` answered 502 for `/api`
- **Discovered in**: PF-029
