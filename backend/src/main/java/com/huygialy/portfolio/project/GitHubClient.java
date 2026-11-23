package com.huygialy.portfolio.project;

import java.time.Instant;
import java.util.List;

/**
 * The port through which the project feature reads GitHub (backend guide principle 8); {@code GitHubRestClient}
 * implements it. Only the adapter knows GitHub's JSON, and every provider failure arrives as a {@link GitHubException}.
 */
public interface GitHubClient {

    /**
     * The public repositories {@code username} owns, as GitHub returns them (one page, most recently pushed first).
     *
     * @throws GitHubException when GitHub did not answer with a readable list
     */
    List<GitHubRepo> listPublicRepositories(String username);

    /**
     * One repository. {@code description}, {@code homepage}, {@code language}, and {@code pushedAt} may be {@code null};
     * {@code topics} is never {@code null}.
     */
    record GitHubRepo(
            String name,
            String description,
            String url,
            String homepage,
            String language,
            int stars,
            List<String> topics,
            Instant pushedAt,
            boolean fork,
            boolean archived,
            boolean privateRepository) {}

    /**
     * GitHub did not answer with a readable list. {@code reason} is a code such as {@code HTTP_403}, {@code IO_ERROR}, or
     * {@code BAD_RESPONSE}, never provider text; the exception carries no cause and no stack trace.
     */
    final class GitHubException extends RuntimeException {

        private final String reason;

        public GitHubException(String reason) {
            super(reason, null, false, false);
            this.reason = reason;
        }

        public String reason() {
            return reason;
        }
    }
}
