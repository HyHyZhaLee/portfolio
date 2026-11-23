package com.huygialy.portfolio.contact.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One contact message from the form (SITE-004, PF-006 P3). The name rejects every control character and the message
 * every one except tab, line feed, and carriage return, because PostgreSQL rejects NUL, which would otherwise answer 500
 * (D5). {@code website} is the honeypot: optional, and any non-blank value stores the message as spam. {@code toString}
 * never prints the content, because Spring's DEBUG argument logging prints request bodies (Non-Negotiable 9).
 */
public record CreateContactMessageRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "[^\\p{Cntrl}]*", message = "must not contain control characters") String name,

        @NotBlank @Email @Size(max = 254) String email,

        @NotBlank @Size(min = 10, max = 2000) @Pattern(regexp = "[^\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]*", message = "must not contain control characters") String message,

        @Size(max = 2048) String website) {

    @Override
    public String toString() {
        return "CreateContactMessageRequest[redacted]";
    }
}
