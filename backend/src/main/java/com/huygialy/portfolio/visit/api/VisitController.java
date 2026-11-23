package com.huygialy.portfolio.visit.api;

import com.huygialy.portfolio.platform.client.ClientInfoResolver;
import com.huygialy.portfolio.visit.VisitCommandService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code POST /api/v1/visits}: binds and validates the view, resolves the client, and answers 202 with no body. */
@RestController
public class VisitController {

    private final ClientInfoResolver clientInfoResolver;
    private final VisitCommandService commandService;

    public VisitController(ClientInfoResolver clientInfoResolver, VisitCommandService commandService) {
        this.clientInfoResolver = clientInfoResolver;
        this.commandService = commandService;
    }

    @PostMapping("/api/v1/visits")
    @Operation(operationId = "recordVisit")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void recordVisit(@Valid @RequestBody RecordVisitRequest body, HttpServletRequest request) {
        commandService.record(body, clientInfoResolver.resolve(request));
    }
}
