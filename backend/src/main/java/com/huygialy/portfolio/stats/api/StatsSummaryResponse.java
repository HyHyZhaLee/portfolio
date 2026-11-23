package com.huygialy.portfolio.stats.api;

import com.huygialy.portfolio.visit.PageViewTotals;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * {@code GET /api/v1/stats/summary} (FR-9). The counts are required in the OpenAPI document, so the generated frontend
 * type has plain numbers; {@code since} is the first view's time, {@code null} when nothing is stored yet, and is marked
 * nullable so the generated type admits that {@code null}.
 */
public record StatsSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long totalViews,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long uniqueVisitors,
        @Schema(types = {"string", "null"}) Instant since) {

    public static StatsSummaryResponse from(PageViewTotals totals) {
        return new StatsSummaryResponse(totals.totalViews(), totals.uniqueVisitors(), totals.firstViewAt());
    }
}
