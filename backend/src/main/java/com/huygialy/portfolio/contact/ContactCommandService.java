package com.huygialy.portfolio.contact;

import com.huygialy.portfolio.contact.EmailSender.DeliveryException;
import com.huygialy.portfolio.contact.EmailSender.Email;
import com.huygialy.portfolio.contact.api.CreateContactMessageRequest;
import com.huygialy.portfolio.platform.client.ClientInfo;
import com.huygialy.portfolio.platform.ratelimit.RateLimit;
import com.huygialy.portfolio.platform.ratelimit.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Accepts and delivers contact messages (PF-006 F1). Not transactional, so no transaction is open while the email is
 * sent (Non-Negotiable 7): each database step is one {@link ContactLifecycle} call. Logs carry message IDs, attempts,
 * and reason codes only, never the visitor's name, email, or message (Non-Negotiable 9).
 */
@Service
public class ContactCommandService {

    private static final Logger log = LoggerFactory.getLogger(ContactCommandService.class);

    private final RateLimiter rateLimiter;
    private final ContactLifecycle lifecycle;
    private final EmailSender emailSender;

    public ContactCommandService(RateLimiter rateLimiter, ContactLifecycle lifecycle, EmailSender emailSender) {
        this.rateLimiter = rateLimiter;
        this.lifecycle = lifecycle;
        this.emailSender = emailSender;
    }

    /**
     * F1: the client's rate limit first, spam included (429 {@code RATE_LIMITED}, D4); then, for a message that would be
     * emailed, the limit all clients share, so bots that fill the honeypot cannot lock real visitors out (PF-029 P4);
     * TX 1 saves the message; a honeypot hit returns with the same 202 and is never sent; otherwise one delivery
     * attempt. The visitor gets 202 once the message is saved, whatever the delivery outcome (D1).
     */
    public void submit(CreateContactMessageRequest body, ClientInfo client) {
        rateLimiter.check(RateLimit.CONTACT, client.rateLimitKey());
        if (!ContactMessageEntity.isHoneypotHit(body.website())) {
            rateLimiter.check(RateLimit.CONTACT_GLOBAL, RateLimit.GLOBAL_KEY);
        }
        final var message = lifecycle.savePending(body, client.visitorHash());
        if (message.isSpam()) {
            log.info("Contact message {} stored as spam, not sent", message.getId());
            return;
        }
        deliver(message);
    }

    /**
     * One delivery attempt of a {@code PENDING} message, shared by F1 and the retry job (F2): the send with no
     * transaction open, then TX 2 records {@code SENT} or {@code FAILED}. Never throws: a failure to record the outcome is
     * logged with the message ID and the row stays {@code PENDING} for the owner (D9).
     */
    void deliver(ContactMessageEntity message) {
        final var email = Email.from(message);
        try {
            sendAndRecord(email);
        } catch (RuntimeException e) {
            log.error(
                    "Contact message {} attempt {}: delivery outcome not recorded",
                    email.messageId(),
                    email.attempt(),
                    e);
        }
    }

    private void sendAndRecord(Email email) {
        final String providerId;
        try {
            providerId = emailSender.send(email);
        } catch (DeliveryException e) {
            log.warn("Contact message {} attempt {} not delivered: {}", email.messageId(), email.attempt(), e.reason());
            lifecycle.markFailed(email.messageId(), e.reason());
            return;
        }
        lifecycle.markSent(email.messageId(), providerId);
        log.info("Contact message {} sent on attempt {}", email.messageId(), email.attempt());
    }
}
