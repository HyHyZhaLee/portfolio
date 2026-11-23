package com.huygialy.portfolio.contact.api;

import com.huygialy.portfolio.contact.ContactCommandService;
import com.huygialy.portfolio.platform.client.ClientInfoResolver;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code POST /api/v1/contact-messages}: binds and validates the message, resolves the client, and answers 202 with no
 * body once the message is saved, whatever happens to its delivery (PF-006 FR-2).
 */
@RestController
public class ContactController {

    private final ClientInfoResolver clientInfoResolver;
    private final ContactCommandService commandService;

    public ContactController(ClientInfoResolver clientInfoResolver, ContactCommandService commandService) {
        this.clientInfoResolver = clientInfoResolver;
        this.commandService = commandService;
    }

    @PostMapping("/api/v1/contact-messages")
    @Operation(operationId = "createContactMessage")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void createContactMessage(@Valid @RequestBody CreateContactMessageRequest body, HttpServletRequest request) {
        commandService.submit(body, clientInfoResolver.resolve(request));
    }
}
