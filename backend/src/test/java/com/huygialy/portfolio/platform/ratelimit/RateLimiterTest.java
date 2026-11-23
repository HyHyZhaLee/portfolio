package com.huygialy.portfolio.platform.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.huygialy.portfolio.platform.error.ApiException;
import com.huygialy.portfolio.platform.error.ErrorCode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    private final MutableClock clock = new MutableClock();
    private final RateLimiter limiter = new RateLimiter(clock);

    @Test
    void visitLimitIsPerVisitorAndRefills() {
        for (int i = 0; i < 30; i++) {
            limiter.check(RateLimit.VISIT, "visitor-a");
        }
        assertThatThrownBy(() -> limiter.check(RateLimit.VISIT, "visitor-a"))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.code()).isEqualTo(ErrorCode.RATE_LIMITED);
                    assertThat(e.retryAfter())
                            .hasValueSatisfying(d -> assertThat(d).isPositive());
                });
        assertThatCode(() -> limiter.check(RateLimit.VISIT, "visitor-b")).doesNotThrowAnyException();

        clock.advance(Duration.ofMinutes(1));
        assertThatCode(() -> limiter.check(RateLimit.VISIT, "visitor-a")).doesNotThrowAnyException();
    }

    @Test
    void contactAllowsThreePerHour() {
        for (int i = 0; i < 3; i++) {
            limiter.check(RateLimit.CONTACT, "visitor-a");
        }
        assertThatThrownBy(() -> limiter.check(RateLimit.CONTACT, "visitor-a"))
                .isInstanceOfSatisfying(
                        ApiException.class, e -> assertThat(e.code()).isEqualTo(ErrorCode.RATE_LIMITED));
    }

    private static final class MutableClock extends Clock {

        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
