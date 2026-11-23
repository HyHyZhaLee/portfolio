package com.huygialy.portfolio.visit;

import com.huygialy.portfolio.platform.client.ClientInfo;
import com.huygialy.portfolio.platform.ratelimit.RateLimit;
import com.huygialy.portfolio.platform.ratelimit.RateLimiter;
import com.huygialy.portfolio.visit.api.RecordVisitRequest;
import java.time.Clock;
import org.springframework.stereotype.Service;

/**
 * Records one page view (PF-005 F1). Not transactional: the repository's {@code save} runs the one short insert, and
 * nothing here does network I/O (Non-Negotiable 7).
 */
@Service
public class VisitCommandService {

    private final RateLimiter rateLimiter;
    private final PageViewRepository repository;
    private final Clock clock;

    public VisitCommandService(RateLimiter rateLimiter, PageViewRepository repository, Clock clock) {
        this.rateLimiter = rateLimiter;
        this.repository = repository;
        this.clock = clock;
    }

    /**
     * F1: the rate limit first, for bots too (D7, 429 {@code RATE_LIMITED}); then a bot returns with nothing stored
     * (FR-7); then the referrer and the ref tag are reduced and one row is inserted (FR-6).
     */
    public void record(RecordVisitRequest request, ClientInfo client) {
        rateLimiter.check(RateLimit.VISIT, client.rateLimitKey());
        if (client.bot()) {
            return;
        }
        final var referrerHost = VisitValidator.referrerHost(request.referrer());
        final var refTag = VisitValidator.refTag(request.ref());
        repository.save(PageViewEntity.record(
                request.path(),
                referrerHost.orElse(null),
                refTag.orElse(null),
                client.visitorHash(),
                client.deviceType(),
                client.browser(),
                clock.instant()));
    }
}
