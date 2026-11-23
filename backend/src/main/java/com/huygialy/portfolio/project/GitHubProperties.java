package com.huygialy.portfolio.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * The GitHub adapter's and the projects cache's settings (PF-007 P2). {@code username} (env {@code GITHUB_USERNAME}) is
 * the account whose public repositories are listed; {@code featured} (env {@code GITHUB_FEATURED}) are listed first, in
 * this order. {@code token} (env {@code GITHUB_TOKEN}) is optional in every profile: it only raises GitHub's rate limit
 * (PF-007 D8). {@code cacheTtl} is how long a successful result is served (zero: never served from the snapshot, as in
 * the test profile); {@code circuitOpenFor} is how long the circuit breaker stays open (PF-007 D9).
 */
@Validated
@ConfigurationProperties("app.github")
public record GitHubProperties(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9-]{1,39}") String username,
        String token,
        @NotNull @DefaultValue({}) List<@NotBlank String> featured,
        @NotBlank @DefaultValue("https://api.github.com") String baseUrl,
        @NotNull @DefaultValue("2s") Duration connectTimeout,
        @NotNull @DefaultValue("5s") Duration readTimeout,
        @NotNull @DefaultValue("1h") Duration cacheTtl,
        @NotNull @DefaultValue("10m") Duration circuitOpenFor) {

    /** True when a token is configured; a blank value (an empty {@code GITHUB_TOKEN}) means none. */
    public boolean hasToken() {
        return token != null && !token.isBlank();
    }

    /** Never prints the token (Non-Negotiable 9). */
    @Override
    public String toString() {
        return "GitHubProperties[username=" + username + ", featured=" + featured + ", baseUrl=" + baseUrl
                + ", hasToken=" + hasToken() + ", cacheTtl=" + cacheTtl + "]";
    }
}
