package com.huygialy.portfolio.stats;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.visit.PageViewRecorded;
import com.huygialy.portfolio.visit.PageViewTotals;
import com.huygialy.portfolio.visit.VisitQueryService;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * The memo in {@link StatsQueryService} is pure in-memory logic (backend guide principle 14, unit-test exemption): with a
 * positive TTL the totals are read once and served from the one-entry cache; with a zero TTL every call reads through.
 * Expiry itself is Caffeine's {@code expireAfterWrite} and is not re-tested here.
 */
class StatsQueryServiceTest {

    @Test
    void aPositiveTtlServesTheFirstTotalsWithoutReadingAgain() {
        final var visits = new CountingVisitQueryService();
        final var service = new StatsQueryService(visits, new StatsProperties(Duration.ofSeconds(60)));

        final var first = service.summary();
        final var second = service.summary();

        assertThat(visits.calls).isEqualTo(1);
        assertThat(second).isSameAs(first);
        assertThat(first.totalViews()).isEqualTo(1);
    }

    @Test
    void aRecordedViewDropsTheCachedTotals() {
        // PF-023 D5: the summary asked for right after a stored view includes it.
        final var visits = new CountingVisitQueryService();
        final var service = new StatsQueryService(visits, new StatsProperties(Duration.ofSeconds(60)));
        service.summary();

        service.onPageViewRecorded(new PageViewRecorded(Instant.parse("2026-11-24T08:00:00Z")));
        final var after = service.summary();

        assertThat(visits.calls).isEqualTo(2);
        assertThat(after.totalViews()).isEqualTo(2);
    }

    @Test
    void aZeroTtlReadsThroughOnEveryCall() {
        final var visits = new CountingVisitQueryService();
        final var service = new StatsQueryService(visits, new StatsProperties(Duration.ZERO));

        service.summary();
        final var second = service.summary();

        assertThat(visits.calls).isEqualTo(2);
        assertThat(second.totalViews()).isEqualTo(2);
    }

    /** Answers fresh totals on each call, so a cached answer is told apart from a new read. */
    private static final class CountingVisitQueryService extends VisitQueryService {

        private int calls;

        CountingVisitQueryService() {
            super(null);
        }

        @Override
        public PageViewTotals totals() {
            calls++;
            return new PageViewTotals(calls, calls, Instant.parse("2026-11-23T00:00:00Z"));
        }
    }
}
