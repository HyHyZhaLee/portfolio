package com.huygialy.portfolio.platform.client;

import java.util.regex.Pattern;

/** Flags user agents that look automated (SITE-002). A missing or blank user agent counts as a bot. */
public final class BotFilter {

    private static final Pattern BOT =
            Pattern.compile("bot|crawl|spider|slurp|preview|headless|lighthouse|monitor", Pattern.CASE_INSENSITIVE);

    private BotFilter() {}

    public static boolean isBot(String userAgent) {
        return userAgent == null
                || userAgent.isBlank()
                || BOT.matcher(userAgent).find();
    }
}
