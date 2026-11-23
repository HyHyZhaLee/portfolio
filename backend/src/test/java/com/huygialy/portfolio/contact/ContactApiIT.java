package com.huygialy.portfolio.contact;

import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.notContaining;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.serviceUnavailable;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.huygialy.portfolio.support.IntegrationTest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * F1 of PF-006 against WireMock standing in for Resend. Each test uses its own X-Forwarded-For address from 192.0.2.0/24
 * (the rate limiter is shared across the context) and its own synthetic email, by which it finds its rows.
 */
@IntegrationTest
@ExtendWith(OutputCaptureExtension.class)
class ContactApiIT {

    private static final String CONTACT = "/api/v1/contact-messages";
    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final String NAME = "Ada Example";
    private static final String TEXT = "Hello from the contact API test";

    private final RestTestClient client;
    private final JdbcTemplate jdbc;
    private final WireMockServer wireMock;

    ContactApiIT(RestTestClient client, JdbcTemplate jdbc, WireMockServer wireMock) {
        this.client = client;
        this.jdbc = jdbc;
        this.wireMock = wireMock;
    }

    @BeforeEach
    void resetWireMock() {
        wireMock.resetAll();
    }

    @Test
    void aValidMessageIsSavedSentAndNeverLogged(CapturedOutput output) {
        final var email = "contact-api-it-valid@example.com";
        final var ip = "192.0.2.10";
        wireMock.stubFor(post("/emails").willReturn(okJson("{\"id\":\"email-api-valid\"}")));

        send(Map.of("name", NAME, "email", email, "message", TEXT), ip)
                .expectStatus()
                .isAccepted()
                .expectBody()
                .isEmpty();

        final var row = single(email);
        assertThat(row.get("status")).isEqualTo("SENT");
        assertThat(row.get("attempts")).isEqualTo(1);
        assertThat(row.get("provider_message_id")).isEqualTo("email-api-valid");
        assertThat((String) row.get("sender_hash")).matches("^[0-9a-f]{64}$");
        final var others = new HashMap<>(row);
        others.remove("sender_hash"); // pure hex, checked above
        others.values().stream()
                .map(String::valueOf)
                .forEach(value -> assertThat(value).doesNotContain(ip, CHROME));
        wireMock.verify(
                1,
                postRequestedFor(urlEqualTo("/emails"))
                        .withRequestBody(matchingJsonPath("$.reply_to", equalTo(email)))
                        .withRequestBody(matchingJsonPath("$.subject", notContaining(TEXT))));
        assertThat(output.getAll()).doesNotContain(NAME, email, TEXT);
    }

    /** A blank name, an invalid email, a 9-character message, and a NUL, which PostgreSQL would reject as a 500. */
    @ParameterizedTest
    @CsvSource({
        "' ', contact-api-it-blank@example.com, Hello from a test, name",
        "Ada Example, not-an-email, Hello from a test, email",
        "Ada Example, contact-api-it-short@example.com, 123456789, message",
        "Ada Example, contact-api-it-nul@example.com, Hello\u0000 from a test, message"
    })
    void anInvalidMessageIsRejectedWithAFieldErrorAndNotStored(
            String name, String email, String message, String field) {
        send(Map.of("name", name, "email", email, "message", message), "192.0.2.11")
                .expectStatus()
                .isBadRequest()
                .expectHeader()
                .contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("VALIDATION_FAILED")
                .jsonPath("$.errors[?(@.field == '" + field + "')]")
                .exists();

        assertThat(rows(email)).isEmpty();
        wireMock.verify(0, postRequestedFor(urlEqualTo("/emails")));
    }

    @Test
    void aFilledHoneypotIsAcceptedStoredAsSpamAndNeverSent() {
        final var email = "contact-api-it-spam@example.com";

        send(honeypot(email), "192.0.2.12").expectStatus().isAccepted();

        final var row = single(email);
        assertThat(row.get("status")).isEqualTo("SPAM");
        assertThat(row.get("attempts")).isEqualTo(0);
        wireMock.verify(0, postRequestedFor(urlEqualTo("/emails")));
    }

    @Test
    void theFourthMessageInAnHourFromOneAddressIsRateLimitedSpamIncluded() {
        final var ip = "192.0.2.13";
        for (int i = 0; i < 3; i++) {
            send(honeypot("contact-api-it-rate-" + i + "@example.com"), ip)
                    .expectStatus()
                    .isAccepted();
        }

        send(honeypot("contact-api-it-rate-3@example.com"), ip)
                .expectStatus()
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
                .expectHeader()
                .valueMatches(HttpHeaders.RETRY_AFTER, "[1-9][0-9]*")
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("RATE_LIMITED");
        assertThat(rows("contact-api-it-rate-3@example.com")).isEmpty();
    }

    @Test
    void aProviderOutageStillAcceptsTheMessageAndRecordsTheFailure() {
        final var email = "contact-api-it-outage@example.com";
        wireMock.stubFor(post("/emails").willReturn(serviceUnavailable()));

        send(Map.of("name", NAME, "email", email, "message", TEXT), "192.0.2.14")
                .expectStatus()
                .isAccepted();

        final var row = single(email);
        assertThat(row.get("status")).isEqualTo("FAILED");
        assertThat(row.get("attempts")).isEqualTo(1);
        assertThat(row.get("last_error")).isEqualTo("HTTP_503");
    }

    private static Map<String, String> honeypot(String email) {
        return Map.of("name", NAME, "email", email, "message", TEXT, "website", "https://spam.example");
    }

    private RestTestClient.ResponseSpec send(Map<String, String> body, String forwardedFor) {
        return client.post()
                .uri(CONTACT)
                .header("X-Forwarded-For", forwardedFor)
                .header(HttpHeaders.USER_AGENT, CHROME)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    private Map<String, Object> single(String email) {
        final var rows = rows(email);
        assertThat(rows).hasSize(1);
        return rows.getFirst();
    }

    private List<Map<String, Object>> rows(String email) {
        return jdbc.queryForList("SELECT * FROM contact_message WHERE email = ?", email);
    }
}
