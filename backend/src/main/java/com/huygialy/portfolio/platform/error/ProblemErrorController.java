package com.huygialy.portfolio.platform.error;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;

/**
 * Renders the {@code /error} dispatch as problem JSON, replacing Boot's default body. Errors that never reach a
 * controller end here: Spring Security's firewall rejecting a URL, or the servlet container reporting a status. Only the
 * error dispatch reaches it; a direct request to {@code /error} is off the public list and answers 404.
 */
@Hidden
@RestController
class ProblemErrorController implements ErrorController {

    private final GlobalExceptionHandler handler;

    ProblemErrorController(GlobalExceptionHandler handler) {
        this.handler = handler;
    }

    @RequestMapping("/error")
    ResponseEntity<Object> error(HttpServletRequest request, WebRequest webRequest) {
        final var status =
                request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE) instanceof Integer code ? code : 500;
        return handler.problemForStatus(HttpStatusCode.valueOf(status), webRequest);
    }
}
