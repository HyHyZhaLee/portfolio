package com.huygialy.portfolio.platform.client;

/**
 * What callers may know about a client: derived values only. The IP address and the user agent never leave
 * {@link ClientInfoResolver} (Non-Negotiable 3). {@code visitorHash} identifies a visitor for counting;
 * {@code rateLimitKey} is an HMAC of the IP alone, so a visitor cannot reset a rate limit by changing the user agent.
 * {@code gpc} is true when the browser sent {@code Sec-GPC: 1}, the Global Privacy Control signal (PF-029 FR-10).
 */
public record ClientInfo(
        String visitorHash, String rateLimitKey, DeviceType deviceType, String browser, boolean bot, boolean gpc) {

    public enum DeviceType {
        DESKTOP,
        MOBILE,
        TABLET
    }
}
