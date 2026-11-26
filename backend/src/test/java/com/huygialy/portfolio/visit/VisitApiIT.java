package com.huygialy.portfolio.visit;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.support.IntegrationTest;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * F1 of PF-005. Each test uses its own X-Forwarded-For address from 203.0.113.0/24 (the rate limiter is shared across
 * the context) and its own path, so its rows are found by path in the shared database.
 */
@IntegrationTest
class VisitApiIT {

    private static final String VISITS = "/api/v1/visits";
    private static final String FORWARDED_FOR = "X-Forwarded-For";
    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final String GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    private final RestTestClient client;
    private final JdbcTemplate jdbc;

    VisitApiIT(RestTestClient client, JdbcTemplate jdbc) {
        this.client = client;
        this.jdbc = jdbc;
    }

    @Test
    void aValidViewIsStoredWithDerivedValuesOnly() {
        final var path = "/work/visit-api-it-valid";
        final var ip = "203.0.113.10";
        final var body = Map.of("path", path, "referrer", "https://www.LinkedIn.com/feed/?trk=abc", "ref", "company-a");

        post(body, ip, CHROME).expectStatus().isAccepted().expectBody().isEmpty();

        final var rows = rows(path);
        assertThat(rows).hasSize(1);
        final var row = rows.getFirst();
        assertThat(row.get("referrer_host")).isEqualTo("www.linkedin.com");
        assertThat(row.get("ref_tag")).isEqualTo("company-a");
        assertThat((String) row.get("visitor_hash")).matches("^[0-9a-f]{64}$");
        assertThat(row.get("device_type")).isEqualTo("DESKTOP");
        assertThat(row.get("browser")).isEqualTo("Chrome");
        assertThat(row.get("viewed_at")).isNotNull();
        // The hash is pure hex (checked above) and could hold "feed" by chance, so it is left out of the substring
        // check.
        final var others = new HashMap<>(row);
        others.remove("visitor_hash");
        others.values().stream()
                .map(String::valueOf)
                .forEach(value -> assertThat(value).doesNotContain(ip, CHROME, "feed", "trk"));
    }

    /** No leading slash, and a NUL character, which PostgreSQL would reject on insert as a 500. */
    @ParameterizedTest
    @ValueSource(strings = {"work/visit-api-it-invalid-path", "/work/visit-api-it-invalid-path\u0000x"})
    void anInvalidPathIsRejectedWithAFieldError(String path) {
        post(Map.of("path", path), "203.0.113.11", CHROME)
                .expectStatus()
                .isBadRequest()
                .expectHeader()
                .contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("VALIDATION_FAILED")
                .jsonPath("$.errors[?(@.field == 'path')]")
                .exists();

        // Matched without the NUL, which PostgreSQL rejects in a query parameter too.
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM page_view WHERE path LIKE ?", Long.class, "%visit-api-it-invalid-path%"))
                .isZero();
    }

    @Test
    void aBodyOverTheJsonSizeCapIsRejectedBeforeValidation() {
        final var path = "/work/visit-api-it-oversized-" + "x".repeat(100_000);

        // No field errors: the parser stopped at the cap, so Bean Validation never saw the 100 KB path.
        post(Map.of("path", path), "203.0.113.14", CHROME)
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("VALIDATION_FAILED")
                .jsonPath("$.errors")
                .doesNotExist();
    }

    @Test
    void theBeaconsCrossOriginPreflightIsAccepted() {
        client.options()
                .uri(VISITS)
                .header(HttpHeaders.ORIGIN, "https://allowed.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,x-correlation-id")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://allowed.example")
                .expectHeader()
                .value(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        methods -> assertThat(methods).contains("POST"))
                .expectHeader()
                .value(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS,
                        headers -> assertThat(headers.toLowerCase(Locale.ROOT))
                                .contains("content-type", "x-correlation-id"));
    }

    @Test
    void anInvalidRefTagStoresTheViewWithoutTheTag() {
        final var path = "/work/visit-api-it-upper-ref";

        post(Map.of("path", path, "ref", "Company-A"), "203.0.113.12", CHROME)
                .expectStatus()
                .isAccepted();

        final var rows = rows(path);
        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().get("ref_tag")).isNull();
    }

    @Test
    void aViewWithGlobalPrivacyControlIsAcceptedAndNotStored() {
        final var path = "/work/visit-api-it-gpc";

        client.post()
                .uri(VISITS)
                .header(FORWARDED_FOR, "203.0.113.15")
                .header(HttpHeaders.USER_AGENT, CHROME)
                .header("Sec-GPC", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("path", path))
                .exchange()
                .expectStatus()
                .isAccepted();

        assertThat(rows(path)).isEmpty();
    }

    @Test
    void theHomePageIsATrackedPath() {
        post(Map.of("path", "/"), "203.0.113.17", CHROME).expectStatus().isAccepted();
    }

    @Test
    void aPathOutsideThePublicRoutesIsRejected() {
        post(Map.of("path", "/admin"), "203.0.113.16", CHROME)
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("VALIDATION_FAILED")
                .jsonPath("$.errors[?(@.field == 'path')]")
                .exists();
    }

    @Test
    void aBotViewIsAcceptedAndNotStored() {
        final var path = "/work/visit-api-it-bot";

        post(Map.of("path", path), "203.0.113.13", GOOGLEBOT).expectStatus().isAccepted();

        assertThat(rows(path)).isEmpty();
    }

    @Test
    void theThirtyFirstViewInAMinuteFromOneAddressIsRateLimited() {
        final var body = Map.of("path", "/work/visit-api-it-rate-limit");
        final var ip = "203.0.113.31";

        for (int i = 0; i < 30; i++) {
            post(body, ip, CHROME).expectStatus().isAccepted();
        }

        post(body, ip, CHROME)
                .expectStatus()
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
                .expectHeader()
                .valueMatches(HttpHeaders.RETRY_AFTER, "[1-9][0-9]*")
                .expectBody()
                .jsonPath("$.code")
                .isEqualTo("RATE_LIMITED");
    }

    private RestTestClient.ResponseSpec post(Map<String, String> body, String forwardedFor, String userAgent) {
        return client.post()
                .uri(VISITS)
                .header(FORWARDED_FOR, forwardedFor)
                .header(HttpHeaders.USER_AGENT, userAgent)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    private List<Map<String, Object>> rows(String path) {
        return jdbc.queryForList("SELECT * FROM page_view WHERE path = ?", path);
    }
}
