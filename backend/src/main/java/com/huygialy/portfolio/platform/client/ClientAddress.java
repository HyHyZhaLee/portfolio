package com.huygialy.portfolio.platform.client;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Pattern;

/**
 * Pure helpers for a client address taken from {@code X-Forwarded-For} (PF-029 P2, P3). Only string literals that look
 * like an address are parsed, so {@link InetAddress} never performs a DNS lookup on whatever a client sent.
 */
final class ClientAddress {

    private static final Pattern IPV4 = Pattern.compile("(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})");
    /**
     * An IPv6 literal's characters, including a dotted IPv4 tail; a zone ID or a host name never matches. It must start
     * with a hex digit or a colon: the JDK treats only such a string as a literal, and resolves any other one, such as
     * {@code .::1}, through DNS.
     */
    private static final Pattern IPV6_CHARS = Pattern.compile("[0-9A-Fa-f:][0-9A-Fa-f:.]{1,44}");

    private ClientAddress() {}

    /**
     * An IPv6 address reduced to its /64 prefix, written as {@code 2001:db8:1:2::/64}, so the rotating addresses one
     * household gets from its prefix count as one client for hashing and rate limits (FR-7). IPv4 and anything that is
     * not an address literal come back unchanged.
     */
    static String normalize(String ip) {
        final var address = parse(ip);
        if (address instanceof Inet6Address v6) {
            return prefix(v6.getAddress(), 4) + "::/64";
        }
        return ip;
    }

    /**
     * One {@code X-Forwarded-For} entry masked for the PF-029 probe log, never the raw address (Non-Negotiable 3): IPv4
     * to its /24 ({@code 198.51.100.0/24}), IPv6 to its /48 ({@code 2001:db8:1::/48}), anything else {@code other}.
     */
    static String mask(String entry) {
        final var address = parse(entry.strip());
        if (address instanceof Inet6Address v6) {
            return prefix(v6.getAddress(), 3) + "::/48";
        }
        if (address != null) {
            final var bytes = address.getAddress();
            return (bytes[0] & 0xff) + "." + (bytes[1] & 0xff) + "." + (bytes[2] & 0xff) + ".0/24";
        }
        return "other";
    }

    /**
     * IPv4 is parsed by hand, because {@link InetAddress#getByName} falls back to a DNS lookup for a dotted string it
     * cannot read (such as {@code 999.1.1.1}). A string with a colon is parsed as an IPv6 literal, which the JDK never
     * resolves through DNS: it either parses or throws.
     */
    private static InetAddress parse(String value) {
        if (value == null) {
            return null;
        }
        final var v4 = IPV4.matcher(value);
        if (v4.matches()) {
            final var bytes = new byte[4];
            for (var i = 0; i < 4; i++) {
                final var octet = Integer.parseInt(v4.group(i + 1));
                if (octet > 255) {
                    return null;
                }
                bytes[i] = (byte) octet;
            }
            return toAddress(bytes);
        }
        if (!isIpv6Candidate(value)) {
            return null;
        }
        try {
            return InetAddress.getByName(value);
        } catch (UnknownHostException e) {
            return null;
        }
    }

    /** True only for a string the JDK parses as an IPv6 literal without a DNS lookup (see {@link #IPV6_CHARS}). */
    static boolean isIpv6Candidate(String value) {
        return value.indexOf(':') >= 0 && IPV6_CHARS.matcher(value).matches();
    }

    private static InetAddress toAddress(byte[] bytes) {
        try {
            return InetAddress.getByAddress(bytes);
        } catch (UnknownHostException e) {
            return null;
        }
    }

    /** The first {@code hextets} 16-bit groups of an IPv6 address in lower-case hex, joined by colons. */
    private static String prefix(byte[] bytes, int hextets) {
        final var groups = new StringBuilder();
        for (var i = 0; i < hextets; i++) {
            if (i > 0) {
                groups.append(':');
            }
            groups.append(Integer.toHexString(((bytes[2 * i] & 0xff) << 8) | (bytes[2 * i + 1] & 0xff)));
        }
        return groups.toString();
    }
}
