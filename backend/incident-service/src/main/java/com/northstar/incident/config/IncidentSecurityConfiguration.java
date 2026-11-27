package com.northstar.incident.config;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for the Incident Service.
 *
 * <p><b>Purpose:</b> Configures JWT validation (HMAC-SHA256), audience verification, issuer checks,
 * and stateless endpoint protection for incident REST APIs.
 *
 * <p><b>Downstream / Workflow:</b> Verifies the Bearer JWT supplied by the client or passed through the API Gateway,
 * populating the Spring SecurityContext for incident controller endpoints.
 */
@Configuration
public class IncidentSecurityConfiguration {

    /**
     * Initializes the SecretKey for validating JWT tokens.
     *
     * <p><b>Purpose:</b> Reads {@code security.jwt.secret} (min 32 bytes) and produces an HMAC-SHA256 secret key.
     *
     * <p><b>Downstream / Workflow:</b> Passed to {@link #incidentJwtDecoder(SecretKey, String, String)}.
     *
     * @param secret Configured JWT signing secret.
     * @return SecretKey instance.
     */
    @Bean
    SecretKey incidentJwtSecretKey(@Value("${security.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("JWT_SIGNING_SECRET must contain at least 32 bytes");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Builds the NimbusJwtDecoder bean for the Incident Service.
     *
     * <p><b>Purpose:</b> Cryptographically validates JWT token signatures, issuer, and audience.
     *
     * <p><b>Downstream / Workflow:</b> Used by the OAuth2 Resource Server filter on all incident API routes.
     *
     * @param incidentJwtSecretKey HMAC signing key.
     * @param issuer Expected token issuer URI.
     * @param audience Expected audience string.
     * @return Configured JwtDecoder.
     */
    @Bean
    JwtDecoder incidentJwtDecoder(SecretKey incidentJwtSecretKey,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(incidentJwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required audience is missing", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    /**
     * Configures HTTP security rules and disables session creation.
     *
     * <p><b>Purpose:</b> Requires authentication for all incident management endpoints except health checks.
     *
     * <p><b>Downstream / Workflow:</b> Evaluated on each incoming HTTP exchange to the Incident Service.
     *
     * @param http HttpSecurity builder.
     * @return Built SecurityFilterChain.
     * @throws Exception if configuration fails.
     */
    @Bean
    SecurityFilterChain incidentSecurityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize.requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
                .build();
    }
}
