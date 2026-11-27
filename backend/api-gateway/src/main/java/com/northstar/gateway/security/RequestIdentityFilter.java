package com.northstar.gateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.UUID;

/**
 * Global gateway filter that sanitizes identity headers and injects verified user identity and correlation IDs.
 *
 * <p><b>Purpose:</b> Prevents header-spoofing attacks by stripping any incoming client-provided
 * {@code X-Authenticated-User} header and replacing it with the cryptographically verified JWT subject. Also
 * ensures a valid {@code X-Correlation-ID} exists for distributed request tracing.
 *
 * <p><b>Downstream / Workflow:</b> Executes at the end of the gateway filter chain just before the request
 * is forwarded across the network to downstream services (e.g. Request Service, Catalog Service). Downstream
 * services trust the {@code X-Authenticated-User} header set by this filter.
 */
@Component
public class RequestIdentityFilter implements GlobalFilter, Ordered {

    /**
     * Intercepts the reactive web exchange to extract the authenticated user subject from the security context.
     *
     * <p><b>Purpose:</b> Reads the authenticated {@link JwtAuthenticationToken} from the reactive exchange principal.
     *
     * <p><b>Downstream / Workflow:</b> Passes the extracted subject string to {@link #forward} to mutate headers
     * and proceed down the gateway filter chain.
     *
     * @param exchange The current ServerWebExchange.
     * @param chain The gateway filter chain.
     * @return Mono completing when the downstream chain finishes.
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .map(principal -> principal instanceof JwtAuthenticationToken authentication
                        ? authentication.getToken().getSubject() : "")
                .defaultIfEmpty("")
                .flatMap(subject -> forward(exchange, chain, subject.isBlank() ? null : subject));
    }

    /**
     * Mutates request headers to strip untrusted caller identity and append verified headers.
     *
     * <p><b>Purpose:</b> Removes caller-supplied {@code X-Authenticated-User}, injects the verified JWT subject,
     * and generates or preserves a sanitised {@code X-Correlation-ID}.
     *
     * <p><b>Downstream / Workflow:</b> Forwards the mutated request down the {@link GatewayFilterChain} toward the
     * target microservice.
     *
     * @param exchange The reactive exchange.
     * @param chain The gateway filter chain.
     * @param subject The verified user subject (or null if unauthenticated).
     * @return Mono representing the completed forwarding operation.
     */
    private Mono<Void> forward(ServerWebExchange exchange, GatewayFilterChain chain, String subject) {
        ServerHttpRequest request = exchange.getRequest().mutate().headers(headers -> {
            headers.remove("X-Authenticated-User");
            if (subject != null && !subject.isBlank()) headers.set("X-Authenticated-User", subject);
            String correlationId = headers.getFirst("X-Correlation-ID");
            if (correlationId == null || !correlationId.matches("[A-Za-z0-9._-]{1,100}")) headers.set("X-Correlation-ID", UUID.randomUUID().toString());
        }).build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    /**
     * Specifies the filter order in the Spring Cloud Gateway filter chain.
     *
     * <p><b>Purpose:</b> Ensures this filter executes at lowest precedence after authentication and routing
     * logic have evaluated.
     *
     * <p><b>Downstream / Workflow:</b> Controls filter execution order in the Netty request pipeline.
     *
     * @return {@link Ordered#LOWEST_PRECEDENCE}.
     */
    @Override
    public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}
