package com.huygialy.portfolio.platform.client;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * {@code HMAC-SHA256(secret, ip + "|" + userAgent)} as 64 lowercase hex characters (product guide glossary), and the
 * rate-limit key {@code HMAC-SHA256(secret, ip)}.
 */
public final class VisitorHasher {

    private static final String ALGORITHM = "HmacSHA256";
    private final SecretKeySpec key;

    public VisitorHasher(String secret) {
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
    }

    /** A missing user agent hashes as an empty one. A new {@code Mac} per call, because {@code Mac} is not thread-safe. */
    public String hash(String ip, String userAgent) {
        return hmac(ip + "|" + (userAgent == null ? "" : userAgent));
    }

    /** The client address alone, for rate limits: a changed user agent keeps the same key. */
    public String addressKey(String ip) {
        return hmac(ip);
    }

    private String hmac(String input) {
        try {
            final var mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException unavailable) {
            throw new IllegalStateException("HmacSHA256 is not available", unavailable);
        }
    }
}
