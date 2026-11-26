package com.huygialy.portfolio.platform;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.platform.client.ClientProperties;
import com.huygialy.portfolio.platform.security.CorsProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.context.annotation.Configuration;

class PlatformPropertiesTest {

    private static final String ORIGINS = "app.cors.allowed-origins=https://example.test";
    private static final String SECRET = "app.client.visitor-hash-secret=synthetic-secret";

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class, ValidationAutoConfiguration.class))
            .withUserConfiguration(PropertiesConfig.class);

    @Test
    void startsWithBothRequiredPropertiesAndAppliesDefaults() {
        runner.withPropertyValues(ORIGINS, SECRET).run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBean(CorsProperties.class).allowedOrigins()).containsExactly("https://example.test");
            final var client = context.getBean(ClientProperties.class);
            assertThat(client.visitorHashSecret()).isEqualTo("synthetic-secret");
            assertThat(client.trustedProxyHops()).isEqualTo(1);
        });
    }

    @Test
    void failsWithoutAllowedOrigins() {
        runner.withPropertyValues(SECRET).run(context -> assertThat(context).hasFailed());
    }

    @Test
    void failsWithoutVisitorHashSecret() {
        runner.withPropertyValues(ORIGINS).run(context -> assertThat(context).hasFailed());
    }

    @Test
    void clientPropertiesToStringNeverPrintsTheSecret() {
        runner.withPropertyValues(ORIGINS, SECRET)
                .run(context -> assertThat(
                                context.getBean(ClientProperties.class).toString())
                        .doesNotContain("synthetic-secret"));
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties({CorsProperties.class, ClientProperties.class})
    static class PropertiesConfig {}
}
