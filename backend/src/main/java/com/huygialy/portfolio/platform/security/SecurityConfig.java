package com.huygialy.portfolio.platform.security;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Stateless security chain: no sessions, cookies, or logins. Only the paths listed here are reachable; everything
 * else is denied. PF-004 adds CORS, the API endpoints, and the rate-limit filter to this chain.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

    private static final String HEALTH_PATH = "/actuator/health";
    private static final String[] PUBLIC_GET_PATHS = {
        HEALTH_PATH, "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**"
    };

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        return http.csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(requests -> requests
                        // Spring Security also authorizes the /error dispatch; denying it would turn every 404 or 500
                        // on a public path into an empty 403.
                        .dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS)
                        .permitAll()
                        // Uptime monitors may probe with HEAD.
                        .requestMatchers(HttpMethod.HEAD, HEALTH_PATH)
                        .permitAll()
                        .anyRequest()
                        .denyAll())
                .build();
    }
}
