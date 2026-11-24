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

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter filter;

    public SecurityConfig(JwtAuthenticationFilter filter) {
        this.filter = filter;
    }

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
