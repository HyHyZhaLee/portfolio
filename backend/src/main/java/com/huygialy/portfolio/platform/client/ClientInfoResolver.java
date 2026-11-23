package com.huygialy.portfolio.platform.client;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

/**
 * The only class that reads a client's IP address and user agent (backend guide principle 9). It returns derived values
 * only. The client IP is the {@code X-Forwarded-For} entry the trusted proxy added, never a client-supplied one (FR-6).
 */
@Component
public class ClientInfoResolver {

    static final String FORWARDED_FOR = "X-Forwarded-For";
    private static final Logger log = LoggerFactory.getLogger(ClientInfoResolver.class);

    private final ClientProperties properties;
    private final VisitorHasher hasher;
    private final AtomicBoolean forwardedForLogged = new AtomicBoolean();

    public ClientInfoResolver(ClientProperties properties) {
        this.properties = properties;
        this.hasher = new VisitorHasher(properties.visitorHashSecret());
    }

    public ClientInfo resolve(HttpServletRequest request) {
        final var forwardedFor = request.getHeader(FORWARDED_FOR);
        logForwardedForOnce(forwardedFor);
        final var ip = clientIp(forwardedFor, request.getRemoteAddr(), properties.trustedProxyHops());
        final var userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        return new ClientInfo(
                hasher.hash(ip, userAgent),
                hasher.addressKey(ip),
                UserAgentParser.deviceType(userAgent),
                UserAgentParser.browser(userAgent),
                BotFilter.isBot(userAgent));
    }

    /**
     * Counting from the right, the entry at {@code trustedProxyHops}: each trusted proxy appends the address it saw, so
     * entries further left are whatever the client sent. With fewer entries, or no header, the connection's address.
     */
    static String clientIp(String forwardedFor, String remoteAddr, int trustedProxyHops) {
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return remoteAddr;
        }
        final var entries = Arrays.stream(forwardedFor.split(","))
                .map(String::strip)
                .filter(entry -> !entry.isEmpty())
                .toList();
        return entries.size() >= trustedProxyHops ? entries.get(entries.size() - trustedProxyHops) : remoteAddr;
    }

    /** PF-004 D3: the owner-approved, one-time look at the raw header on Render; off unless explicitly enabled. */
    private void logForwardedForOnce(String forwardedFor) {
        if (properties.logForwardedForOnce() && forwardedFor != null && firstForwardedForLog()) {
            log.warn(
                    "PF-004 D3 one-time check: X-Forwarded-For has {} entries: {}",
                    forwardedFor.split(",").length,
                    forwardedFor);
        }
    }

    private boolean firstForwardedForLog() {
        return forwardedForLogged.compareAndSet(false, true);
    }
}
