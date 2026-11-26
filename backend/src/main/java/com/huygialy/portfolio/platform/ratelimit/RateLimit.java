package com.huygialy.portfolio.platform.ratelimit;

import java.time.Duration;

/**
 * Request limits (SITE-002, SITE-004): at most {@code capacity} requests per {@code period} for one key. Every limit is
 * keyed by the client address except {@link #CONTACT_GLOBAL}, which uses {@link #GLOBAL_KEY} so all clients share it
 * and the email provider's free quota survives a flood from many addresses; only messages that would be emailed count
 * toward it, never honeypot hits (PF-029 P4).
 */
public enum RateLimit {
    VISIT(30, Duration.ofMinutes(1)),
    CONTACT(3, Duration.ofHours(1)),
    CONTACT_GLOBAL(20, Duration.ofHours(1));

    /** The one key of a limit every client shares. */
    public static final String GLOBAL_KEY = "all";

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
