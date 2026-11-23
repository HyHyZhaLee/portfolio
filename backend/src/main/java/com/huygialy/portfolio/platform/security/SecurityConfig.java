package com.huygialy.portfolio.platform.security;

import com.huygialy.portfolio.platform.web.CorrelationIdFilter;
import jakarta.servlet.DispatcherType;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Stateless security chain: no sessions, cookies, or logins. Only the paths listed here are reachable; any other path or
 * method is routed to {@code GlobalExceptionHandler}, which answers 404 {@code NOT_FOUND} (PF-004 D4). CORS allows only
 * the configured origins; a cross-origin request from any other origin gets Spring's plain 403 (PF-004 D5).
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

    private static final String HEALTH_PATH = "/actuator/health";
    private static final String[] PUBLIC_GET_PATHS = {
        HEALTH_PATH, "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**", "/api/v1/stats/summary"
    };
    /** Public write endpoints; each has Bean Validation and a per-client rate limit (Non-Negotiable 4). */
    private static final String[] PUBLIC_POST_PATHS = {"/api/v1/visits", "/api/v1/contact-messages"};

    private final HandlerExceptionResolver exceptionResolver;

    SecurityConfig(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver) {
        this.exceptionResolver = exceptionResolver;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(denials -> denials.authenticationEntryPoint((request, response, ex) ->
                                exceptionResolver.resolveException(request, response, null, ex))
                        .accessDeniedHandler((request, response, ex) ->
                                exceptionResolver.resolveException(request, response, null, ex)))
                .authorizeHttpRequests(requests -> requests
                        // Spring Security also authorizes the /error dispatch; denying it would hide the real status.
                        .dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS)
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_POST_PATHS)
                        .permitAll()
                        // Uptime monitors may probe with HEAD.
                        .requestMatchers(HttpMethod.HEAD, HEALTH_PATH)
                        .permitAll()
                        .anyRequest()
                        .denyAll())
                .build();
    }

    /** Picked up by {@code cors(withDefaults())}; preflights are answered before authorization. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties cors) {
        final var config = new CorsConfiguration();
        config.setAllowedOriginPatterns(cors.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "HEAD", "POST"));
        config.setAllowedHeaders(List.of(HttpHeaders.CONTENT_TYPE, CorrelationIdFilter.HEADER));
        config.setExposedHeaders(List.of(CorrelationIdFilter.HEADER, HttpHeaders.RETRY_AFTER));
        config.setAllowCredentials(false);
        config.setMaxAge(Duration.ofHours(1));
        final var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
