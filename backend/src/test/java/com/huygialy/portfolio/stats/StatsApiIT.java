package com.huygialy.portfolio.stats;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.support.IntegrationTest;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * S2 of PF-005. The test profile sets {@code app.stats.cache-ttl} to {@code 0s}, so the summary reads straight through.
 * The shared database holds other tests' rows, so each check compares the totals before and after its own views, sent
 * from addresses in 198.51.100.0/24 that no other test uses (the rate limiter and the visitor hashes stay its own).
 */
@IntegrationTest
class StatsApiIT {

    private static final String SUMMARY = "/api/v1/stats/summary";
    private static final String VISITS = "/api/v1/visits";
    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    private final RestTestClient client;
    private final JdbcTemplate jdbc;

    StatsApiIT(RestTestClient client, JdbcTemplate jdbc) {
        this.client = client;
        this.jdbc = jdbc;
    }

    @Test
    void twoViewsFromTwoNewAddressesAddTwoViewsAndTwoVisitors() {
        final var before = totals(summary());

        recordView("198.51.100.21");
        recordView("198.51.100.22");

        final var body = summary();
        final var after = totals(body);
        final var since = new AtomicReference<String>();
        body.jsonPath("$.since").isNotEmpty().jsonPath("$.since").value(String.class, since::set);

        assertThat(after.views()).isEqualTo(before.views() + 2);
        assertThat(after.visitors()).isEqualTo(before.visitors() + 2);
        // The first stored view may belong to another test; rows are append-only, so the earliest stays the earliest.
        final var firstView = jdbc.queryForObject("SELECT min(viewed_at) FROM page_view", OffsetDateTime.class);
        assertThat(firstView).isNotNull();
        assertThat(Instant.parse(since.get()).truncatedTo(ChronoUnit.MICROS))
                .isEqualTo(firstView.toInstant().truncatedTo(ChronoUnit.MICROS));
    }

    @Test
    void theSummaryIsPublicForTheAllowedOrigin() {
        client.get()
                .uri(SUMMARY)
                .header(HttpHeaders.ORIGIN, "https://allowed.example")
                .exchange()
                .expectStatus()
                .isOk()
                .expectHeader()
                .valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://allowed.example")
                .expectBody()
                .jsonPath("$.totalViews")
                .isNumber()
                .jsonPath("$.uniqueVisitors")
                .isNumber();
    }

    private RestTestClient.BodyContentSpec summary() {
        return client.get().uri(SUMMARY).exchange().expectStatus().isOk().expectBody();
    }

    private static Totals totals(RestTestClient.BodyContentSpec body) {
        final var views = new AtomicLong(-1);
        final var visitors = new AtomicLong(-1);
        body.jsonPath("$.totalViews")
                .isNumber()
                .jsonPath("$.uniqueVisitors")
                .isNumber()
                .jsonPath("$.totalViews")
                .value(Number.class, count -> views.set(count.longValue()))
                .jsonPath("$.uniqueVisitors")
                .value(Number.class, count -> visitors.set(count.longValue()));
        return new Totals(views.get(), visitors.get());
    }

    private void recordView(String forwardedFor) {
        client.post()
                .uri(VISITS)
                .header("X-Forwarded-For", forwardedFor)
                .header(HttpHeaders.USER_AGENT, CHROME)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("path", "/work/stats-api-it"))
                .exchange()
                .expectStatus()
                .isAccepted();
    }

    private record Totals(long views, long visitors) {}
}
