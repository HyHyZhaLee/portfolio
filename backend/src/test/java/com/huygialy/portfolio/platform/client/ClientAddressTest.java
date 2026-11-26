package com.huygialy.portfolio.platform.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class ClientAddressTest {

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "2001:db8:1:2::a|2001:db8:1:2::/64",
                "2001:db8:1:2:ffff::1|2001:db8:1:2::/64",
                "198.51.100.7|198.51.100.7",
                "unknown|unknown",
                "999.1.1.1|999.1.1.1",
                "abc.def|abc.def",
            })
    void normalizeCollapsesIpv6ToItsSlash64AndLeavesTheRest(String ip, String expected) {
        assertThat(ClientAddress.normalize(ip)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "198.51.100.7|198.51.100.0/24",
                "2001:db8:1:2::a|2001:db8:1::/48",
                "unknown|other",
                ".::1|other",
            })
    void maskKeepsOnlyACoarsePrefix(String entry, String expected) {
        assertThat(ClientAddress.mask(entry)).isEqualTo(expected);
    }

    /** The JDK resolves a colon string that starts with anything but a hex digit or a colon through DNS. */
    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {"2001:db8::1|true", "::1|true", ".::1|false", "zz::1|false", "198.51.100.7|false"})
    void onlyStringsTheJdkReadsAsALiteralReachInetAddress(String value, boolean expected) {
        assertThat(ClientAddress.isIpv6Candidate(value)).isEqualTo(expected);
    }
}
