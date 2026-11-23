package com.huygialy.portfolio.visit.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One page view from the beacon (FR-5). {@code path} starts with "/" and carries no query, fragment, or control
 * character (PostgreSQL rejects NUL, which would otherwise surface as a 500). {@code ref} is bounded but not rejected for
 * its format: an invalid tag only drops the tag (SITE-003).
 */
public record RecordVisitRequest(
        @NotBlank @Size(max = 255) @Pattern(regexp = "/[^?#\\x00-\\x1F\\x7F]*") String path,

        @Size(max = 2048) String referrer,
        @Size(max = 256) String ref) {}
