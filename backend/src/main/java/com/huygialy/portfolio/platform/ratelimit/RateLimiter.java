package com.huygialy.portfolio.platform.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.huygialy.portfolio.platform.error.ApiException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.TimeMeter;
import java.time.Clock;
import java.time.Duration;
import org.springframework.stereotype.Component;

/**
 * Per-client token buckets keyed by {@code ClientInfo.rateLimitKey()}, an HMAC of the client IP alone, so changing the
 * user agent does not reset a limit (backend guide principle 10). Command services call
 * {@link #check} before doing any work. Buckets live in memory, are bounded, and reset on restart, which the free tier
 * accepts (Non-Negotiable 8).
 */
@Component
public class RateLimiter {

    static final int MAX_TRACKED_BUCKETS = 10_000;

    private final TimeMeter time;
    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .maximumSize(MAX_TRACKED_BUCKETS)
            .expireAfterAccess(Duration.ofHours(1))
            .build();

    public RateLimiter(Clock clock) {
        this.time = new ClockTimeMeter(clock);
    }

    /** Takes one token from this client's bucket, or throws {@code RATE_LIMITED} with the wait until the next one. */
    public void check(RateLimit limit, String rateLimitKey) {
        final var bucket = buckets.get(limit.name() + ":" + rateLimitKey, key -> newBucket(limit));
        final var probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            throw ApiException.rateLimited(Duration.ofNanos(probe.getNanosToWaitForRefill()));
        }
    }

    private Bucket newBucket(RateLimit limit) {
        final var bandwidth = Bandwidth.builder()
                .capacity(limit.capacity())
                .refillGreedy(limit.capacity(), limit.period())
                .build();
        return Bucket.builder()
                .addLimit(bandwidth)
                .withCustomTimePrecision(time)
                .build();
    }

    /** Bucket4j reads time from the injected {@code Clock}, so tests can move it. */
    private record ClockTimeMeter(Clock clock) implements TimeMeter {

        @Override
        public long currentTimeNanos() {
            final var now = clock.instant();
            return now.getEpochSecond() * 1_000_000_000L + now.getNano();
        }

        @Override
        public boolean isWallClockBased() {
            return true;
        }
    }
}
