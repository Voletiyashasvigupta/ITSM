package com.northstar.request.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Servlet filter establishing distributed request tracing via {@code X-Correlation-ID}.
 *
 * <p><b>Purpose:</b> Extracts or generates a sanitized correlation ID, stamps it into the response headers,
 * and sets the SLF4J Mapped Diagnostic Context (MDC) so that all log lines include the correlation ID.
 *
 * <p><b>Downstream / Workflow:</b> Executes at highest precedence on every incoming HTTP request.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Correlation-ID";

    /**
     * Intercepts request to populate correlation ID in MDC and response headers.
     *
     * <p><b>Purpose:</b> MDC logging enrichment and trace propagation.
     *
     * @param request HTTP request.
     * @param response HTTP response.
     * @param chain Filter chain.
     * @throws ServletException on servlet error.
     * @throws IOException on I/O error.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String id = request.getHeader(HEADER);
        if (id == null || !id.matches("[A-Za-z0-9._-]{1,100}")) id = UUID.randomUUID().toString();
        response.setHeader(HEADER, id);
        MDC.put("correlationId", id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
