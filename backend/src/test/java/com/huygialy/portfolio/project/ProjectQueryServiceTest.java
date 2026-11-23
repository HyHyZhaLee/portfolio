package com.huygialy.portfolio.project;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.project.GitHubClient.GitHubException;
import com.huygialy.portfolio.project.GitHubClient.GitHubRepo;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;

/**
 * The snapshot and fallback logic of {@link ProjectQueryService} (PF-007 F1) that the integration tests cannot reach: the
 * test profile turns the 1 h cache off, and the shared context may already hold a last good result. A scripted
 * {@link GitHubClient}, a real circuit breaker, and a clock the test moves.
 */
class ProjectQueryServiceTest {

    private static final Instant START = Instant.parse("2026-11-23T10:00:00Z");
    private static final GitHubRepo REPO = new GitHubRepo(
            "synthetic-repo",
            null,
            "https://github.com/example/synthetic-repo",
            null,
            "Java",
            1,
            List.of(),
            START,
            false,
            false,
            false);

    private final MovableClock clock = new MovableClock();
    private final ScriptedGitHub gitHub = new ScriptedGitHub();

    @Test
    void servesAFreshResultWithoutCallingGitHubAndRefreshesItOnceExpired() {
        final var service = service(Duration.ofHours(1));
        gitHub.answers.add(() -> List.of(REPO));
        gitHub.answers.add(List::of);

        assertThat(service.list()).containsExactly(REPO);
        clock.advance(Duration.ofMinutes(59));
        assertThat(service.list()).containsExactly(REPO);
        assertThat(gitHub.calls).isEqualTo(1);

        clock.advance(Duration.ofMinutes(2));
        assertThat(service.list()).isEmpty();
        assertThat(gitHub.calls).isEqualTo(2);
    }

    @Test
    void aFailureBeforeAnySuccessAnswersAnEmptyList() {
        final var service = service(Duration.ofHours(1));
        gitHub.answers.add(() -> {
            throw new GitHubException("HTTP_503");
        });

        assertThat(service.list()).isEmpty();
    }

    @Test
    void aFailureAfterASuccessAnswersTheLastGoodResult() {
        final var service = service(Duration.ZERO);
        gitHub.answers.add(() -> List.of(REPO));
        gitHub.answers.add(() -> {
            throw new GitHubException("IO_ERROR");
        });

        assertThat(service.list()).containsExactly(REPO);
        assertThat(service.list()).containsExactly(REPO);
        assertThat(gitHub.calls).isEqualTo(2);
    }

    private ProjectQueryService service(Duration cacheTtl) {
        final var properties = new GitHubProperties(
                "example-user",
                null,
                List.of(),
                "http://github.invalid",
                Duration.ofSeconds(1),
                Duration.ofSeconds(1),
                cacheTtl,
                Duration.ofMinutes(10));
        return new ProjectQueryService(gitHub, new ProjectConfig().gitHubCircuitBreaker(properties), properties, clock);
    }

    /** Answers each call with the next scripted supplier. */
    private static final class ScriptedGitHub implements GitHubClient {

        final Deque<Supplier<List<GitHubRepo>>> answers = new ArrayDeque<>();
        int calls;

        @Override
        public List<GitHubRepo> listPublicRepositories(String username) {
            calls++;
            return answers.removeFirst().get();
        }
    }

    private static final class MovableClock extends Clock {

        private Instant now = START;

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }
}
