package com.huygialy.portfolio.project;

import static org.assertj.core.api.Assertions.assertThat;

import com.huygialy.portfolio.project.GitHubClient.GitHubRepo;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

/** The selection rule of SITE-005 (PF-007 D6, D7): pure logic, so a unit test (backend guide principle 14). */
class RepositoryFilterTest {

    private static final Instant OLD = Instant.parse("2024-01-01T00:00:00Z");
    private static final Instant NEW = Instant.parse("2026-01-01T00:00:00Z");

    @Test
    void dropsForksArchivedAndPrivateRepositories() {
        final var repos = List.of(
                repo("kept", NEW, false, false, false),
                repo("a-fork", NEW, true, false, false),
                repo("archived", NEW, false, true, false),
                repo("private", NEW, false, false, true));

        assertThat(names(RepositoryFilter.select(repos, List.of("a-fork", "private"))))
                .containsExactly("kept");
    }

    @Test
    void putsFeaturedFirstInConfiguredOrderIgnoringCase() {
        final var repos = List.of(repo("recent", NEW), repo("Thesis_Pole", OLD), repo("site", OLD), repo("older", OLD));

        assertThat(names(RepositoryFilter.select(repos, List.of("site", "thesis_pole", "missing", "SITE"))))
                .containsExactly("site", "Thesis_Pole", "recent", "older");
    }

    @Test
    void ordersTheRestByLastPushThenUnknownPushLastThenByName() {
        final var repos = List.of(repo("no-push", null), repo("b-old", OLD), repo("a-old", OLD), repo("new", NEW));

        assertThat(names(RepositoryFilter.select(repos, List.of())))
                .containsExactly("new", "a-old", "b-old", "no-push");
    }

    @Test
    void anEmptyListStaysEmpty() {
        assertThat(RepositoryFilter.select(List.of(), List.of("site"))).isEmpty();
    }

    private static GitHubRepo repo(String name, Instant pushedAt) {
        return repo(name, pushedAt, false, false, false);
    }

    private static GitHubRepo repo(String name, Instant pushedAt, boolean fork, boolean archived, boolean priv) {
        return new GitHubRepo(
                name,
                null,
                "https://github.com/example/" + name,
                null,
                null,
                0,
                List.of(),
                pushedAt,
                fork,
                archived,
                priv);
    }

    private static List<String> names(List<GitHubRepo> repos) {
        return repos.stream().map(GitHubRepo::name).toList();
    }
}
