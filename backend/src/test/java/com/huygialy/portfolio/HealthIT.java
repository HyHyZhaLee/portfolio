package com.huygialy.portfolio;

import com.huygialy.portfolio.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.client.RestTestClient;

@IntegrationTest
class HealthIT {

    private final RestTestClient client;

    HealthIT(RestTestClient client) {
        this.client = client;
    }

    @Test
    void healthIsUpAndReachesTheDatabase() {
        client.get()
                .uri("/actuator/health")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.status")
                .isEqualTo("UP")
                .jsonPath("$.components.db.status")
                .isEqualTo("UP")
                .jsonPath("$.components.db.details")
                .doesNotExist();
    }

    @Test
    void healthAnswersHeadForUptimeMonitors() {
        client.head().uri("/actuator/health").exchange().expectStatus().isOk();
    }

    @Test
    void livenessIsPublicAndNeverChecksTheDatabase() {
        // PF-023 D7: Render's health check and the keep-alive ping use it, so they never wake the database.
        client.get()
                .uri("/actuator/health/liveness")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.status")
                .isEqualTo("UP")
                .jsonPath("$.components.db")
                .doesNotExist();
        client.head().uri("/actuator/health/liveness").exchange().expectStatus().isOk();
    }

    @Test
    void infoIsPublicAndShowsOnlyCommitAndEnvironment() {
        // PF-027: the deploy gate reads the commit; nothing else (no build, git, or env details) may appear.
        client.get()
                .uri("/actuator/info")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .json("{\"app\": {\"commit\": \"local\", \"environment\": \"production\"}}", JsonCompareMode.STRICT);
        client.head().uri("/actuator/info").exchange().expectStatus().isOk();
    }

    @Test
    void pathsOutsideThePublicListAnswerNotFound() {
        client.get()
                .uri("/actuator/env")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("NOT_FOUND");
        client.post()
                .uri("/actuator/health")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("NOT_FOUND");
    }

    @Test
    void anErrorOnAPublicPathKeepsItsStatus() {
        // The 404 is rendered through the /error dispatch, which the security chain must not deny.
        client.get()
                .uri("/swagger-ui/missing.js")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("NOT_FOUND");
    }
}
