package com.huygialy.portfolio.platform.client;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * How client info is derived. {@code visitorHashSecret} (env {@code VISITOR_HASH_SECRET}) has no default outside the
 * local profile. {@code trustedProxyHops} (env {@code TRUSTED_PROXY_HOPS}) is how many {@code X-Forwarded-For} entries,
 * counted from the right, trusted proxies added. {@code toString} never prints the secret.
 */
@Validated
@ConfigurationProperties("app.client")
public record ClientProperties(
        @NotBlank String visitorHashSecret,
        @DefaultValue("1") @Min(1) int trustedProxyHops) {

    @Override
    public String toString() {
        return "ClientProperties[visitorHashSecret=redacted, trustedProxyHops=" + trustedProxyHops + "]";
    }
}
