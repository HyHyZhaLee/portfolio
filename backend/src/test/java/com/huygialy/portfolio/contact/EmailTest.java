package com.huygialy.portfolio.contact;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.contact.EmailSender.Email;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** The owner's email (PF-006 D6, PF-028). Unit test: pure logic, claiming the integration-test gate's exemption. */
class EmailTest {

    private static final Instant NOW = Instant.parse("2026-11-25T10:00:00Z");

    @Test
    void theVisitorsSubjectGoesInTheBodyNotTheEmailSubject() {
        final var email = Email.from(message("A backend role"));

        assertThat(email.text()).contains("Subject: A backend role\n").contains("Hello there!");
        assertThat(email.subject()).isEqualTo("New portfolio contact message (#7)");
    }

    @Test
    void aMessageReceivedBeforeSubjectsExistedReadsNone() {
        assertThat(Email.from(message(null)).text()).contains("Subject: (none)\n");
    }

    private static ContactMessageEntity message(String subject) {
        final var entity = ContactMessageEntity.receive(
                "Ada Example", "visitor@example.com", subject, "Hello there!", null, "a".repeat(64), NOW);
        ReflectionTestUtils.setField(entity, "id", 7L);
        return entity;
    }
}
