package com.huygialy.portfolio;

import com.huygialy.portfolio.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
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
    void pathsOutsideThePublicListAreDenied() {
        client.get().uri("/actuator/env").exchange().expectStatus().isEqualTo(HttpStatus.FORBIDDEN);
        client.post().uri("/actuator/health").exchange().expectStatus().isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void anErrorOnAPublicPathKeepsItsStatus() {
        // The 404 is rendered through the /error dispatch, which the security chain must not deny.
        client.get().uri("/swagger-ui/missing.js").exchange().expectStatus().isNotFound();
    }
}
