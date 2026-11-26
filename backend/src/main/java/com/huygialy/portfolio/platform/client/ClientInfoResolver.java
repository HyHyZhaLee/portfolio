package com.huygialy.portfolio.platform.client;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

/**
 * The only class that reads a client's IP address and user agent (backend guide principle 9). It returns derived values
 * only. The client IP is the {@code X-Forwarded-For} entry the trusted proxy added, never a client-supplied one (FR-6),
 * and an IPv6 address counts by its /64 prefix (PF-029 P3). No raw address is ever logged (Non-Negotiable 3).
 */
@Component
public class ClientInfoResolver {

    static final String FORWARDED_FOR = "X-Forwarded-For";
    static final String GLOBAL_PRIVACY_CONTROL = "Sec-GPC";
    /**
     * PF-029 P2: a request whose {@code X-Forwarded-For} carries this documentation address (RFC 5737) logs the header's
     * layout, every entry masked, so the owner can see which entry Render's proxy appends without logging a raw address.
     */
    static final String PROBE_MARKER = "192.0.2.1";

    private static final Logger log = LoggerFactory.getLogger(ClientInfoResolver.class);

    private final ClientProperties properties;
    private final VisitorHasher hasher;

    public ClientInfoResolver(ClientProperties properties) {
        this.properties = properties;
        this.hasher = new VisitorHasher(properties.visitorHashSecret());
    }

    public ClientInfo resolve(HttpServletRequest request) {
        final var forwardedFor = request.getHeader(FORWARDED_FOR);
        logProbe(forwardedFor);
        final var ip =
                ClientAddress.normalize(clientIp(forwardedFor, request.getRemoteAddr(), properties.trustedProxyHops()));
        final var userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        return new ClientInfo(
                hasher.hash(ip, userAgent),
                hasher.addressKey(ip),
                UserAgentParser.deviceType(userAgent),
                UserAgentParser.browser(userAgent),
                BotFilter.isBot(userAgent),
                "1".equals(request.getHeader(GLOBAL_PRIVACY_CONTROL)));
    }

    /**
     * Counting from the right, the entry at {@code trustedProxyHops}: each trusted proxy appends the address it saw, so
     * entries further left are whatever the client sent. With fewer entries, or no header, the connection's address.
     */
    static String clientIp(String forwardedFor, String remoteAddr, int trustedProxyHops) {
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return remoteAddr;
        }
        final var entries = entries(forwardedFor);
        return entries.size() >= trustedProxyHops ? entries.get(entries.size() - trustedProxyHops) : remoteAddr;
    }

    /** The masked layout of a header that carries {@link #PROBE_MARKER}, or {@code null} for any other header. */
    static String probeLayout(String forwardedFor) {
        if (forwardedFor == null) {
            return null;
        }
        final var entries = entries(forwardedFor);
        if (!entries.contains(PROBE_MARKER)) {
            return null;
        }
        return entries.size() + " entries: "
                + entries.stream().map(ClientAddress::mask).collect(Collectors.joining(", "));
    }

    private static void logProbe(String forwardedFor) {
        final var layout = probeLayout(forwardedFor);
        if (layout != null) {
            log.info("Forwarded-for probe (PF-029): X-Forwarded-For has {}", layout);
        }
    }

    private static List<String> entries(String forwardedFor) {
        return Arrays.stream(forwardedFor.split(","))
                .map(String::strip)
                .filter(entry -> !entry.isEmpty())
                .toList();
    }
}
