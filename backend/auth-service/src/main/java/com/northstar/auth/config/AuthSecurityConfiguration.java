package com.northstar.auth.config;

import com.northstar.auth.entity.PortalRole;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

/**
 * Spring Security and JWT configuration for the Auth Service.
 *
 * <p><b>Purpose:</b> Configures password hashing via BCrypt, JWT signing (HMAC-SHA256) via {@link JwtEncoder},
 * JWT decoding/validation via {@link JwtDecoder}, method security, and stateless HTTP security filter chains.
 *
 * <p><b>Downstream / Workflow:</b> Issues signed JWT tokens to authenticated clients and validates tokens
 * presented on protected administrative endpoints (such as {@code /api/auth/admin/**}).
 */
@Configuration
@EnableMethodSecurity
public class AuthSecurityConfiguration {

    /**
     * Password encoder bean using BCrypt with strength work factor 12.
     *
     * <p><b>Purpose:</b> Secure, salted one-way hashing of portal user passwords.
     *
     * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.auth.service.AuthService} and {@link com.northstar.auth.service.BootstrapAdmin}.
     *
     * @return BCryptPasswordEncoder instance.
     */
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    /**
     * Constructs the SecretKey used for HMAC-SHA256 symmetric signing.
     *
     * <p><b>Purpose:</b> Derives the symmetric cryptographic key from {@code security.jwt.secret} (requiring at least 32 bytes).
     *
     * <p><b>Downstream / Workflow:</b> Supplied to {@link #jwtEncoder(SecretKey)} and {@link #jwtDecoder(SecretKey, String, String)}.
     *
     * @param secret Raw secret string.
     * @return Initialized SecretKey.
     */
    @Bean
    SecretKey jwtSecretKey(@Value("${security.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("JWT_SIGNING_SECRET must contain at least 32 bytes");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /**
     * Nimbus JWT encoder bean for creating and signing JSON Web Tokens.
     *
     * <p><b>Purpose:</b> Generates signed HS256 JWT tokens for successful logins and impersonation sessions.
     *
     * <p><b>Downstream / Workflow:</b> Used by {@link com.northstar.auth.service.AuthService} when issuing auth tokens.
     *
     * @param key Symmetric signing key.
     * @return Configured JwtEncoder.
     */
    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        OctetSequenceKey jwk = new OctetSequenceKey.Builder(key).keyID("northstar-hs256").algorithm(com.nimbusds.jose.JWSAlgorithm.HS256).build();
        JWKSource<SecurityContext> source = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(source);
    }

    /**
     * Nimbus JWT decoder bean for verifying incoming JWT tokens against audience and issuer constraints.
     *
     * <p><b>Purpose:</b> Decodes and cryptographically validates Bearer tokens.
     *
     * <p><b>Downstream / Workflow:</b> Used by the OAuth2 Resource Server filter on protected Auth Service routes.
     *
     * @param key Symmetric signing key.
     * @param issuer Expected token issuer URI.
     * @param audience Expected audience string.
     * @return Configured JwtDecoder.
     */
    @Bean
    JwtDecoder jwtDecoder(SecretKey key, @Value("${security.jwt.issuer}") String issuer,
            @Value("${security.jwt.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required audience is missing", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    /**
     * HTTP security filter chain configuration for the Auth Service.
     *
     * <p><b>Purpose:</b> Permits public access to login, registration, and health endpoints while requiring authentication
     * for all other endpoints (user queries, role updates). Enforces stateless sessions.
     *
     * <p><b>Downstream / Workflow:</b> Applied to each incoming HTTP request entering the Auth Service servlet container.
     *
     * @param http HttpSecurity builder.
     * @param jwtConverter JWT authentication converter.
     * @return Built SecurityFilterChain.
     * @throws Exception if security configuration fails.
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, Converter<Jwt, ? extends AbstractAuthenticationToken> jwtConverter) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/internal/**", "/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)))
                .build();
    }

    /**
     * Converts decoded JWT claims into Spring Security granted authorities.
     *
     * <p><b>Purpose:</b> Maps role names from the JWT "roles" claim to Spring Security's {@code ROLE_} format.
     *
     * <p><b>Downstream / Workflow:</b> Sets up the SecurityContext used by {@code @PreAuthorize} annotations.
     *
     * @return Converter turning Jwt into an AbstractAuthenticationToken.
     */
    @Bean
    Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>(scopes.convert(jwt));
            Object rawRoles = jwt.getClaims().get("roles");
            if (rawRoles instanceof Collection<?> roles) {
                for (Object raw : roles) {
                    if (!(raw instanceof String role)) continue;
                    String normalized = role.trim().toUpperCase(Locale.ROOT);
                    if (normalized.equals("ADMIN") || normalized.equals("ADMINISTRATOR")) {
                        normalized = PortalRole.MANAGER_ADMIN.name();
                    }
                    try {
                        PortalRole parsed = PortalRole.valueOf(normalized);
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + parsed.name()));
                        if (parsed == PortalRole.MANAGER_ADMIN) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_MANAGER"));
                        }
                    }
                    catch (IllegalArgumentException ignored) { }
                }
            }
            return authorities;
        });
        return converter::convert;
    }
}
