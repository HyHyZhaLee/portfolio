package com.huygialy.portfolio.platform.client;

import com.huygialy.portfolio.platform.client.ClientInfo.DeviceType;

/**
 * Coarse device type and browser family from a user agent, with a few ordered rules and no library (PF-004 P10). Order
 * matters: Edge, Opera, and Samsung Internet also say "Chrome", and Chrome also says "Safari".
 */
public final class UserAgentParser {

    private UserAgentParser() {}

    public static DeviceType deviceType(String userAgent) {
        final var ua = userAgent == null ? "" : userAgent;
        if (ua.contains("iPad") || ua.contains("Tablet") || (ua.contains("Android") && !ua.contains("Mobile"))) {
            return DeviceType.TABLET;
        }
        if (ua.contains("Mobi") || ua.contains("iPhone") || ua.contains("Android")) {
            return DeviceType.MOBILE;
        }
        return DeviceType.DESKTOP;
    }

    public static String browser(String userAgent) {
        final var ua = userAgent == null ? "" : userAgent;
        if (ua.contains("Edg/")) {
            return "Edge";
        }
        if (ua.contains("OPR/") || ua.contains("Opera")) {
            return "Opera";
        }
        if (ua.contains("SamsungBrowser")) {
            return "Samsung Internet";
        }
        if (ua.contains("Firefox/") || ua.contains("FxiOS")) {
            return "Firefox";
        }
        if (ua.contains("Chrome/") || ua.contains("CriOS")) {
            return "Chrome";
        }
        if (ua.contains("Safari/")) {
            return "Safari";
        }
        return "Other";
    }
}
