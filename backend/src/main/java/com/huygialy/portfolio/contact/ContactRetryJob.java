package com.huygialy.portfolio.contact;

import com.huygialy.portfolio.platform.web.CorrelationIdFilter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Limit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Resends {@code FAILED} contact messages (PF-006 F2). It takes its work from the current state and claims each message
 * with a compare-and-set, never a scheduler lock, so every instance may run it at once (backend guide principle 6). One
 * batch per run spaces a message's attempts about 10 minutes apart, and the claim counts the attempt before the send,
 * so a message gets at most {@code app.contact.max-attempts} in total (D2).
 */
@Component
public class ContactRetryJob {

    private static final Logger log = LoggerFactory.getLogger(ContactRetryJob.class);

    private final ContactProperties properties;
    private final ContactMessageRepository repository;
    private final ContactLifecycle lifecycle;
    private final ContactCommandService commandService;

    public ContactRetryJob(
            ContactProperties properties,
            ContactMessageRepository repository,
            ContactLifecycle lifecycle,
            ContactCommandService commandService) {
        this.properties = properties;
        this.repository = repository;
        this.lifecycle = lifecycle;
        this.commandService = commandService;
    }

    /** Every 10 minutes, first 1 minute after startup; returns at once when {@code app.contact.retry-enabled} is off. */
    @Scheduled(fixedDelay = 10, initialDelay = 1, timeUnit = TimeUnit.MINUTES)
    void scheduledRun() {
        if (!properties.retryEnabled()) {
            return;
        }
        // Each run has its own correlation ID in the logging context (backend guide principle 13).
        MDC.put(CorrelationIdFilter.MDC_KEY, UUID.randomUUID().toString());
        try {
            retryFailed();
        } finally {
            MDC.remove(CorrelationIdFilter.MDC_KEY);
        }
    }

    /**
     * One batch: claims each candidate and delivers each claimed message through the same path as a new message. A
     * row's failure is logged with its ID and the batch continues.
     *
     * @return the number of messages claimed
     */
    int retryFailed() {
        final var candidates =
                repository.findRetryCandidates(properties.maxAttempts(), Limit.of(properties.retryBatchSize()));
        var claimed = 0;
        for (final var candidate : candidates) {
            try {
                final var message = lifecycle.claimForRetry(candidate.id(), candidate.attempts());
                if (message.isPresent()) {
                    claimed++;
                    commandService.deliver(message.get());
                }
            } catch (RuntimeException e) {
                log.error("Contact message {} retry failed", candidate.id(), e);
            }
        }
        log.info("Contact retry run: {} candidates, {} claimed", candidates.size(), claimed);
        return claimed;
    }
}
