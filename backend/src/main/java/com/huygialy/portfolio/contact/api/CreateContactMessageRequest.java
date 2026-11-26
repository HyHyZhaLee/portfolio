package com.huygialy.portfolio.contact.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One contact message from the form (SITE-004, PF-006 P3, PF-028). The name and subject reject every control character
 * and the message every one except tab, line feed, and carriage return, because PostgreSQL rejects NUL, which would
 * otherwise answer 500 (D5); both also reject line separators and bidi controls (PF-029 P5). {@code website} is the
 * honeypot: optional, and any non-blank value stores the message as spam. {@code toString} never prints the content,
 * because Spring's DEBUG argument logging prints request bodies (Non-Negotiable 9).
 */
public record CreateContactMessageRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = SINGLE_LINE, message = "must not contain control characters") String name,

        @NotBlank @Email @Size(max = 254) String email,

        @NotBlank @Size(max = 150) @Pattern(regexp = SINGLE_LINE, message = "must not contain control characters") String subject,

        @NotBlank @Size(max = 10000) @Pattern(regexp = MULTI_LINE, message = "must not contain control characters") String message,

        @Size(max = 2048) String website) {

    /**
     * No control character (C0, DEL, C1), line or paragraph separator, or bidi mark, embedding, override, or isolate, so a
     * name cannot fake a line or reorder the text in the owner's email (PF-029 P5). Zero-width joiners stay allowed,
     * because emoji sequences and some scripts need them. One character class, so a 10,000-character value never
     * recurses in the regex engine.
     */
    static final String SINGLE_LINE =
            "[^\\x00-\\x1F\\x7F-\\x9F\\u2028\\u2029\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]*";

    /** {@link #SINGLE_LINE}, except that tab, line feed, and carriage return are allowed. */
    static final String MULTI_LINE =
            "[^\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F-\\x9F\\u2028\\u2029\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]*";

    @Override
    public String toString() {
        return "CreateContactMessageRequest[redacted]";
    }
}
