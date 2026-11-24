# PF-024 — Render builds cache their dependencies and avoid Maven Central's rate limit

**Ticket**: PF-024 · **Refined requirement**: [PF-024-refined-requirement.md](PF-024-refined-requirement.md) · **Packages**: backend (build only) · **Status**: Approved 2026-11-24 (the owner pasted the failed Render build log and pointed at the missing dependency cache) · **Last updated**: 2026-11-24

> ⚠️ **Review these flows first** — No complex flows

## 1. Requirement summary

The first backend deploy after PF-023 failed on Render twice: the Docker build's `bootJar` step stopped with `Received status code 429 from server: Too Many Requests` from `repo.maven.apache.org`, because Maven Central rate-limits shared build machines such as Render's. The owner also noticed that the build downloads everything every time. Both are fixed: the Dockerfile's dependency layer now really holds the jars, so the build step runs offline (D1), and Gradle resolves plugins and libraries from Google's mirror of Maven Central first (D2). No runtime behavior changes. Maps to `../portfolio-implementation-plan.md` §8.D (Render) and §10 (a free tier changes).

## 4. Approach

The Dockerfile's cached layer ran `./gradlew dependencies`, which resolves the dependency graph from POM files but downloads no jars, so every image build fetched all the jars again in its `bootJar` step, about 560 requests, whether or not Render reused the layer. A new `downloadDependencies` task declares the jars that `bootJar` needs (`compileClasspath`, `annotationProcessor`, `productionRuntimeClasspath`) as its inputs, so Gradle downloads them in that layer, and the `bootJar` step runs with `--offline`, so a source change downloads nothing and a missing jar fails the build loudly instead of reaching the network (D1). For the downloads that remain (the first build, or after a dependency change), `settings.gradle.kts` puts Google's Maven Central mirror before the Gradle Plugin Portal, and `build.gradle.kts` puts it before `mavenCentral()`; a plugin or library the mirror lacks still resolves from the original repository (D2).

| Alternative | Why not |
|---|---|
| Retry the Render deploy until it passes | The 429 depends on other users of Render's shared addresses; the second retry failed too |
| Build the jar or the image in GitHub Actions and deploy a prebuilt image | Needs a registry and a new image-backed Render service with a new URL; worth it only if the mirror and the cache stop being enough |
| Only the mirror, keep `dependencies` | Every build would still download about 560 files, just from another host |
| Gradle dependency verification metadata | Worth doing for supply-chain safety, but a separate change; the mirror serves Maven Central's own files |

**Reuse**: the existing multi-stage Dockerfile and its layer order. **Single responsibility**: `downloadDependencies` only resolves; `bootJar` only builds, offline.

## 8. Files, order, risks, tests

**New**: `docs/plans/platform/PF-024-maven-mirror.md`, `docs/plans/platform/PF-024-refined-requirement.md`. **Modified**: `backend/settings.gradle.kts` (plugin repositories), `backend/build.gradle.kts` (repository order, `downloadDependencies`), `backend/Dockerfile` (the dependency layer, `--offline`), `backend/CLAUDE.md` (Docker line), `docs/knowledge/hosting.md` (Maven Central 429 on Render), `docs/knowledge/tooling.md` (`dependencies` fetches no jars), `docs/plans/README.md`, `docs/prd/backlog.md`.

**Order**: repositories → the task and the Dockerfile → a cache-free Gradle build → two image builds → docs.

| Risk | Mitigation |
|---|---|
| Google's mirror lags Maven Central or lacks an artifact | Gradle falls back to the next repository on a 404; every version here is weeks old |
| Google's mirror is down | The build fails like a Maven Central outage would; Render keeps the running version, and a retry works once it is back |
| Render does not reuse its Docker layer cache | Then each build downloads the jars once, from the mirror, which does not rate-limit like Maven Central |
| A future plugin or task needs a jar the task does not declare | `--offline` fails the image build with the missing coordinate; add its configuration to `downloadDependencies` |

**Tests**: no unit tests; build configuration has no code paths. Verified on 2026-11-24: `./gradlew bootJar` with an empty Gradle home downloaded 566 files, all from `maven-central.storage-download.googleapis.com`, none from `repo.maven.apache.org` or `plugins.gradle.org`; `./gradlew check` passes; a no-cache `docker build` passes, and a second build after a source edit reuses the dependency layer and builds offline.
