package com.example.problem_service.config;

import com.example.problem_service.security.JwtAuthenticationFilter;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

/**
 * Spring Security configuration for the Problem Service.
 *
 * <p><b>Purpose:</b> Enforces stateless session management, JWT authentication via {@link JwtAuthenticationFilter},
 * and route-based authorization rules across Problem Management endpoints.
 *
 * <p><b>Downstream / Workflow:</b> Intercepts all incoming HTTP calls before reaching {@code ProblemController}.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter filter;

    /**
     * Constructs the SecurityConfig.
     *
     * <p><b>Purpose:</b> Injects the custom JWT authentication filter.
     *
     * <p><b>Downstream / Workflow:</b> Initialized by Spring Boot on startup.
     *
     * @param filter The JwtAuthenticationFilter bean.
     */
    public SecurityConfig(JwtAuthenticationFilter filter) {
        this.filter = filter;
    }

    /**
     * Defines the HTTP security filter chain and authorization policies.
     *
     * <p><b>Purpose:</b> Disables CSRF, sets session policy to stateless, specifies 401 Unauthorized entry point,
     * allows public actuator endpoints, requires authentication for all problem endpoints, and registers the JWT filter.
     *
     * <p><b>Downstream / Workflow:</b> Applied to each incoming HTTP request to the Problem Service.
     *
     * @param http HttpSecurity builder.
     * @return Built SecurityFilterChain.
     * @throws Exception if configuration fails.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(c -> c.disable())

            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .exceptionHandling(e ->
                e.authenticationEntryPoint(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                )
            )

            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/**").permitAll()

                // All logged in users can view and create problems
                .requestMatchers(HttpMethod.GET, "/api/problems", "/api/problems/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/problems").authenticated()

                // Investigation, management, technical work, and status transitions
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/problems/*/management",
                    "/api/problems/*/status",
                    "/api/problems/*/investigation",
                    "/api/problems/*/technical-work"
                ).authenticated()

                // Deletion
                .requestMatchers(HttpMethod.DELETE, "/api/problems/**").authenticated()

                .anyRequest().authenticated()
            )

            .addFilterBefore(
                filter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration() {

        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>();

        registration.setFilter(filter);
        registration.setEnabled(false);

        return registration;
    }
}
