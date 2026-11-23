package com.huygialy.portfolio.platform.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class BotFilterTest {

    @ParameterizedTest
    @ValueSource(
            strings = {
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Linux; Android 11) Chrome/119.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
                "   ",
            })
    @NullAndEmptySource
    void flagsAutomatedOrMissingUserAgents(String userAgent) {
        assertThat(BotFilter.isBot(userAgent)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
            })
    void letsBrowsersThrough(String userAgent) {
        assertThat(BotFilter.isBot(userAgent)).isFalse();
    }
}
