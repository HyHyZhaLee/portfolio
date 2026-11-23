package com.huygialy.portfolio.stats;

import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * How long the stats summary is cached (env {@code STATS_CACHE_TTL}, default 60 s, FR-9). Zero turns the cache off, as
 * the test profile does, so integration tests see their own inserts (PF-005 P8).
 */
@Validated
@ConfigurationProperties("app.stats")
public record StatsProperties(@NotNull @DefaultValue("60s") Duration cacheTtl) {}
