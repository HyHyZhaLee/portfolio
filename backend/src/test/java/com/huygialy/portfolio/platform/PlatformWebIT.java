package com.huygialy.portfolio.platform;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.support.IntegrationTest;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

@IntegrationTest
class PlatformWebIT {

    private static final String CORRELATION = "X-Correlation-Id";
    private static final Pattern UUID_FORMAT =
            Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

    private final RestTestClient client;

    PlatformWebIT(RestTestClient client) {
        this.client = client;
    }

    @ParameterizedTest
    @CsvSource({"GET,/api/v1/nope", "GET,/actuator/env", "POST,/actuator/health"})
    void offListRequestsAnswerANotFoundProblemWithTheCorrelationId(HttpMethod method, String path) {
        var headerValue = new AtomicReference<String>();

        client.method(method)
                .uri(path)
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectHeader()
                .contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectHeader()
                .value(CORRELATION, headerValue::set)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("NOT_FOUND")
                .jsonPath("$.status")
                .isEqualTo(404)
                .jsonPath("$.timestamp")
                .isNotEmpty()
                .jsonPath("$.correlationId")
                .value(id -> assertThat(id).isEqualTo(headerValue.get()));
    }

    @Test
    void aWellFormedCorrelationIdIsEchoedInTheHeaderAndTheProblemBody() {
        client.get()
                .uri("/actuator/health")
                .header(CORRELATION, "test-correlation-123")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .valueEquals(CORRELATION, "test-correlation-123");

        client.get()
                .uri("/api/v1/nope")
                .header(CORRELATION, "test-correlation-123")
                .exchange()
                .expectStatus()
                .isNotFound()
                .expectHeader()
                .valueEquals(CORRELATION, "test-correlation-123")
                .expectBody()
                .jsonPath("$.correlationId")
                .isEqualTo("test-correlation-123");
    }

    @Test
    void aMalformedCorrelationIdIsReplacedWithAGeneratedUuid() {
        client.get()
                .uri("/actuator/health")
                .header(CORRELATION, "not valid!")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .value(CORRELATION, id -> assertThat(id).matches(UUID_FORMAT));
    }

    @Test
    void aPreflightFromAnAllowedOriginIsAccepted() {
        client.options()
                .uri("/actuator/health")
                .header(HttpHeaders.ORIGIN, "https://allowed.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "x-correlation-id")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://allowed.example")
                .expectHeader()
                .value(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        methods -> assertThat(methods).contains("GET"));
    }

    @Test
    void aPreflightFromAnotherOriginIsRejected() {
        client.options()
                .uri("/actuator/health")
                .header(HttpHeaders.ORIGIN, "https://evil.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "x-correlation-id")
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.FORBIDDEN)
                .expectHeader()
                .doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
    }

    @Test
    void aUrlTheFirewallRejectsAnswersAValidationProblem() {
        // Spring Security's firewall rejects the semicolon before any controller; the /error dispatch renders it.
        client.get()
                .uri("/api/v1/x;jsessionid=1")
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectHeader()
                .contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("VALIDATION_FAILED")
                .jsonPath("$.correlationId")
                .exists()
                .jsonPath("$.instance")
                .isEqualTo("/api/v1/x;jsessionid=1");
    }
}
