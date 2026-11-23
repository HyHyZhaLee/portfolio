package com.huygialy.portfolio.project;

import com.huygialy.portfolio.project.GitHubClient.GitHubRepo;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Which repositories the site lists, and in what order (SITE-005, PF-007 D6 and D7): forks, archived, and private
 * repositories are dropped; the featured names come first in their configured order, matched case-insensitively; the
 * rest follow by last push, newest first, with an unknown push last and the name breaking ties.
 */
final class RepositoryFilter {

    private RepositoryFilter() {}

    static List<GitHubRepo> select(List<GitHubRepo> repos, List<String> featured) {
        final Map<String, Integer> rank = new HashMap<>();
        for (int i = 0; i < featured.size(); i++) {
            rank.putIfAbsent(key(featured.get(i)), i);
        }
        final Comparator<GitHubRepo> order = Comparator.<GitHubRepo>comparingInt(
                        repo -> rank.getOrDefault(key(repo.name()), Integer.MAX_VALUE))
                .thenComparing(GitHubRepo::pushedAt, Comparator.nullsLast(Comparator.<Instant>reverseOrder()))
                .thenComparing(GitHubRepo::name);
        return repos.stream()
                .filter(repo -> !repo.fork() && !repo.archived() && !repo.privateRepository())
                .sorted(order)
                .toList();
    }

    private static String key(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}
