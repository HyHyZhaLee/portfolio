package com.huygialy.portfolio.project;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.net.http.HttpClient;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.StreamReadConstraints;
import tools.jackson.core.json.JsonFactory;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Lists public repositories through GitHub's REST API (backend guide principle 8, PF-007 P4): explicit connect and read
 * timeouts, the token as a Bearer header only when one is set, and every failure mapped to a {@link GitHubException}
 * with a reason code. It parses with its own {@link JsonMapper}, because Boot's mapper caps a document at 64 KB (PF-005
 * P18) and GitHub's list is about 5 KB per repository.
 */
@Component
class GitHubRestClient implements GitHubClient {

    static final String REPOS_URI = "/users/{username}/repos?type=owner&sort=pushed&per_page=100";
    private static final int MAX_RESPONSE_CHARS = 2 * 1024 * 1024;
    private static final ParameterizedTypeReference<List<RepoJson>> REPO_LIST = new ParameterizedTypeReference<>() {};

    private final RestClient client;

    GitHubRestClient(GitHubProperties properties) {
        // HTTP/1.1: the JDK client would otherwise try an h2c upgrade on a plain-HTTP port such as WireMock's.
        final var httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.connectTimeout())
                .build();
        final var requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());
        final var jsonMapper = JsonMapper.builder(JsonFactory.builder()
                        .streamReadConstraints(StreamReadConstraints.builder()
                                .maxDocumentLength(MAX_RESPONSE_CHARS)
                                .build())
                        .build())
                // Jackson 3 fails on a missing primitive by default; an absent flag or count reads as false or 0.
                .disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
                .build();
        final var builder = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .configureMessageConverters(
                        converters -> converters.withJsonConverter(new JacksonJsonHttpMessageConverter(jsonMapper)))
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeader(HttpHeaders.USER_AGENT, "portfolio-backend");
        if (properties.hasToken()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.token());
        }
        this.client = builder.build();
    }

    @Override
    public List<GitHubRepo> listPublicRepositories(String username) {
        final List<RepoJson> body;
        try {
            body = client.get().uri(REPOS_URI, username).retrieve().body(REPO_LIST);
        } catch (RestClientResponseException e) {
            throw new GitHubException("HTTP_" + e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            throw new GitHubException("IO_ERROR");
        } catch (RestClientException e) {
            throw new GitHubException("BAD_RESPONSE");
        }
        if (body == null) {
            throw new GitHubException("BAD_RESPONSE");
        }
        return body.stream()
                .filter(Objects::nonNull)
                .filter(repo -> repo.name() != null && repo.htmlUrl() != null)
                .map(RepoJson::toRepo)
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    /** The fields kept from one entry of GitHub's list; everything else is ignored. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record RepoJson(
            String name,
            String description,
            @JsonProperty("html_url") String htmlUrl,
            String homepage,
            String language,
            @JsonProperty("stargazers_count") int stars,
            List<String> topics,
            @JsonProperty("pushed_at") Instant pushedAt,
            boolean fork,
            boolean archived,
            @JsonProperty("private") boolean privateRepository) {

        GitHubRepo toRepo() {
            return new GitHubRepo(
                    name,
                    blankToNull(description),
                    htmlUrl,
                    blankToNull(homepage),
                    language,
                    stars,
                    topics == null
                            ? List.of()
                            : topics.stream().filter(Objects::nonNull).toList(),
                    pushedAt,
                    fork,
                    archived,
                    privateRepository);
        }
    }
}
