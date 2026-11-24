# PF-024 — Refined requirements

> Living document. The backlog entry or the user's description was the starting point; this is the complete, current requirement as clarified in conversation, and it wins over the original wording. It says **what** to build; the plan says **how**. Sole author: the background refinement agent.

**Ticket**: PF-024 — Render builds cache their dependencies and avoid Maven Central's rate limit · **Plan**: [PF-024-maven-mirror.md](PF-024-maven-mirror.md) · **Master plan section**: `../portfolio-implementation-plan.md` §8.D and §10 · **Status**: **Confirmed** · **Last updated**: 2026-11-24 · **Branch**: `fix/PF-024-maven-mirror`

## 1. Problem and goal

Two backend deploys on Render on 2026-11-24, at 09:39 and 10:30 UTC, failed in the Docker build's `./gradlew bootJar` step with `Received status code 429 from server: Too Many Requests` from `repo.maven.apache.org`. Render's build machines are shared, and Maven Central rate-limits busy shared addresses. The owner pasted the log and pointed out that the build downloads every dependency again because nothing is cached. He was right: the Dockerfile's cached layer ran `./gradlew dependencies`, which fetches only POM files, so every image build downloaded all the jars again, about 560 requests. The owner needs the backend to deploy reliably on Render, so the image must hold the jars it needs, and Gradle must fetch what remains from a host that does not rate-limit. The audience is the owner, who ships the backend, and any hiring manager reading the repository, who should see a build that caches its dependencies. No visitor-facing behavior changes: this is a build fix.

## 2. Scope

**In scope**

- The Dockerfile's dependency layer downloads every jar that `bootJar` needs, through a new `downloadDependencies` Gradle task (D1).
- The `bootJar` step in the Docker build runs with `--offline` (D1).
- Gradle resolves plugins (`pluginManagement` in `settings.gradle.kts`) and libraries (`build.gradle.kts`) from Google's mirror of Maven Central first, then from the Gradle Plugin Portal or Maven Central for anything the mirror lacks (D2).
- Docs that describe the Docker build and the Render build behavior.

**Out of scope (deferred)**

- Gradle dependency verification metadata: it is worth doing for supply-chain safety, but it is a separate change, and the mirror serves Maven Central's own files.
- Building the image in GitHub Actions and deploying a prebuilt image to Render: it needs a registry and a new image-backed Render service with a new URL, so it waits until D1 and D2 prove insufficient (D3).
- Runtime behavior changes: the application code, its configuration, and its endpoints stay as they are.
- Retrying the Render deploy until it passes: the 429 depends on other users of Render's shared addresses, and a retry failed too.

## 3. Functional requirements

- **FR-1**: The Docker image's dependency layer contains every jar that `bootJar` needs (`compileClasspath`, `annotationProcessor`, `productionRuntimeClasspath`), so a build that changes only source code downloads no jars. Source: clarified 2026-11-24, D1
- **FR-2**: The `bootJar` step in the Docker build runs with `--offline`, so it never reaches the network, and a missing jar fails the build with the missing coordinate. Source: clarified 2026-11-24, D1
- **FR-3**: Gradle resolves plugins from the Google mirror of Maven Central before the Gradle Plugin Portal, and libraries from the mirror before `mavenCentral()`; an artifact the mirror lacks still resolves from the original repository. Source: clarified 2026-11-24, D2
- **FR-4**: The application, its configuration, and the deploy workflow stay unchanged apart from the build files named in FR-1 to FR-3. Source: clarified 2026-11-24

## 4. Product rules and edge cases

- No visitor-facing behavior changes: the site, its content, and its API responses are the same before and after.
- **API down or asleep:** not applicable; this ticket changes only the build, not what the visitor sees.
- **Privacy:** not applicable; no visitor data is read, stored, or sent by the build change.
- **Abuse:** not applicable; no endpoint, validation limit, or rate limit changes.
- A failed image build leaves the previous Render version running, and a retry works once the mirror is reachable again.
- Google's mirror lags Maven Central or lacks an artifact: Gradle falls back to the next repository on a 404, so the build still resolves.
- A future plugin or task needs a jar the `downloadDependencies` task does not declare: the offline `bootJar` step fails, and the fix is to add that configuration to the task.

## 5. Interface decisions

**API**: None.

**UI**: None.

**Content**: None.

## 6. Open questions

None.

## 7. Decision log

| ID | Date | Decision | Rationale |
|---|---|---|---|
| D1 | 2026-11-24 | The Docker image's dependency layer downloads every jar `bootJar` needs, through a `downloadDependencies` Gradle task over `compileClasspath`, `annotationProcessor`, and `productionRuntimeClasspath`. The `bootJar` step runs with `--offline`, so a source change downloads nothing and a missing jar fails the build loudly. | The owner's report: every build downloaded all jars again. Fewer requests reach any repository. |
| D2 | 2026-11-24 | Gradle resolves plugins (`settings.gradle.kts` `pluginManagement`) and libraries (`build.gradle.kts`) from Google's mirror of Maven Central (`https://maven-central.storage-download.googleapis.com/maven2/`) first, then from the Gradle Plugin Portal or Maven Central for anything the mirror lacks. | The downloads that remain (the first build, or a dependency change) never hit Maven Central's rate limit. |
| D3 | 2026-11-24 | Building the image in GitHub Actions and deploying a prebuilt image to Render is deferred. | It needs a registry and a new image-backed Render service with a new URL. Revisit only if D1 and D2 are not enough. |

## 8. Acceptance criteria (refined)

- **AC-1**: A build from an empty Gradle cache downloads everything from the mirror and none from `repo.maven.apache.org`.
- **AC-2**: A no-cache Docker image build passes.
- **AC-3**: A second Docker image build after a source edit reuses the dependency layer and builds offline.
- **AC-4**: The next Render deploy of the backend succeeds.
