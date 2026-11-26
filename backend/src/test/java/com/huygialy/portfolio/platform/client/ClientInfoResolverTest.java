package com.huygialy.portfolio.platform.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientInfoResolverTest {

    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "198.51.100.7|192.0.2.1|1|198.51.100.7",
                "203.0.113.9, 198.51.100.7|192.0.2.1|1|198.51.100.7",
                "203.0.113.9, 198.51.100.7|192.0.2.1|2|203.0.113.9",
                "198.51.100.7|192.0.2.1|2|192.0.2.1",
                "203.0.113.9, 198.51.100.7|192.0.2.1|3|192.0.2.1",
            })
    void clientIpCountsFromTheRight(String forwardedFor, String remoteAddr, int hops, String expected) {
        assertThat(ClientInfoResolver.clientIp(forwardedFor, remoteAddr, hops)).isEqualTo(expected);
    }

    @Test
    void clientIpWithoutHeaderIsRemoteAddress() {
        assertThat(ClientInfoResolver.clientIp(null, "192.0.2.1", 1)).isEqualTo("192.0.2.1");
    }

    @Test
    void sameIpAndUserAgentGiveTheSameHash() {
        final var first = resolve("s1", "198.51.100.7", CHROME).visitorHash();
        assertThat(first)
                .matches("[0-9a-f]{64}")
                .isEqualTo(resolve("s1", "198.51.100.7", CHROME).visitorHash());
    }

    @Test
    void differentIpUserAgentOrSecretGiveDifferentHashes() {
        final var base = resolve("s1", "198.51.100.7", CHROME).visitorHash();
        assertThat(resolve("s1", "203.0.113.9", CHROME).visitorHash()).isNotEqualTo(base);
        assertThat(resolve("s1", "198.51.100.7", CHROME + " X").visitorHash()).isNotEqualTo(base);
        assertThat(resolve("s2", "198.51.100.7", CHROME).visitorHash()).isNotEqualTo(base);
    }

    @Test
    void blankUserAgentIsABot() {
        assertThat(resolve("s1", "198.51.100.7", " ").bot()).isTrue();
        assertThat(resolve("s1", "198.51.100.7", CHROME).bot()).isFalse();
    }

    private static ClientInfo resolve(String secret, String ip, String userAgent) {
        final var request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.1");
        request.addHeader("X-Forwarded-For", ip);
        request.addHeader("User-Agent", userAgent);
        return new ClientInfoResolver(new ClientProperties(secret, 1)).resolve(request);
    }

    @Test
    void blankHeaderOrEmptyEntriesFallBackSensibly() {
        assertThat(ClientInfoResolver.clientIp("  ", "192.0.2.1", 1)).isEqualTo("192.0.2.1");
        assertThat(ClientInfoResolver.clientIp(" , 198.51.100.7", "192.0.2.1", 1))
                .isEqualTo("198.51.100.7");
    }

    @Test
    void missingUserAgentHashesLikeAnEmptyOne() {
        final var hasher = new VisitorHasher("s1");
        assertThat(hasher.hash("198.51.100.7", null)).isEqualTo(hasher.hash("198.51.100.7", ""));
    }

    @Test
    void rateLimitKeyIgnoresTheUserAgentButNotTheAddress() {
        final var base = resolve("s1", "198.51.100.7", CHROME);
        final var otherAgent = resolve("s1", "198.51.100.7", CHROME + " X");
        assertThat(otherAgent.rateLimitKey()).isEqualTo(base.rateLimitKey()).matches("[0-9a-f]{64}");
        assertThat(otherAgent.visitorHash()).isNotEqualTo(base.visitorHash());
        assertThat(resolve("s1", "203.0.113.9", CHROME).rateLimitKey()).isNotEqualTo(base.rateLimitKey());
    }

    @Test
    void probeLayoutMasksEntriesOnlyWhenTheProbeAddressIsPresent() {
        assertThat(ClientInfoResolver.probeLayout("192.0.2.1, 198.51.100.7"))
                .isEqualTo("2 entries: 192.0.2.0/24, 198.51.100.0/24");
        assertThat(ClientInfoResolver.probeLayout("198.51.100.7")).isNull();
        assertThat(ClientInfoResolver.probeLayout(null)).isNull();
    }

    @Test
    void globalPrivacyControlHeaderSetsGpc() {
        final var withGpc = new MockHttpServletRequest();
        withGpc.addHeader("Sec-GPC", "1");
        withGpc.addHeader("User-Agent", CHROME);
        final var without = new MockHttpServletRequest();
        without.addHeader("User-Agent", CHROME);
        final var resolver = new ClientInfoResolver(new ClientProperties("s1", 1));
        assertThat(resolver.resolve(withGpc).gpc()).isTrue();
        assertThat(resolver.resolve(without).gpc()).isFalse();
    }

    @Test
    void ipv6AddressesInOneSlash64ShareTheRateLimitKey() {
        final var first = resolve("s1", "2001:db8:1:2::a", CHROME).rateLimitKey();
        assertThat(resolve("s1", "2001:db8:1:2:ffff::1", CHROME).rateLimitKey()).isEqualTo(first);
        assertThat(resolve("s1", "2001:db8:1:2:ffff::1", CHROME).visitorHash())
                .isEqualTo(resolve("s1", "2001:db8:1:2::a", CHROME).visitorHash());
        assertThat(resolve("s1", "2001:db8:1:3::a", CHROME).rateLimitKey()).isNotEqualTo(first);
    }
}
