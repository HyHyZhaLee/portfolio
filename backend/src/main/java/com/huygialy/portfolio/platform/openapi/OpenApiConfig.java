package com.huygialy.portfolio.platform.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * API metadata for springdoc. The fixed relative server stops springdoc from writing the request's host and port into
 * the document, so the committed snapshot ({@code openapi/openapi.json}) only changes when the API does.
 */
@Configuration(proxyBeanMethods = false)
class OpenApiConfig {

    @Bean
    OpenAPI portfolioOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Portfolio API")
                        .version("v1")
                        .description(
                                "Visit counting, contact messages, and public GitHub projects for the portfolio site."))
                .servers(List.of(new Server().url("/")));
    }
}
