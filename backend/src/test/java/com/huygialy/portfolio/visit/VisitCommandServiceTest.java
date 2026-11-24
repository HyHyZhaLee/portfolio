package com.huygialy.portfolio.visit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.huygialy.portfolio.platform.client.ClientInfo;
import com.huygialy.portfolio.platform.client.ClientInfo.DeviceType;
import com.huygialy.portfolio.platform.ratelimit.RateLimiter;
import com.huygialy.portfolio.visit.api.RecordVisitRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * PF-023 D5: a stored view is announced so the footer's cached totals are dropped, and a bot view, which is never
 * stored, is not. Unit test with Mockito, claiming the integration-test gate's exemption: the insert itself is covered
 * by {@code VisitApiIT}.
 */
class VisitCommandServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-24T08:00:00Z");
    private static final RecordVisitRequest VIEW = new RecordVisitRequest("/", null, null);

    private final PageViewRepository repository = mock(PageViewRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final VisitCommandService service =
            new VisitCommandService(mock(RateLimiter.class), repository, Clock.fixed(NOW, ZoneOffset.UTC), events);

    @Test
    void aStoredViewIsAnnounced() {
        service.record(VIEW, client(false));

        verify(repository).save(any(PageViewEntity.class));
        verify(events).publishEvent(new PageViewRecorded(NOW));
    }

    @Test
    void aBotViewIsNeitherStoredNorAnnounced() {
        service.record(VIEW, client(true));

        verifyNoInteractions(repository, events);
    }

    private static ClientInfo client(boolean bot) {
        return new ClientInfo("c".repeat(64), "rate-key", DeviceType.DESKTOP, "Chrome", bot);
    }
}
