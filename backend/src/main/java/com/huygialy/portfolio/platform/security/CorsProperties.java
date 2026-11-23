package com.huygialy.portfolio.platform.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Origins allowed to call the API from a browser (env {@code ALLOWED_ORIGINS}, comma-separated; origin patterns such as
 * {@code https://*.example.com} are allowed). No default outside the local profile, so a deploy without it fails at
 * startup.
 */
@Validated
@ConfigurationProperties("app.cors")
public record CorsProperties(@NotEmpty List<@NotBlank String> allowedOrigins) {}
