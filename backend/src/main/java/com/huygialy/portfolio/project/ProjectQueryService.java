package com.huygialy.portfolio.project;

import com.huygialy.portfolio.project.GitHubClient.GitHubException;
import com.huygialy.portfolio.project.GitHubClient.GitHubRepo;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * The repositories the site lists (SITE-005, PF-007 F1). A successful result is served for {@code app.github.cache-ttl};
 * after that one caller at a time refreshes it through the circuit breaker, and when GitHub fails or the circuit is open
 * the last good result is served, else an empty list, so the endpoint never fails because of GitHub. A
 * {@link ReentrantLock} guards the refresh instead of a cache loader, because a loader runs inside a {@code synchronized}
 * map bin, which pins a virtual thread's carrier on Java 21 for the whole GitHub call (PF-007 P7).
 */
@Service
public class ProjectQueryService {

    private static final Logger log = LoggerFactory.getLogger(ProjectQueryService.class);

    private final GitHubClient gitHubClient;
    private final CircuitBreaker circuitBreaker;
    private final Clock clock;
    private final String username;
    private final List<String> featured;
    private final Duration cacheTtl;
    private final ReentrantLock refreshLock = new ReentrantLock();
    /** The last good result; {@code null} until the first success since the start. */
    private volatile Snapshot lastGood;

    public ProjectQueryService(
            GitHubClient gitHubClient, CircuitBreaker gitHubCircuitBreaker, GitHubProperties properties, Clock clock) {
        this.gitHubClient = gitHubClient;
        this.circuitBreaker = gitHubCircuitBreaker;
        this.clock = clock;
        this.username = properties.username();
        this.featured = List.copyOf(properties.featured());
        this.cacheTtl = properties.cacheTtl();
    }

    /** The listed repositories, featured first; never throws because of GitHub. */
    public List<GitHubRepo> list() {
        final var snapshot = lastGood;
        if (isFresh(snapshot)) {
            return snapshot.repos();
        }
        refreshLock.lock();
        try {
            final var current = lastGood;
            if (isFresh(current)) {
                return current.repos(); // another caller refreshed it while this one waited
            }
            return refresh(current);
        } finally {
            refreshLock.unlock();
        }
    }

    private List<GitHubRepo> refresh(Snapshot previous) {
        try {
            final var repos = circuitBreaker.executeSupplier(
                    () -> RepositoryFilter.select(gitHubClient.listPublicRepositories(username), featured));
            lastGood = new Snapshot(repos, clock.instant());
            log.debug("Listed {} public GitHub repositories", repos.size());
            return repos;
        } catch (GitHubException e) {
            return fallback(e.reason(), previous);
        } catch (CallNotPermittedException e) {
            return fallback("CIRCUIT_OPEN", previous);
        }
    }

    private static List<GitHubRepo> fallback(String reason, Snapshot previous) {
        log.warn(
                "GitHub repositories unavailable ({}), serving {}",
                reason,
                previous == null ? "an empty list" : "the last good result");
        return previous == null ? List.of() : previous.repos();
    }

    private boolean isFresh(Snapshot snapshot) {
        return snapshot != null && clock.instant().isBefore(snapshot.fetchedAt().plus(cacheTtl));
    }

    /** One successful result and when it was fetched. */
    private record Snapshot(List<GitHubRepo> repos, Instant fetchedAt) {}
}
