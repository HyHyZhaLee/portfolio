package com.huygialy.portfolio.project;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig.SlidingWindowType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The circuit breaker around the GitHub call (PF-007 P6, D9): it opens when 2 of the last 4 calls failed (at least 2
 * calls), stays open for {@code app.github.circuit-open-for}, then lets one trial call through. It is a bean so the
 * integration tests can reset it between tests. The core module starts no thread: the open state ends on the next call.
 */
@Configuration(proxyBeanMethods = false)
public class ProjectConfig {

    @Bean
    public CircuitBreaker gitHubCircuitBreaker(GitHubProperties properties) {
        return CircuitBreaker.of(
                "github",
                CircuitBreakerConfig.custom()
                        .slidingWindowType(SlidingWindowType.COUNT_BASED)
                        .slidingWindowSize(4)
                        .minimumNumberOfCalls(2)
                        .failureRateThreshold(50)
                        .waitDurationInOpenState(properties.circuitOpenFor())
                        .permittedNumberOfCallsInHalfOpenState(1)
                        .build());
    }
}
