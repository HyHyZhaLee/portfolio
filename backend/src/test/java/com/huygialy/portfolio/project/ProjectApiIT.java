package com.huygialy.portfolio.project;

import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.status;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.huygialy.portfolio.support.IntegrationTest;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * {@code GET /api/v1/projects} against WireMock standing in for GitHub (PF-007 S1). The test profile lists
 * {@code synthetic-user} with the featured names {@code alpha-featured} and {@code beta-featured}, turns the 1 h cache off
 * (every request reaches WireMock), sets a synthetic token and a 500 ms read timeout. Each test resets WireMock and the
 * circuit breaker and primes its own last good result.
 */
@IntegrationTest
class ProjectApiIT {

    private static final String PROJECTS = "/api/v1/projects";
    private static final String GITHUB_REPOS = "/users/synthetic-user/repos";
    /** GitHub's order (last push first) with a fork, an archived and a private repository, and mixed-case featured. */
    private static final String GITHUB_BODY = "["
            + repo(
                    "recent-tool",
                    "2026-11-01T08:00:00Z",
                    "\"description\":\"A synthetic tool\",\"language\":\"TypeScript\","
                            + "\"stargazers_count\":3,\"topics\":[\"cli\"],\"homepage\":\"\",\"fork\":false")
            + "," + repo("a-fork", "2026-10-01T08:00:00Z", "\"fork\":true")
            + "," + repo("old-archive", "2026-09-01T08:00:00Z", "\"archived\":true")
            // GitHub's list is about 5 KB per repository: this one alone passes Boot's 64 KB Jackson cap (PF-007 P4).
            + "," + repo("beta-featured", "2025-01-01T08:00:00Z", "\"filler\":\"" + "x".repeat(70_000) + "\"")
            + "," + repo("secret-lab", "2025-01-01T08:00:00Z", "\"private\":true")
            + "," + repo("older-lib", "2025-06-01T08:00:00Z", "\"description\":null")
            + "," + repo("Alpha-Featured", "2024-01-01T08:00:00Z", "")
            + "]";

    private static final List<String> LISTED = List.of("Alpha-Featured", "beta-featured", "recent-tool", "older-lib");

    private final RestTestClient client;
    private final WireMockServer wireMock;
    private final CircuitBreaker circuitBreaker;

    ProjectApiIT(RestTestClient client, WireMockServer wireMock, CircuitBreaker gitHubCircuitBreaker) {
        this.client = client;
        this.wireMock = wireMock;
        this.circuitBreaker = gitHubCircuitBreaker;
    }

    @BeforeEach
    void reset() {
        wireMock.resetAll();
        circuitBreaker.reset();
    }

    @Test
    void listsPublicRepositoriesFeaturedFirst() {
        wireMock.stubFor(get(urlPathEqualTo(GITHUB_REPOS)).willReturn(okJson(GITHUB_BODY)));

        client.get()
                .uri(PROJECTS)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.items[*].name")
                .isEqualTo(LISTED)
                .jsonPath("$.items[2].url")
                .isEqualTo("https://github.com/synthetic-user/recent-tool")
                .jsonPath("$.items[2].description")
                .isEqualTo("A synthetic tool")
                .jsonPath("$.items[2].language")
                .isEqualTo("TypeScript")
                .jsonPath("$.items[2].stars")
                .isEqualTo(3)
                .jsonPath("$.items[2].topics")
                .isEqualTo(List.of("cli"))
                .jsonPath("$.items[2].homepage")
                .doesNotExist()
                .jsonPath("$.items[2].updatedAt")
                .isEqualTo("2026-11-01T08:00:00Z")
                .jsonPath("$.items[3].topics")
                .isEmpty();

        wireMock.verify(
                1,
                getRequestedFor(urlPathEqualTo(GITHUB_REPOS))
                        .withQueryParam("per_page", equalTo("100"))
                        .withQueryParam("sort", equalTo("pushed"))
                        .withHeader("Authorization", equalTo("Bearer synthetic-test-token"))
                        .withHeader("Accept", equalTo("application/vnd.github+json"))
                        .withHeader("X-GitHub-Api-Version", equalTo("2022-11-28")));
    }

    @Test
    void anOutageServesTheLastGoodResultAndOpensTheCircuit() {
        primeLastGood();
        wireMock.stubFor(
                get(urlPathEqualTo(GITHUB_REPOS)).willReturn(status(403).withHeader("x-ratelimit-remaining", "0")));

        expectListed(); // the rate-limited call fails: 1 of 2 calls, so the circuit opens
        expectListed(); // open circuit: answered without a request to GitHub

        wireMock.verify(2, getRequestedFor(urlPathEqualTo(GITHUB_REPOS)));
    }

    @Test
    void aSlowGitHubTimesOutAndFallsBack() {
        primeLastGood();
        wireMock.stubFor(
                get(urlPathEqualTo(GITHUB_REPOS)).willReturn(okJson("[]").withFixedDelay(1_000)));

        expectListed();

        wireMock.verify(2, getRequestedFor(urlPathEqualTo(GITHUB_REPOS)));
    }

    @Test
    void withoutATokenTheAdapterSendsNoAuthorizationHeader() {
        wireMock.stubFor(get(urlPathEqualTo(GITHUB_REPOS)).willReturn(okJson(GITHUB_BODY)));
        final var properties = new GitHubProperties(
                "synthetic-user",
                "",
                List.of(),
                wireMock.baseUrl(),
                Duration.ofSeconds(1),
                Duration.ofSeconds(1),
                Duration.ZERO,
                Duration.ofMinutes(10));

        assertThat(new GitHubRestClient(properties).listPublicRepositories("synthetic-user"))
                .hasSize(7);

        wireMock.verify(1, getRequestedFor(urlPathEqualTo(GITHUB_REPOS)).withoutHeader("Authorization"));
    }

    private void primeLastGood() {
        wireMock.stubFor(get(urlPathEqualTo(GITHUB_REPOS)).willReturn(okJson(GITHUB_BODY)));
        expectListed();
    }

    private void expectListed() {
        client.get()
                .uri(PROJECTS)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.items[*].name")
                .isEqualTo(LISTED);
    }

    /** One entry of GitHub's list; an absent flag reads as false, and unknown fields are ignored. */
    private static String repo(String name, String pushedAt, String extra) {
        return "{\"name\":\"%s\",\"html_url\":\"https://github.com/synthetic-user/%s\",\"pushed_at\":\"%s\",\"owner\":{\"id\":1}%s}"
                .formatted(name, name, pushedAt, extra.isEmpty() ? "" : "," + extra);
    }
}
