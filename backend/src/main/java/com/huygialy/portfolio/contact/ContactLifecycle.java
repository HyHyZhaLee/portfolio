package com.huygialy.portfolio.contact;

import com.huygialy.portfolio.contact.api.CreateContactMessageRequest;
import java.time.Clock;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * The transactional steps of the contact outbox, one short write transaction per method (PF-006 P6). They live on their
 * own bean because a call from {@link ContactCommandService} to itself would skip the transaction proxy (KNOWN-BE-006);
 * no transaction here ever spans the email send (Non-Negotiable 7).
 */
@Component
public class ContactLifecycle {

    private final ContactMessageRepository repository;
    private final Clock clock;

    public ContactLifecycle(ContactMessageRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** TX 1: inserts the message as {@code PENDING}, or {@code SPAM} when the honeypot is filled; detached after commit. */
    @Transactional
    public ContactMessageEntity savePending(CreateContactMessageRequest body, String senderHash) {
        return repository.save(ContactMessageEntity.receive(
                body.name(),
                body.email(),
                body.subject(),
                body.message(),
                body.website(),
                senderHash,
                clock.instant()));
    }

    /** TX 2 after a delivered attempt. */
    @Transactional
    public void markSent(long id, String providerId) {
        load(id).markSent(providerId, clock.instant());
    }

    /** TX 2 after a failed attempt; the retry job picks the row up. */
    @Transactional
    public void markFailed(long id, String reason) {
        load(id).markFailed(reason, clock.instant());
    }

    /** The retry job's claim: the claimed message as {@code PENDING} with its new attempt, or empty when another run won. */
    @Transactional
    public Optional<ContactMessageEntity> claimForRetry(long id, int seenAttempts) {
        return repository.claim(id, seenAttempts, clock.instant()) == 1 ? repository.findById(id) : Optional.empty();
    }

    private ContactMessageEntity load(long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalStateException("No contact message " + id));
    }
}
