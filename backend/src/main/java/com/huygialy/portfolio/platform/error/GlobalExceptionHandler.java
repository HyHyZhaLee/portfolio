package com.huygialy.portfolio.platform.error;

import com.huygialy.portfolio.platform.error.ApiException.FieldViolation;
import com.huygialy.portfolio.platform.web.CorrelationIdFilter;
import jakarta.servlet.RequestDispatcher;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * The only place that turns exceptions into RFC 9457 problem responses (backend guide principle 7). Every body carries
 * {@code code}, {@code correlationId}, and {@code timestamp}; {@code detail} is always written here, never copied from
 * the exception. The security chain routes its denials here too, so an off-list path answers 404 (PF-004 D4).
 */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    static final String NOT_FOUND_DETAIL = "No public resource matches this path and method.";
    static final String VALIDATION_DETAIL = "The request is invalid.";
    static final String INTERNAL_DETAIL = "Something went wrong on our side. Try again later.";

    private final Clock clock;

    GlobalExceptionHandler(Clock clock) {
        this.clock = clock;
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Object> handleApiException(ApiException ex, WebRequest request) {
        log.warn("Request failed with {}", ex.code());
        final var headers = new HttpHeaders();
        ex.retryAfter().ifPresent(wait -> headers.set(HttpHeaders.RETRY_AFTER, Long.toString(wholeSeconds(wait))));
        return problem(ex.code(), ex.detail(), ex.violations(), headers, request);
    }

    /** Raised by the security chain for any path or method outside the public list. */
    @ExceptionHandler({AuthenticationException.class, AccessDeniedException.class})
    ResponseEntity<Object> handleDenied(RuntimeException ex, WebRequest request) {
        return problem(ErrorCode.NOT_FOUND, NOT_FOUND_DETAIL, List.of(), new HttpHeaders(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
        log.error("Unexpected failure", ex);
        return problem(ErrorCode.INTERNAL_ERROR, INTERNAL_DETAIL, List.of(), new HttpHeaders(), request);
    }

    /** Every framework exception the base class handles ends here: 404 and 405 become NOT_FOUND, other 4xx VALIDATION_FAILED. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        final var code = codeFor(statusCode);
        if (code == ErrorCode.INTERNAL_ERROR) {
            log.error("Unexpected framework failure", ex);
        } else {
            log.warn("Request rejected with {} ({})", code, ex.getClass().getSimpleName());
        }
        final List<FieldViolation> violations =
                ex instanceof MethodArgumentNotValidException invalid ? violationsOf(invalid) : List.of();
        return problem(code, detailFor(code, violations), violations, new HttpHeaders(), request);
    }

    /** For a response that reached the {@code /error} dispatch without an exception here (see {@code ProblemErrorController}). */
    ResponseEntity<Object> problemForStatus(HttpStatusCode status, WebRequest request) {
        final var code = codeFor(status);
        return problem(code, detailFor(code, List.of()), List.of(), new HttpHeaders(), request);
    }

    private static String detailFor(ErrorCode code, List<FieldViolation> violations) {
        return switch (code) {
            case NOT_FOUND -> NOT_FOUND_DETAIL;
            case VALIDATION_FAILED -> violations.isEmpty() ? VALIDATION_DETAIL : "The request has invalid fields.";
            default -> INTERNAL_DETAIL;
        };
    }

    static ErrorCode codeFor(HttpStatusCode status) {
        if (status.value() == 404 || status.value() == 405) {
            return ErrorCode.NOT_FOUND;
        }
        return status.is4xxClientError() ? ErrorCode.VALIDATION_FAILED : ErrorCode.INTERNAL_ERROR;
    }

    private static List<FieldViolation> violationsOf(MethodArgumentNotValidException ex) {
        return ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldViolation(error.getField(), error.getDefaultMessage()))
                .toList();
    }

    static long wholeSeconds(Duration wait) {
        final var seconds = wait.toSeconds() + (wait.toNanosPart() > 0 ? 1 : 0);
        return Math.max(1, seconds);
    }

    private ResponseEntity<Object> problem(
            ErrorCode code, String detail, List<FieldViolation> violations, HttpHeaders headers, WebRequest request) {
        final var problem = ProblemDetail.forStatusAndDetail(code.status(), detail);
        problem.setTitle(code.title());
        if (request instanceof ServletWebRequest servletRequest) {
            // On the /error dispatch the request URI is /error; the original path is in a request attribute.
            final var original = servletRequest.getRequest().getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
            problem.setInstance(instanceOf(
                    original instanceof String path
                            ? path
                            : servletRequest.getRequest().getRequestURI()));
        }
        problem.setProperty("code", code.name());
        problem.setProperty("correlationId", CorrelationIdFilter.current(request));
        problem.setProperty("timestamp", clock.instant().toString());
        if (!violations.isEmpty()) {
            problem.setProperty("errors", violations);
        }
        headers.setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        return new ResponseEntity<>(problem, headers, code.status());
    }

    private static URI instanceOf(String path) {
        try {
            return URI.create(path);
        } catch (IllegalArgumentException invalid) {
            return null;
        }
    }
}
