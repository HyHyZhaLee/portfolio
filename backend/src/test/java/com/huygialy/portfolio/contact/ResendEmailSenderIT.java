package com.huygialy.portfolio.contact;

import static com.github.tomakehurst.wiremock.client.WireMock.badRequest;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.equalToJson;
import static com.github.tomakehurst.wiremock.client.WireMock.okJson;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.serviceUnavailable;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.huygialy.portfolio.contact.EmailSender.DeliveryException;
import com.huygialy.portfolio.contact.EmailSender.Email;
import com.huygialy.portfolio.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * The Resend adapter against WireMock (PF-006 S1): the request shape, the bounded retry with one idempotency key per
 * attempt, and the failure mapping. The test profile sets a 500 ms read timeout and a 50 ms backoff.
 */
@IntegrationTest
class ResendEmailSenderIT {

    private static final String EMAILS = "/emails";
    private static final Email EMAIL =
            new Email(901, 1, "visitor@example.com", "New portfolio contact message (#901)", "Synthetic body");
    private static final String KEY = "contact-message-901-attempt-1";

    private final EmailSender sender;
    private final WireMockServer wireMock;

    ResendEmailSenderIT(EmailSender sender, WireMockServer wireMock) {
        this.sender = sender;
        this.wireMock = wireMock;
    }

    @BeforeEach
    void resetWireMock() {
        wireMock.resetAll();
    }

    @Test
    void anAcceptedEmailReturnsTheProviderIdAndSendsTheExpectedRequest() {
        wireMock.stubFor(post(EMAILS).willReturn(okJson("{\"id\":\"email-901\"}")));

        assertThat(sender.send(EMAIL)).isEqualTo("email-901");

        wireMock.verify(
                1,
                postRequestedFor(urlEqualTo(EMAILS))
                        .withHeader("Authorization", equalTo("Bearer re_synthetic_test_key"))
                        .withHeader(ResendEmailSender.IDEMPOTENCY_KEY, equalTo(KEY))
                        .withRequestBody(equalToJson("""
                                {"from": "Portfolio <onboarding@resend.dev>", "to": ["owner@example.com"],
                                 "subject": "New portfolio contact message (#901)", "text": "Synthetic body",
                                 "reply_to": "visitor@example.com"}
                                """)));
    }

    @Test
    void aServerErrorIsRetriedWithTheSameKeyUntilItRecovers() {
        wireMock.stubFor(post(EMAILS)
                .inScenario("recovering")
                .whenScenarioStateIs(STARTED)
                .willReturn(serviceUnavailable())
                .willSetStateTo("second"));
        wireMock.stubFor(post(EMAILS)
                .inScenario("recovering")
                .whenScenarioStateIs("second")
                .willReturn(serviceUnavailable())
                .willSetStateTo("third"));
        wireMock.stubFor(post(EMAILS)
                .inScenario("recovering")
                .whenScenarioStateIs("third")
                .willReturn(okJson("{\"id\":\"email-recovered\"}")));

        assertThat(sender.send(EMAIL)).isEqualTo("email-recovered");

        wireMock.verify(
                3, postRequestedFor(urlEqualTo(EMAILS)).withHeader(ResendEmailSender.IDEMPOTENCY_KEY, equalTo(KEY)));
    }

    @Test
    void aServerErrorOnEveryTryFailsAsRetryableAfterThreeRequests() {
        wireMock.stubFor(post(EMAILS).willReturn(serviceUnavailable()));

        assertFailure("HTTP_503", true);

        wireMock.verify(3, postRequestedFor(urlEqualTo(EMAILS)));
    }

    @Test
    void aRejectedRequestIsNotRetried() {
        wireMock.stubFor(post(EMAILS).willReturn(badRequest()));

        assertFailure("HTTP_400", false);

        wireMock.verify(1, postRequestedFor(urlEqualTo(EMAILS)));
    }

    @Test
    void aResponseSlowerThanTheReadTimeoutFailsAsAnIoError() {
        wireMock.stubFor(post(EMAILS).willReturn(okJson("{\"id\":\"too-late\"}").withFixedDelay(1_000)));

        assertFailure("IO_ERROR", true);

        wireMock.verify(3, postRequestedFor(urlEqualTo(EMAILS)));
    }

    private void assertFailure(String reason, boolean retryable) {
        assertThatThrownBy(() -> sender.send(EMAIL)).isInstanceOfSatisfying(DeliveryException.class, failure -> {
            assertThat(failure.reason()).isEqualTo(reason);
            assertThat(failure.retryable()).isEqualTo(retryable);
            assertThat(failure.getCause()).isNull();
        });
    }
}
