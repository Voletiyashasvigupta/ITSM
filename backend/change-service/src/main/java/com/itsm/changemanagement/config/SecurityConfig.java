package com.itsm.changemanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security and CORS configuration for the Change Service.
 *
 * <p><b>Purpose:</b> Configures open/protected access modes (via {@code app.security.open-access}),
 * OAuth2 Resource Server JWT verification, and CORS policies for web clients.
 *
 * <p><b>Downstream / Workflow:</b> Filter chain applied to every HTTP exchange to {@code /api/changes/**}.
 */
@Configuration
public class SecurityConfig {

    /**
     * Builds the HTTP security filter chain.
     *
     * <p><b>Purpose:</b> Permits all routes when openAccess is true, or enforces OAuth2 Bearer token checking
     * when openAccess is false while exempting health and Swagger routes.
     *
     * <p><b>Downstream / Workflow:</b> Applied to each HTTP request.
     *
     * @param http HttpSecurity builder.
     * @param openAccess Config property toggling open demo access vs token verification.
     * @return Built SecurityFilterChain.
     * @throws Exception on configuration failure.
     */
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http,
                                    @Value("${app.security.open-access:true}") boolean openAccess) throws Exception {
        http.csrf(c -> c.disable()).cors(Customizer.withDefaults());
        if (openAccess) {
            http.authorizeHttpRequests(a -> a.anyRequest().permitAll());
        } else {
            http.authorizeHttpRequests(a -> a
                            .requestMatchers("/actuator/health/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                            .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        }
        return http.build();
    }

    /**
     * Configures cross-origin resource sharing (CORS) sources.
     *
     * <p><b>Purpose:</b> Permits cross-origin browser requests from React/dev origins.
     *
     * <p><b>Downstream / Workflow:</b> Registered on all path patterns ({@code /**}).
     *
     * @param origins Comma-delimited list of allowed origin patterns.
     * @return CorsConfigurationSource bean.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins:*}") String origins) {
        List<String> patterns = Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(patterns);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
