package com.huygialy.portfolio.platform.error;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * The one exception for client-safe failures. {@code detail} is written for the client and never holds framework, SQL,
 * or provider text (Non-Negotiable 5). Variants are factories, not subclasses (backend guide principle 3).
 */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final String detail;
    private final List<FieldViolation> violations;
    private final Duration retryAfter;

    public ApiException(ErrorCode code, String detail) {
        this(code, detail, List.of(), null);
    }

    private ApiException(ErrorCode code, String detail, List<FieldViolation> violations, Duration retryAfter) {
        super(detail);
        this.code = code;
        this.detail = detail;
        this.violations = List.copyOf(violations);
        this.retryAfter = retryAfter;
    }

    public static ApiException validationFailed(List<FieldViolation> violations) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, "The request has invalid fields.", violations, null);
    }

    public static ApiException notFound(String detail) {
        return new ApiException(ErrorCode.NOT_FOUND, detail);
    }

    /** {@code retryAfter} becomes the {@code Retry-After} header, in whole seconds rounded up. */
    public static ApiException rateLimited(Duration retryAfter) {
        return new ApiException(ErrorCode.RATE_LIMITED, "Too many requests. Try again later.", List.of(), retryAfter);
    }

    public ErrorCode code() {
        return code;
    }

    public String detail() {
        return detail;
    }

    public List<FieldViolation> violations() {
        return violations;
    }

    public Optional<Duration> retryAfter() {
        return Optional.ofNullable(retryAfter);
    }

    /** One invalid field in a {@code VALIDATION_FAILED} response. */
    public record FieldViolation(String field, String message) {}
}
