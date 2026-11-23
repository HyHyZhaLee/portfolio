package com.huygialy.portfolio.contact;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

/** Contact messages: inserted by {@link ContactLifecycle}, read and claimed by {@link ContactRetryJob} (PF-006 P7). */
public interface ContactMessageRepository extends JpaRepository<ContactMessageEntity, Long> {

    /** {@code FAILED} messages below the attempt limit, oldest first, with the attempts the claim compares against. */
    @Transactional(readOnly = true)
    @Query("select new com.huygialy.portfolio.contact.ContactMessageRepository$RetryCandidate(m.id, m.attempts)"
            + " from ContactMessageEntity m where m.status = FAILED and m.attempts < :maxAttempts order by m.id")
    List<RetryCandidate> findRetryCandidates(int maxAttempts, Limit limit);

    /**
     * The compare-and-set claim (backend guide principle 6): sets the row back to {@code PENDING} and counts the attempt
     * only while it is still {@code FAILED} with the attempts the caller read; returns the rows updated, 0 or 1. A bulk
     * update skips {@code @Version}'s automatic increment, so it bumps {@code version} itself, and a stale entity can
     * never overwrite a claim. Runs inside the caller's transaction.
     */
    @Modifying(clearAutomatically = true)
    @Query("update ContactMessageEntity m set m.status = PENDING, m.attempts = m.attempts + 1,"
            + " m.version = m.version + 1, m.updatedAt = :now"
            + " where m.id = :id and m.status = FAILED and m.attempts = :seenAttempts")
    int claim(long id, int seenAttempts, Instant now);

    /** A message the retry job may claim. */
    record RetryCandidate(long id, int attempts) {}
}
