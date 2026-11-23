package com.huygialy.portfolio.stats.api;

import com.huygialy.portfolio.stats.StatsQueryService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code GET /api/v1/stats/summary}: the cached totals for the footer counter. */
@RestController
public class StatsController {

    private final StatsQueryService queryService;

    public StatsController(StatsQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/api/v1/stats/summary")
    @Operation(operationId = "getStatsSummary")
    public StatsSummaryResponse getStatsSummary() {
        return StatsSummaryResponse.from(queryService.summary());
    }
}
