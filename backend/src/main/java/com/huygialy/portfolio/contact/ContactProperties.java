package com.huygialy.portfolio.contact;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * How failed contact messages are retried. {@code retryEnabled} (env {@code CONTACT_RETRY_ENABLED}) switches the
 * scheduled job; the test profile turns it off and calls the job's work method directly. {@code maxAttempts} counts every
 * delivery attempt of a message, the request's own included (PF-006 D2); {@code retryBatchSize} caps one run.
 */
@Validated
@ConfigurationProperties("app.contact")
public record ContactProperties(
        @DefaultValue("true") boolean retryEnabled,
        @DefaultValue("3") @Min(1) int maxAttempts,
        @DefaultValue("10") @Min(1) int retryBatchSize) {}
