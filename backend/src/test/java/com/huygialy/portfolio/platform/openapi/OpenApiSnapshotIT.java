package com.huygialy.portfolio.platform.openapi;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.support.IntegrationTest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.client.RestTestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Writes the API contract to {@code backend/openapi/openapi.json}, the snapshot the frontend generates its types from.
 * {@code make openapi} runs it; CI regenerates the snapshot and fails when it differs from the committed one.
 */
@IntegrationTest
class OpenApiSnapshotIT {

    private static final Path SNAPSHOT = Path.of("openapi", "openapi.json"); // Gradle runs tests from backend/

    private final RestTestClient client;
    private final JsonMapper jsonMapper;

    OpenApiSnapshotIT(RestTestClient client, JsonMapper jsonMapper) {
        this.client = client;
        this.jsonMapper = jsonMapper;
    }

    @Test
    void writesTheOpenApiSnapshot() throws IOException {
        final var body = client.get()
                .uri("/v3/api-docs")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        final JsonNode document = jsonMapper.readTree(body);
        assertThat(document.path("servers").path(0).path("url").asString()).isEqualTo("/");

        Files.createDirectories(SNAPSHOT.getParent());
        Files.writeString(
                SNAPSHOT,
                jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(document) + "\n",
                StandardCharsets.UTF_8);
    }

    @Test
    void servesSwaggerUi() {
        client.get().uri("/swagger-ui/index.html").exchange().expectStatus().isOk();
    }
}
