package com.huygialy.portfolio.platform.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.MDC;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Tags every request with a correlation ID: the client's {@code X-Correlation-Id} when it is well formed, else a new
 * UUID. The ID goes into the logging context, a request attribute, and the response header. Registered by
 * {@link WebConfig} ahead of the security chain, never as a component (KNOWN-BE-007).
 */
public final class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-Id";
    public static final String ATTRIBUTE = CorrelationIdFilter.class.getName() + ".id";
    public static final String MDC_KEY = "correlationId";
    private static final Pattern WELL_FORMED = Pattern.compile("[A-Za-z0-9-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        final var id = resolve(request.getHeader(HEADER));
        request.setAttribute(ATTRIBUTE, id);
        response.setHeader(HEADER, id);
        MDC.put(MDC_KEY, id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    /** The incoming value when it is 1 to 64 letters, digits, or hyphens, so it is safe in a log line; else a UUID. */
    static String resolve(String incoming) {
        return incoming != null && WELL_FORMED.matcher(incoming).matches()
                ? incoming
                : UUID.randomUUID().toString();
    }

    /** The current request's ID, for problem bodies. */
    public static String current(WebRequest request) {
        return request.getAttribute(ATTRIBUTE, RequestAttributes.SCOPE_REQUEST) instanceof String id ? id : null;
    }
}
