package com.huygialy.portfolio.contact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

/**
 * One contact message in the outbox (PF-006 P2). Built only through {@link #receive}; its status changes only through
 * the guarded {@link #markSent} and {@link #markFailed} (and the repository's compare-and-set claim). {@code @Version}
 * guards it, because the request path and the retry job both write rows (backend guide principle 6). {@code toString} is
 * {@code Object}'s, so the visitor's name, email, and message never print (Non-Negotiable 9).
 */
@Entity
@Table(name = "contact_message")
public class ContactMessageEntity {

    static final int LAST_ERROR_LENGTH = 64;
    static final int PROVIDER_ID_LENGTH = 100;

    /** The outbox states; {@code SENT} and {@code SPAM} are final. */
    public enum Status {
        PENDING,
        SENT,
        FAILED,
        SPAM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "name", nullable = false, updatable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, updatable = false, length = 254)
    private String email;

    @Column(name = "message", nullable = false, updatable = false, length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private Status status;

    @Column(name = "attempts", nullable = false)
    private int attempts;

    @Column(name = "last_error", length = LAST_ERROR_LENGTH)
    private String lastError;

    @Column(name = "provider_message_id", length = PROVIDER_ID_LENGTH)
    private String providerMessageId;

    @Column(name = "sender_hash", nullable = false, updatable = false, length = 64)
    private String senderHash;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    /** For JPA only. */
    protected ContactMessageEntity() {}

    private ContactMessageEntity(
            String name, String email, String message, Status status, int attempts, String senderHash, Instant now) {
        this.name = name;
        this.email = email;
        this.message = message;
        this.status = status;
        this.attempts = attempts;
        this.senderHash = senderHash;
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * The only way to build a message: {@code PENDING} with attempt 1 (the request's own attempt) or, when the honeypot
     * is filled, {@code SPAM} with no attempt, never sent (SITE-004).
     */
    public static ContactMessageEntity receive(
            String name, String email, String message, String honeypot, String senderHash, Instant now) {
        final var spam = honeypot != null && !honeypot.isBlank();
        return new ContactMessageEntity(
                name, email, message, spam ? Status.SPAM : Status.PENDING, spam ? 0 : 1, senderHash, now);
    }

    /** {@code PENDING} → {@code SENT}; the provider's ID may be {@code null} and is cut to its column. */
    public void markSent(String providerId, Instant now) {
        requirePending("mark sent");
        this.status = Status.SENT;
        this.providerMessageId = cut(providerId, PROVIDER_ID_LENGTH);
        this.lastError = null;
        this.updatedAt = now;
    }

    /** {@code PENDING} → {@code FAILED} with a reason code, cut to its column. */
    public void markFailed(String reason, Instant now) {
        requirePending("mark failed");
        this.status = Status.FAILED;
        this.lastError = cut(reason, LAST_ERROR_LENGTH);
        this.updatedAt = now;
    }

    public boolean isSpam() {
        return status == Status.SPAM;
    }

    private void requirePending(String action) {
        if (status != Status.PENDING) {
            throw new IllegalStateException("Cannot " + action + " contact message " + id + " in status " + status);
        }
    }

    private static String cut(String value, int length) {
        return value == null || value.length() <= length ? value : value.substring(0, length);
    }

    public Long getId() {
        return id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }

    public Status getStatus() {
        return status;
    }

    public int getAttempts() {
        return attempts;
    }

    public String getLastError() {
        return lastError;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public String getSenderHash() {
        return senderHash;
    }
}
