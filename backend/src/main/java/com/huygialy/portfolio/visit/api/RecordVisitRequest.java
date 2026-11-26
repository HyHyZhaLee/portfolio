package com.huygialy.portfolio.visit.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One page view from the beacon (FR-5). {@code path} is the home page or a case-study route, {@link #TRACKED_PATH}
 * (SITE-002, PF-029 P7), so stored paths stay bounded. {@code ref} is bounded but not rejected for its format: an invalid
 * tag only drops the tag (SITE-003).
 */
public record RecordVisitRequest(
        @NotBlank @Size(max = 70) @Pattern(regexp = TRACKED_PATH) String path,

        @Size(max = 2048) String referrer,
        @Size(max = 256) String ref) {

    /** {@code /} or {@code /work/<slug>}; the frontend's beacon checks the same pattern before it sends a view. */
    static final String TRACKED_PATH = "/|/work/[a-z0-9]+(-[a-z0-9]+)*";
}
