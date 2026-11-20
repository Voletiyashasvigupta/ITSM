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

/** Removes caller-supplied identity headers and forwards only a verified JWT subject. */
@Component
public class RequestIdentityFilter implements GlobalFilter, Ordered {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .map(principal -> principal instanceof JwtAuthenticationToken authentication
                        ? authentication.getToken().getSubject() : "")
                .defaultIfEmpty("")
                .flatMap(subject -> forward(exchange, chain, subject.isBlank() ? null : subject));
    }

    private Mono<Void> forward(ServerWebExchange exchange, GatewayFilterChain chain, String subject) {
        ServerHttpRequest request = exchange.getRequest().mutate().headers(headers -> {
            headers.remove("X-Authenticated-User");
            if (subject != null && !subject.isBlank()) headers.set("X-Authenticated-User", subject);
            String correlationId = headers.getFirst("X-Correlation-ID");
            if (correlationId == null || !correlationId.matches("[A-Za-z0-9._-]{1,100}")) headers.set("X-Correlation-ID", UUID.randomUUID().toString());
        }).build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }
}
