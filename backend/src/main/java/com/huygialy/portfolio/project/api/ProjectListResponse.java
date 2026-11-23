package com.huygialy.portfolio.project.api;

import com.huygialy.portfolio.project.GitHubClient.GitHubRepo;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/**
 * {@code GET /api/v1/projects} (PF-007 FR-6): the listed repositories, featured first. Required and nullable markers
 * make the generated frontend types exact, as in {@code StatsSummaryResponse}.
 */
public record ProjectListResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<ProjectResponse> items) {

    public static ProjectListResponse from(List<GitHubRepo> repos) {
        return new ProjectListResponse(repos.stream().map(ProjectResponse::from).toList());
    }

    /** One public repository; {@code updatedAt} is the time of its last push (PF-007 D11). */
    public record ProjectResponse(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String name,

            @Schema(types = {"string", "null"}) String description,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            String url,

            @Schema(types = {"string", "null"}) String homepage,
            @Schema(types = {"string", "null"}) String language,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            int stars,

            @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
            List<String> topics,

            @Schema(types = {"string", "null"}) Instant updatedAt) {

        static ProjectResponse from(GitHubRepo repo) {
            return new ProjectResponse(
                    repo.name(),
                    repo.description(),
                    repo.url(),
                    repo.homepage(),
                    repo.language(),
                    repo.stars(),
                    repo.topics(),
                    repo.pushedAt());
        }
    }
}
