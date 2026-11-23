package com.huygialy.portfolio.visit;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/** The ref-tag and referrer rules of a page view (SITE-003, SITE-006). Pure and static. */
public final class VisitValidator {

    private static final Pattern REF_TAG = Pattern.compile("^[a-z0-9-]{1,64}$");
    private static final int MAX_HOST_LENGTH = 255;

    private VisitValidator() {}

    /**
     * The tag when it matches {@code ^[a-z0-9-]{1,64}$}; otherwise nothing, and the view is stored without it. It is
     * never lowercased, so an uppercase tag is dropped.
     */
    public static Optional<String> refTag(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        return REF_TAG.matcher(raw).matches() ? Optional.of(raw) : Optional.empty();
    }

    /**
     * The lowercased host of an {@code http} or {@code https} URL, at most 255 characters; otherwise nothing. The path
     * and query of the referring page are never kept (Non-Negotiable 3).
     */
    public static Optional<String> referrerHost(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        final URI uri;
        try {
            uri = URI.create(raw);
        } catch (IllegalArgumentException malformed) {
            return Optional.empty();
        }
        final var scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            return Optional.empty();
        }
        final var host = uri.getHost();
        if (host == null) {
            return Optional.empty();
        }
        final var lowercased = host.toLowerCase(Locale.ROOT);
        return lowercased.length() <= MAX_HOST_LENGTH ? Optional.of(lowercased) : Optional.empty();
    }
}
