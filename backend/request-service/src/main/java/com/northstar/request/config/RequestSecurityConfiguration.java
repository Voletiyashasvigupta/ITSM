package com.northstar.request.config;

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
 * Security configuration for the Service Request microservice.
 *
 * <p><b>Purpose:</b> Configures HMAC-SHA256 JWT decoding, issuer/audience validation, and stateless
 * authorization rules protecting request and approval REST endpoints.
 *
 * <p><b>Downstream / Workflow:</b> Applied to all incoming requests under {@code /api/requests/**} and {@code /api/approvals/**}.
 */
@Configuration
public class RequestSecurityConfiguration {

    /**
     * Constructs the SecretKey bean for validating JWT token signatures.
     *
     * @param secret Configured signing secret (min 32 bytes).
     * @return SecretKey instance.
     */
    @Bean
    SecretKey requestJwtSecretKey(@Value("${security.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("JWT_SIGNING_SECRET must contain at least 32 bytes");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Builds the NimbusJwtDecoder bean for the Request Service.
     *
     * @param requestJwtSecretKey Signing key.
     * @param issuer Expected token issuer URI.
     * @param audience Expected audience string.
     * @return Configured JwtDecoder.
     */
    @Bean
    JwtDecoder requestJwtDecoder(SecretKey requestJwtSecretKey,
            @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(requestJwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required audience is missing", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    /**
     * Configures HTTP security rules requiring authentication on all API routes except health checks.
     *
     * @param http HttpSecurity builder.
     * @return Built SecurityFilterChain.
     * @throws Exception on security failure.
     */
    @Bean
    SecurityFilterChain requestSecurityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
                .build();
    }
}
