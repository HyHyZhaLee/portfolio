package com.huygialy.portfolio.project.api;

import com.huygialy.portfolio.project.ProjectQueryService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code GET /api/v1/projects}: the owner's public GitHub repositories, answered with 200 even when GitHub is down. */
@RestController
public class ProjectController {

    private final ProjectQueryService queryService;

    public ProjectController(ProjectQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/api/v1/projects")
    @Operation(operationId = "listProjects")
    public ProjectListResponse listProjects() {
        return ProjectListResponse.from(queryService.list());
    }
}
