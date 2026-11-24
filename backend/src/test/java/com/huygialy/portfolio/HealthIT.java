package com.huygialy.portfolio;

import com.huygialy.portfolio.support.IntegrationTest;
import org.junit.jupiter.api.Test;
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
        // PF-022 D7: Render's health check and the keep-alive ping use it, so they never wake the database.
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
