package com.huygialy.portfolio.platform.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.platform.web.CorrelationIdFilter;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;

class GlobalExceptionHandlerTest {

    private static final Instant NOW = Instant.parse("2026-01-02T03:04:05Z");

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(Clock.fixed(NOW, ZoneOffset.UTC));
    private final MockHttpServletRequest servletRequest = new MockHttpServletRequest("POST", "/api/v1/things");
    private final ServletWebRequest request = new ServletWebRequest(servletRequest);

    GlobalExceptionHandlerTest() {
        servletRequest.setAttribute(CorrelationIdFilter.ATTRIBUTE, "corr-123");
    }

    @Test
    void unexpectedExceptionHidesItsMessage() throws Exception {
        final var response = handler.handleUnexpected(new IllegalStateException("secret SQL text"), request);

        final var body = bodyOf(response);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(body.getProperties()).containsEntry("code", "INTERNAL_ERROR");
        assertThat(String.valueOf(body.getDetail())).doesNotContain("secret SQL text");
        assertCommonProperties(response);
    }

    @Test
    void invalidBodyGivesValidationFailedWithTheField() throws Exception {
        final var bindingResult = new BeanPropertyBindingResult(new Object(), "payload");
        bindingResult.addError(new FieldError("payload", "email", "must not be blank"));
        final var parameter = new MethodParameter(Target.class.getDeclaredMethod("accept", String.class), 0);

        final var response =
                handler.handleException(new MethodArgumentNotValidException(parameter, bindingResult), request);

        final var body = bodyOf(response);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body.getProperties()).containsEntry("code", "VALIDATION_FAILED");
        assertThat(body.getProperties().get("errors")).isInstanceOf(List.class);
        assertThat((List<?>) body.getProperties().get("errors"))
                .extracting(violation -> ((ApiException.FieldViolation) violation).field())
                .containsExactly("email");
        assertCommonProperties(response);
    }

    @Test
    void rateLimitedRoundsRetryAfterUp() throws Exception {
        final var response = handler.handleApiException(ApiException.rateLimited(Duration.ofMillis(1500)), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(bodyOf(response).getProperties()).containsEntry("code", "RATE_LIMITED");
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("2");
        assertCommonProperties(response);
    }

    private void assertCommonProperties(ResponseEntity<Object> response) {
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(bodyOf(response).getProperties())
                .containsEntry("correlationId", "corr-123")
                .containsEntry("timestamp", NOW.toString());
    }

    private static ProblemDetail bodyOf(ResponseEntity<Object> response) {
        assertThat(response.getBody()).isInstanceOf(ProblemDetail.class);
        return (ProblemDetail) response.getBody();
    }

    static class Target {
        void accept(String ignored) {}
    }

    @ParameterizedTest
    @CsvSource({
        "404, NOT_FOUND",
        "405, NOT_FOUND",
        "400, VALIDATION_FAILED",
        "415, VALIDATION_FAILED",
        "503, INTERNAL_ERROR"
    })
    void frameworkStatusesMapToTheFourCodes(int status, ErrorCode expected) {
        assertThat(GlobalExceptionHandler.codeFor(HttpStatusCode.valueOf(status)))
                .isEqualTo(expected);
    }

    @Test
    void unreadableBodyGivesValidationFailedWithoutParserText() throws Exception {
        final var unreadable = new HttpMessageNotReadableException(
                "Unexpected token at line 1", new MockHttpInputMessage(new byte[0]));

        final var response = handler.handleException(unreadable, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        final var body = (ProblemDetail) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getProperties())
                .containsEntry("code", "VALIDATION_FAILED")
                .doesNotContainKey("errors");
        assertThat(body.getDetail()).doesNotContain("Unexpected token");
    }

    @Test
    void frameworkServerErrorBecomesInternalError() throws Exception {
        final var response = handler.handleException(new AsyncRequestTimeoutException(), request);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(((ProblemDetail) response.getBody()).getProperties()).containsEntry("code", "INTERNAL_ERROR");
    }

    @Test
    void retryAfterIsWholeSecondsAndAtLeastOne() {
        assertThat(GlobalExceptionHandler.wholeSeconds(Duration.ofSeconds(2))).isEqualTo(2);
        assertThat(GlobalExceptionHandler.wholeSeconds(Duration.ZERO)).isEqualTo(1);
    }
}
