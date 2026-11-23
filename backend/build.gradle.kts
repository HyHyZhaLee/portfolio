import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    jacoco
    id("org.springframework.boot") version "4.2.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.diffplug.spotless") version "8.12.0"
}

group = "com.huygialy"
version = "0.0.1-SNAPSHOT"
description = "Portfolio backend"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.2.1")
    // Per-visitor rate limits (PF-004 P12): token buckets held in a bounded Caffeine cache.
    implementation("com.bucket4j:bucket4j_jdk17-core:8.22.0")
    implementation("com.github.ben-manes.caffeine:caffeine")
    // Bounded retry with exponential backoff for the Resend adapter (PF-006 P10): the core module only, no proxies.
    implementation("io.github.resilience4j:resilience4j-retry:2.4.0")
    // Circuit breaker around the GitHub call (PF-007 P1): the core module only, the same version as the retry.
    implementation("io.github.resilience4j:resilience4j-circuitbreaker:2.4.0")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-actuator-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testImplementation("org.springframework.boot:spring-boot-starter-flyway-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
    testImplementation("org.testcontainers:testcontainers-postgresql")
    // Stands in for Resend in integration tests (PF-006 P16); the standalone jar shades Jetty, Servlet, and Jackson.
    testImplementation("org.wiremock:wiremock-standalone:3.13.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// The Docker image copies one jar with a fixed name (backend/Dockerfile); the plain jar is not needed.
tasks.bootJar {
    archiveFileName = "app.jar"
}

tasks.jar {
    enabled = false
}

// Two test tiers (backend/CLAUDE.md, Testing). Both read the test source set explicitly (KNOWN-BE-002),
// and both are registered with tasks.register (KNOWN-BE-009).
val integrationTag = "integration"

val testUnit = tasks.register<Test>("testUnit") {
    description = "Unit tests: no Spring context, no Docker."
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    useJUnitPlatform { excludeTags(integrationTag) }
}

val testIT = tasks.register<Test>("testIT") {
    description = "Integration tests (@IntegrationTest): Spring, Testcontainers PostgreSQL, WireMock; needs Docker."
    group = LifecycleBasePlugin.VERIFICATION_GROUP
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    useJUnitPlatform { includeTags(integrationTag) }
    shouldRunAfter(testUnit)
    // OpenApiSnapshotIT writes this file, so an edited or reverted snapshot makes the task out of date (make openapi).
    outputs.file("openapi/openapi.json")
}

// `test` only aggregates the tiers, so a --tests filter given to it reaches neither (KNOWN-BE-001).
tasks.test {
    enabled = false
    dependsOn(testUnit, testIT)
}

tasks.withType<Test>().configureEach {
    testLogging {
        events("failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

tasks.jacocoTestReport {
    dependsOn(testUnit, testIT)
    executionData(testUnit.get(), testIT.get())
    reports {
        xml.required = true
        html.required = true
    }
}

tasks.jacocoTestCoverageVerification {
    dependsOn(testUnit, testIT)
    executionData(testUnit.get(), testIT.get())
    violationRules {
        rule {
            limit {
                counter = "BRANCH"
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(testUnit, testIT, tasks.jacocoTestReport, tasks.jacocoTestCoverageVerification)
}

spotless {
    java {
        target("src/**/*.java")
        palantirJavaFormat("2.103.0")
        removeUnusedImports()
        formatAnnotations()
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// `make backend` (bootRun) and bootTestRun run with the local profile unless SPRING_PROFILES_ACTIVE says otherwise;
// the local profile supplies the settings that have no default elsewhere (PF-004 P6).
tasks.withType<BootRun>().configureEach {
    systemProperty("spring.profiles.active", System.getenv("SPRING_PROFILES_ACTIVE") ?: "local")
}
