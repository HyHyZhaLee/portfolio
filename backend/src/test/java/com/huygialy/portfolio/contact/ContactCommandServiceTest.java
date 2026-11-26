package com.huygialy.portfolio.contact;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.huygialy.portfolio.contact.api.CreateContactMessageRequest;
import com.huygialy.portfolio.platform.client.ClientInfo;
import com.huygialy.portfolio.platform.client.ClientInfo.DeviceType;
import com.huygialy.portfolio.platform.ratelimit.RateLimit;
import com.huygialy.portfolio.platform.ratelimit.RateLimiter;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * The branches of F1 that an integration test cannot reach without a mock bean (KNOWN-BE-008): a spam row is never
 * sent and never counts toward the limit all clients share (PF-029 P4), and a failure to record the outcome after a
 * successful send never reaches the visitor. Unit test with Mockito, claiming the integration-test gate's exemption.
 */
class ContactCommandServiceTest {

    private static final String HASH = "b".repeat(64);
    private static final ClientInfo CLIENT =
            new ClientInfo(HASH, "rate-key", DeviceType.DESKTOP, "Chrome", false, false);

    private final ContactLifecycle lifecycle = mock(ContactLifecycle.class);
    private final EmailSender emailSender = mock(EmailSender.class);
    private final RateLimiter rateLimiter = mock(RateLimiter.class);
    private final ContactCommandService service = new ContactCommandService(rateLimiter, lifecycle, emailSender);

    @Test
    void aSpamMessageIsNeverSentAndSkipsTheGlobalLimit() {
        final var body = request("https://spam.example");
        when(lifecycle.savePending(body, HASH)).thenReturn(saved(body, 41L));

        service.submit(body, CLIENT);

        verifyNoInteractions(emailSender);
        verify(rateLimiter).check(RateLimit.CONTACT, "rate-key");
        verify(rateLimiter, never()).check(RateLimit.CONTACT_GLOBAL, RateLimit.GLOBAL_KEY);
    }

    @Test
    void aFailureToRecordTheOutcomeAfterASendIsSwallowed() {
        final var body = request(null);
        when(lifecycle.savePending(body, HASH)).thenReturn(saved(body, 42L));
        when(emailSender.send(any())).thenReturn("email-42");
        doThrow(new IllegalStateException("database down")).when(lifecycle).markSent(42L, "email-42");

        assertThatCode(() -> service.submit(body, CLIENT)).doesNotThrowAnyException();

        verify(rateLimiter).check(RateLimit.CONTACT_GLOBAL, RateLimit.GLOBAL_KEY);
        verify(lifecycle, never()).markFailed(anyLong(), anyString());
    }

    private static CreateContactMessageRequest request(String website) {
        return new CreateContactMessageRequest("Ada Example", "visitor@example.com", "A role", "Hello there!", website);
    }

    private static ContactMessageEntity saved(CreateContactMessageRequest body, long id) {
        final var entity = ContactMessageEntity.receive(
                body.name(),
                body.email(),
                body.subject(),
                body.message(),
                body.website(),
                HASH,
                Instant.parse("2026-11-23T10:00:00Z"));
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }
}
