package com.huygialy.portfolio.contact;

import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matching;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.huygialy.portfolio.contact.ContactMessageEntity.Status;
import com.huygialy.portfolio.support.IntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * F2 of PF-006: the retry job against WireMock. Rows are inserted with synthetic values; the test profile turns the
 * schedule off, so the tests call the work method directly. Other tests' FAILED rows may join a batch (the batch holds
 * 50), so each test checks only its own row and its own idempotency keys.
 */
@IntegrationTest
class ContactRetryJobIT {

    private final ContactRetryJob job;
    private final ContactLifecycle lifecycle;
    private final JdbcTemplate jdbc;
    private final WireMockServer wireMock;

    ContactRetryJobIT(ContactRetryJob job, ContactLifecycle lifecycle, JdbcTemplate jdbc, WireMockServer wireMock) {
        this.job = job;
        this.lifecycle = lifecycle;
        this.jdbc = jdbc;
        this.wireMock = wireMock;
    }

    @BeforeEach
    void stubResend() {
        wireMock.resetAll();
        wireMock.stubFor(post("/emails").willReturn(okJson("{\"id\":\"email-retried\"}")));
    }

    @Test
    void aFailedMessageBelowTheLimitIsResentWithTheNextAttemptsKey() {
        final var id = insertFailed("retry-job-it-resend@example.com", 1);

        assertThat(job.retryFailed()).isPositive();

        final var row = row(id);
        assertThat(row.get("status")).isEqualTo("SENT");
        assertThat(row.get("attempts")).isEqualTo(2);
        assertThat(row.get("provider_message_id")).isEqualTo("email-retried");
        wireMock.verify(
                1,
                postRequestedFor(urlEqualTo("/emails"))
                        .withHeader(
                                ResendEmailSender.IDEMPOTENCY_KEY, equalTo("contact-message-" + id + "-attempt-2")));
    }

    @Test
    void aFailedMessageAtTheLimitIsNeverClaimed() {
        final var id = insertFailed("retry-job-it-limit@example.com", 3);

        job.retryFailed();

        final var row = row(id);
        assertThat(row.get("status")).isEqualTo("FAILED");
        assertThat(row.get("attempts")).isEqualTo(3);
        wireMock.verify(
                0,
                postRequestedFor(urlEqualTo("/emails"))
                        .withHeader(ResendEmailSender.IDEMPOTENCY_KEY, matching("contact-message-" + id + "-.*")));
    }

    @Test
    void twoClaimsWithTheSameSeenAttemptsSucceedOnce() {
        final var id = insertFailed("retry-job-it-claim@example.com", 1);

        final var first = lifecycle.claimForRetry(id, 1);
        final var second = lifecycle.claimForRetry(id, 1);

        assertThat(first).hasValueSatisfying(message -> {
            assertThat(message.getStatus()).isEqualTo(Status.PENDING);
            assertThat(message.getAttempts()).isEqualTo(2);
        });
        assertThat(second).isEmpty();
    }

    @Test
    void theScheduledRunDoesNothingWhileTheSwitchIsOff() {
        final var id = insertFailed("retry-job-it-switch@example.com", 1);

        job.scheduledRun();

        final var row = row(id);
        assertThat(row.get("status")).isEqualTo("FAILED");
        assertThat(row.get("attempts")).isEqualTo(1);
        wireMock.verify(0, postRequestedFor(urlEqualTo("/emails")));
    }

    private long insertFailed(String email, int attempts) {
        return jdbc.queryForObject(
                "INSERT INTO contact_message (name, email, message, status, attempts, last_error, sender_hash)"
                        + " VALUES ('Ada Example', ?, 'Hello from the retry job test', 'FAILED', ?, 'HTTP_503', ?)"
                        + " RETURNING id",
                Long.class,
                email,
                attempts,
                "c".repeat(64));
    }

    private Map<String, Object> row(long id) {
        return jdbc.queryForMap("SELECT * FROM contact_message WHERE id = ?", id);
    }
}
