package com.huygialy.portfolio.platform.web;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration(proxyBeanMethods = false)
class WebConfig {

    /** First in line, before the security chain, so even a security 404 carries the correlation ID. */
    @Bean
    FilterRegistrationBean<CorrelationIdFilter> correlationIdFilter() {
        final var registration = new FilterRegistrationBean<>(new CorrelationIdFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
