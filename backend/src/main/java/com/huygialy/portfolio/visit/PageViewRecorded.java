package com.huygialy.portfolio.visit;

import java.time.Instant;

/**
 * Published after a page view is stored (PF-023 D5), so the footer's cached totals can be dropped without {@code visit}
 * depending on {@code stats} (backend guide principle 3). Carries no visitor data.
 */
public record PageViewRecorded(Instant viewedAt) {}
