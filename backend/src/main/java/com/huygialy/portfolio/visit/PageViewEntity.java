package com.huygialy.portfolio.visit;

import com.huygialy.portfolio.platform.client.ClientInfo.DeviceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * One stored page view. Append-only (FR-12): built only through {@link #record}, with no setters and no {@code @Version}
 * (backend guide principle 6). It holds derived values only, never an IP address, a user agent, or a full referrer URL
 * (Non-Negotiable 3).
 */
@Entity
@Table(name = "page_view")
public class PageViewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "viewed_at", nullable = false, updatable = false)
    private Instant viewedAt;

    @Column(name = "path", nullable = false, updatable = false, length = 255)
    private String path;

    @Column(name = "referrer_host", updatable = false, length = 255)
    private String referrerHost;

    @Column(name = "ref_tag", updatable = false, length = 64)
    private String refTag;

    @Column(name = "visitor_hash", nullable = false, updatable = false, length = 64)
    private String visitorHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, updatable = false, length = 16)
    private DeviceType deviceType;

    @Column(name = "browser", nullable = false, updatable = false, length = 32)
    private String browser;

    /** For JPA only. */
    protected PageViewEntity() {}

    private PageViewEntity(
            String path,
            String referrerHost,
            String refTag,
            String visitorHash,
            DeviceType deviceType,
            String browser,
            Instant viewedAt) {
        this.path = path;
        this.referrerHost = referrerHost;
        this.refTag = refTag;
        this.visitorHash = visitorHash;
        this.deviceType = deviceType;
        this.browser = browser;
        this.viewedAt = viewedAt;
    }

    /** The only way to build a view; {@code referrerHost} and {@code refTag} are already reduced or {@code null}. */
    public static PageViewEntity record(
            String path,
            String referrerHost,
            String refTag,
            String visitorHash,
            DeviceType deviceType,
            String browser,
            Instant viewedAt) {
        return new PageViewEntity(path, referrerHost, refTag, visitorHash, deviceType, browser, viewedAt);
    }

    public Long getId() {
        return id;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }

    public String getPath() {
        return path;
    }

    public String getReferrerHost() {
        return referrerHost;
    }

    public String getRefTag() {
        return refTag;
    }

    public String getVisitorHash() {
        return visitorHash;
    }

    public DeviceType getDeviceType() {
        return deviceType;
    }

    public String getBrowser() {
        return browser;
    }
}
