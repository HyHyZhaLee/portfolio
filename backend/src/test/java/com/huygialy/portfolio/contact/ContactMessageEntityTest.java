package com.huygialy.portfolio.contact;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.huygialy.portfolio.contact.ContactMessageEntity.Status;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/** The outbox transitions (PF-006 P2). Unit test: pure logic, claiming the integration-test gate's exemption. */
class ContactMessageEntityTest {

    private static final Instant NOW = Instant.parse("2026-11-23T10:00:00Z");
    private static final String HASH = "a".repeat(64);

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void aBlankHoneypotGivesAPendingMessageWithTheRequestsAttempt(String honeypot) {
        final var message = receive(honeypot);

        assertThat(message.getStatus()).isEqualTo(Status.PENDING);
        assertThat(message.getAttempts()).isEqualTo(1);
        assertThat(message.isSpam()).isFalse();
    }

    @Test
    void aFilledHoneypotGivesSpamWithNoAttempt() {
        final var message = receive("https://spam.example");

        assertThat(message.getStatus()).isEqualTo(Status.SPAM);
        assertThat(message.getAttempts()).isZero();
        assertThat(message.isSpam()).isTrue();
    }

    @Test
    void markSentOnAPendingMessageRecordsTheProviderId() {
        final var message = receive(null);
        final var later = NOW.plusSeconds(1);

        message.markSent("email-1", later);

        assertThat(message.getStatus()).isEqualTo(Status.SENT);
        assertThat(message.getProviderMessageId()).isEqualTo("email-1");
        assertThat(message.getUpdatedAt()).isEqualTo(later);
    }

    @Test
    void aSentOrSpamMessageCannotBeMarkedFailed() {
        final var sent = receive(null);
        sent.markSent(null, NOW);

        assertThatThrownBy(() -> sent.markFailed("HTTP_503", NOW)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> receive("filled").markSent("email-2", NOW)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void aLongReasonIsCutToItsColumn() {
        final var message = receive(null);

        message.markFailed("X".repeat(80), NOW);

        assertThat(message.getStatus()).isEqualTo(Status.FAILED);
        assertThat(message.getLastError()).hasSize(ContactMessageEntity.LAST_ERROR_LENGTH);
    }

    private static ContactMessageEntity receive(String honeypot) {
        return ContactMessageEntity.receive(
                "Ada Example", "visitor@example.com", "A role", "Hello there!", honeypot, HASH, NOW);
    }
}
