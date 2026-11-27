package com.example.problem_service.security;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Custom once-per-request HTTP servlet filter for JWT authentication in Problem Management.
 *
 * <p><b>Purpose:</b> Extracts Bearer tokens from the HTTP {@code Authorization} header, validates them
 * using {@link JwtService}, extracts user identity and assigned authorities, and binds a
 * {@link UsernamePasswordAuthenticationToken} to the {@link SecurityContextHolder}.
 *
 * <p><b>Downstream / Workflow:</b> Executes before Spring Security's {@code UsernamePasswordAuthenticationFilter}
 * so that subsequent authorization checks and controller methods have access to authenticated principal details.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    /**
     * Intercepts the HTTP servlet request to parse and authenticate Bearer tokens.
     *
     * <p><b>Purpose:</b> Validates JWT token and configures Spring SecurityContext.
     *
     * <p><b>Downstream / Workflow:</b> Forwards the request and response down the filter chain to target controllers.
     *
     * @param request The HTTP request.
     * @param response The HTTP response.
     * @param filterChain The servlet filter chain.
     * @throws ServletException on servlet exception.
     * @throws IOException on I/O error.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtService.validateToken(token)) {
                String email = jwtService.extractEmail(token);
                List<String> roles = jwtService.extractRoles(token);

                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .toList();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
