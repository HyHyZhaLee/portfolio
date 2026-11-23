package com.huygialy.portfolio.support;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

/**
 * One WireMock server on a dynamic port that stands in for every external HTTP provider (backend guide principle 14):
 * Resend in PF-006. Integration tests inject {@link WireMockServer} through the constructor and call {@code resetAll()}
 * before each test. An unmatched request gets WireMock's 404, so a missing stub fails loudly and nothing reaches the
 * internet.
 */
@TestConfiguration(proxyBeanMethods = false)
public class WireMockSupport {

    @Bean(initMethod = "start", destroyMethod = "stop")
    WireMockServer wireMockServer() {
        return new WireMockServer(WireMockConfiguration.options().dynamicPort());
    }

    @Bean
    DynamicPropertyRegistrar wireMockProperties(WireMockServer wireMockServer) {
        return registry -> registry.add("app.contact.resend.base-url", wireMockServer::baseUrl);
    }
}
