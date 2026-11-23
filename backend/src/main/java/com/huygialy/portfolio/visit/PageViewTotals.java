package com.huygialy.portfolio.visit;

import java.time.Instant;

/**
 * Page-view totals that other features read through {@link VisitQueryService} (backend guide principle 3): every stored
 * view, the number of distinct visitor hashes, and the first view's time, {@code null} when there are no rows.
 */
public record PageViewTotals(long totalViews, long uniqueVisitors, Instant firstViewAt) {}
