package com.huygialy.portfolio.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.context.annotation.Profile;
import org.springframework.validation.annotation.Validated;

/**
 * The Resend adapter's settings, bound only where the adapter runs: {@code @ConfigurationPropertiesScan} evaluates
 * {@code @Profile}, so the local profile starts without them. Elsewhere {@code apiKey} (env {@code RESEND_API_KEY}) and
 * {@code toEmail} (env {@code CONTACT_TO_EMAIL}) have no default and startup fails without them (PF-006 D14).
 * {@code fromEmail} (env {@code CONTACT_FROM_EMAIL}) defaults to Resend's shared test sender until a domain is verified.
 * {@code maxTries} and {@code backoff} bound the retry within one delivery attempt (PF-006 D3).
 */
@Validated
@Profile("!local")
@ConfigurationProperties("app.contact.resend")
public record ResendProperties(
        @NotBlank String apiKey,
        @NotBlank @Email String toEmail,

        @NotBlank @DefaultValue("Portfolio <onboarding@resend.dev>")
        String fromEmail,

        @NotBlank @DefaultValue("https://api.resend.com") String baseUrl,
        @NotNull @DefaultValue("2s") Duration connectTimeout,
        @NotNull @DefaultValue("5s") Duration readTimeout,
        @DefaultValue("3") @Min(1) @Max(5) int maxTries,
        @NotNull @DefaultValue("500ms") Duration backoff) {

    /** Never prints the API key or the recipient (Non-Negotiable 9). */
    @Override
    public String toString() {
        return "ResendProperties[baseUrl=" + baseUrl + ", maxTries=" + maxTries + "]";
    }
}
