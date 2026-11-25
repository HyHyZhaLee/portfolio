package com.huygialy.portfolio.contact;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.github.resilience4j.core.IntervalFunction;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Emails the owner through Resend's REST API over HTTPS (backend guide principle 8, PF-006 P10). The client has explicit
 * connect and read timeouts; one delivery attempt makes up to {@code maxTries} requests with exponential backoff and one
 * {@code Idempotency-Key}, retrying only timeouts, connection errors, 429, and 5xx. Every failure becomes a
 * {@link DeliveryException} with a reason code; provider text is never logged, stored, or chained (PF-006 D8). Every
 * email carries the Resend tag {@code environment=<name>}, and outside production its subject starts with
 * {@code [<name>] }, so staging mail is recognizable in the inbox and in Resend's logs (PF-027 P15).
 */
@Component
@Profile("!local")
class ResendEmailSender implements EmailSender {

    static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);

    private final RestClient client;
    private final Retry retry;
    private final JsonMapper jsonMapper;
    private final String fromEmail;
    private final String toEmail;
    private final String subjectPrefix;
    private final List<Tag> tags;

    ResendEmailSender(ResendProperties properties, JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
        this.fromEmail = properties.fromEmail();
        this.toEmail = properties.toEmail();
        final var environment = properties.environment();
        this.subjectPrefix = ResendProperties.PRODUCTION.equals(environment) ? "" : "[" + environment + "] ";
        this.tags = List.of(new Tag("environment", environment));
        // HTTP/1.1: the JDK client would otherwise try an h2c upgrade on a plain-HTTP port such as WireMock's.
        final var httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.connectTimeout())
                .build();
        final var requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());
        // Framework's builder with Boot's JsonMapper: no extra Boot module for one client (PF-006 D15, KNOWN-BE-005).
        this.client = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .configureMessageConverters(converters -> converters
                        .withStringConverter(new StringHttpMessageConverter(StandardCharsets.UTF_8))
                        .withJsonConverter(new JacksonJsonHttpMessageConverter(jsonMapper)))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                .build();
        this.retry = Retry.of(
                "resend",
                RetryConfig.custom()
                        .maxAttempts(properties.maxTries())
                        .intervalFunction(IntervalFunction.ofExponentialBackoff(properties.backoff(), 2.0))
                        .retryOnException(e -> e instanceof DeliveryException failure && failure.retryable())
                        .build());
    }

    /** One delivery attempt; when every try fails, the last try's {@link DeliveryException} is thrown. */
    @Override
    public String send(Email email) {
        return retry.executeSupplier(() -> sendOnce(email));
    }

    private String sendOnce(Email email) {
        final String body;
        try {
            body = client.post()
                    .uri("/emails")
                    .header(IDEMPOTENCY_KEY, email.idempotencyKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new SendRequest(
                            fromEmail,
                            List.of(toEmail),
                            subjectPrefix + email.subject(),
                            email.text(),
                            email.replyTo(),
                            tags))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientResponseException e) {
            final var status = e.getStatusCode();
            throw new DeliveryException(
                    "HTTP_" + status.value(),
                    status.is5xxServerError() || status.value() == HttpStatus.TOO_MANY_REQUESTS.value());
        } catch (ResourceAccessException e) {
            throw new DeliveryException("IO_ERROR", true);
        }
        return emailId(body, email);
    }

    /** Resend accepted the email, so a missing or unreadable ID is only logged: the email is on its way. */
    private String emailId(String body, Email email) {
        try {
            final var response = body == null || body.isBlank() ? null : jsonMapper.readValue(body, SendResponse.class);
            if (response != null && response.id() != null && !response.id().isBlank()) {
                return response.id();
            }
        } catch (JacksonException e) {
            // Falls through to the warning: the response body is never logged.
        }
        log.warn("Contact message {} accepted by Resend without a readable email ID", email.messageId());
        return null;
    }

    /** The body of {@code POST /emails}; {@code toString} hides it, because DEBUG client logging prints bodies. */
    record SendRequest(
            String from,
            List<String> to,
            String subject,
            String text,
            @JsonProperty("reply_to") String replyTo,
            List<Tag> tags) {

        @Override
        public String toString() {
            return "SendRequest[redacted]";
        }
    }

    /** A Resend email tag; the name and value hold ASCII letters, digits, underscores, or dashes only. */
    record Tag(String name, String value) {}

    /** The part of Resend's answer that is kept. */
    record SendResponse(String id) {}
}
