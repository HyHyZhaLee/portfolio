package com.huygialy.portfolio.contact;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.context.annotation.Configuration;

/**
 * The contact settings as {@code @ConfigurationPropertiesScan} binds them (PF-006 P13, D14): the local profile starts
 * without the Resend settings, and any other profile fails without the key or the recipient. Unit test: no application
 * context beyond the properties.
 */
class ContactPropertiesTest {

    private static final String KEY = "app.contact.resend.api-key=re_synthetic_key";
    private static final String RECIPIENT = "app.contact.resend.to-email=owner@example.com";

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class, ValidationAutoConfiguration.class))
            .withUserConfiguration(ScanConfig.class);

    @Test
    void theLocalProfileStartsWithoutResendSettingsAndAppliesTheRetryDefaults() {
        runner.withPropertyValues("spring.profiles.active=local").run(context -> {
            assertThat(context).hasNotFailed().doesNotHaveBean(ResendProperties.class);
            final var contact = context.getBean(ContactProperties.class);
            assertThat(contact.retryEnabled()).isTrue();
            assertThat(contact.maxAttempts()).isEqualTo(3);
            assertThat(contact.retryBatchSize()).isEqualTo(10);
        });
    }

    @Test
    void anotherProfileFailsWithoutTheApiKey() {
        runner.withPropertyValues("spring.profiles.active=prod", RECIPIENT)
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void anotherProfileFailsWithoutTheRecipient() {
        runner.withPropertyValues("spring.profiles.active=prod", KEY)
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void anotherProfileWithTheKeyAndRecipientAppliesTheResendDefaults() {
        runner.withPropertyValues("spring.profiles.active=prod", KEY, RECIPIENT).run(context -> {
            assertThat(context).hasNotFailed();
            final var resend = context.getBean(ResendProperties.class);
            assertThat(resend.fromEmail()).isEqualTo("Portfolio <onboarding@resend.dev>");
            assertThat(resend.baseUrl()).isEqualTo("https://api.resend.com");
            assertThat(resend.connectTimeout()).isEqualTo(Duration.ofSeconds(2));
            assertThat(resend.readTimeout()).isEqualTo(Duration.ofSeconds(5));
            assertThat(resend.maxTries()).isEqualTo(3);
            assertThat(resend.backoff()).isEqualTo(Duration.ofMillis(500));
            assertThat(resend.toString()).doesNotContain("re_synthetic_key", "owner@example.com");
        });
    }

    @Configuration(proxyBeanMethods = false)
    @ConfigurationPropertiesScan("com.huygialy.portfolio.contact")
    static class ScanConfig {}
}
