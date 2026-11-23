package com.huygialy.portfolio.platform.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.platform.client.ClientInfo.DeviceType;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class UserAgentParserTest {

    static Stream<Arguments> agents() {
        return Stream.of(
                Arguments.of(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        DeviceType.DESKTOP,
                        "Chrome"),
                Arguments.of(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
                        DeviceType.DESKTOP,
                        "Safari"),
                Arguments.of(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
                        DeviceType.DESKTOP,
                        "Firefox"),
                Arguments.of(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
                        DeviceType.DESKTOP,
                        "Edge"),
                Arguments.of(
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
                        DeviceType.MOBILE,
                        "Safari"),
                Arguments.of(
                        "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
                        DeviceType.TABLET,
                        "Safari"),
                Arguments.of(
                        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                        DeviceType.MOBILE,
                        "Chrome"),
                Arguments.of(
                        "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        DeviceType.TABLET,
                        "Chrome"),
                Arguments.of(
                        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
                        DeviceType.MOBILE,
                        "Samsung Internet"),
                Arguments.of(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
                        DeviceType.DESKTOP,
                        "Opera"),
                Arguments.of("Opera/9.80 (Windows NT 6.1) Presto/2.12.388 Version/12.16", DeviceType.DESKTOP, "Opera"),
                Arguments.of(
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15",
                        DeviceType.MOBILE,
                        "Firefox"),
                Arguments.of(
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
                        DeviceType.MOBILE,
                        "Chrome"),
                Arguments.of("Mozilla/5.0 (Tablet; rv:26.0) Gecko/26.0 Firefox/26.0", DeviceType.TABLET, "Firefox"),
                Arguments.of("Mozilla/5.0 (Mobile; rv:48.0) Gecko/48.0 Firefox/48.0", DeviceType.MOBILE, "Firefox"),
                Arguments.of("curl/8.4.0", DeviceType.DESKTOP, "Other"));
    }

    @org.junit.jupiter.api.Test
    void missingUserAgentIsADesktopWithAnOtherBrowser() {
        assertThat(UserAgentParser.deviceType(null)).isEqualTo(DeviceType.DESKTOP);
        assertThat(UserAgentParser.browser(null)).isEqualTo("Other");
    }

    @ParameterizedTest
    @MethodSource("agents")
    void derivesDeviceTypeAndBrowser(String userAgent, DeviceType deviceType, String browser) {
        assertThat(UserAgentParser.deviceType(userAgent)).isEqualTo(deviceType);
        assertThat(UserAgentParser.browser(userAgent)).isEqualTo(browser);
    }
}
