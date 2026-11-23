package com.huygialy.portfolio.platform.ratelimit;

import java.time.Duration;

/** Per-client limits (SITE-002, SITE-004): at most {@code capacity} requests per {@code period} from one client address. */
public enum RateLimit {
    VISIT(30, Duration.ofMinutes(1)),
    CONTACT(3, Duration.ofHours(1));

    private final int capacity;
    private final Duration period;

    RateLimit(int capacity, Duration period) {
        this.capacity = capacity;
        this.period = period;
    }

    public int capacity() {
        return capacity;
    }

    public Duration period() {
        return period;
    }
}
