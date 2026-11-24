package com.huygialy.portfolio.stats;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.huygialy.portfolio.visit.PageViewRecorded;
import com.huygialy.portfolio.visit.PageViewTotals;
import com.huygialy.portfolio.visit.VisitQueryService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/**
 * The footer's totals, memoized in a one-entry Caffeine cache for {@code app.stats.cache-ttl} (PF-005 P8, FR-9). A zero
 * TTL reads straight through, so the test profile never depends on how Caffeine treats a zero expiry. Page views are
 * read only through {@link VisitQueryService} (backend guide principle 3). A stored view drops the memo, so the next
 * summary includes it (PF-023 D5).
 */
@Service
public class StatsQueryService {

    private static final String SUMMARY_KEY = "summary";

    private final VisitQueryService visitQueryService;
    /** {@code null} when the TTL is zero: no cache. */
    private final Cache<String, PageViewTotals> cache;

    public StatsQueryService(VisitQueryService visitQueryService, StatsProperties properties) {
        this.visitQueryService = visitQueryService;
        final var ttl = properties.cacheTtl();
        this.cache = ttl.isZero()
                ? null
                : Caffeine.newBuilder().maximumSize(1).expireAfterWrite(ttl).build();
    }

    /** The totals, at most {@code cacheTtl} old. */
    public PageViewTotals summary() {
        if (cache == null) {
            return visitQueryService.totals();
        }
        return cache.get(SUMMARY_KEY, key -> visitQueryService.totals());
    }

    /** A new view makes the memo stale: the next {@link #summary()} reads the totals again (PF-023 D5). */
    @EventListener
    public void onPageViewRecorded(PageViewRecorded event) {
        if (cache != null) {
            cache.invalidateAll();
        }
    }
}
