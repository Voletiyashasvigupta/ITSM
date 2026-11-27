package com.example.problem_service.security;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;
import io.jsonwebtoken.JwtException;

/**
 * JWT parsing and validation utility service for Problem Management.
 *
 * <p><b>Purpose:</b> Cryptographically verifies JJWT tokens, extracts user claims (email, subject, roles),
 * and maps composite roles (such as MANAGER_ADMIN) to granular problem management permissions
 * (PROBLEM_MANAGER, PROBLEM_ANALYST, TECHNICAL_SUPPORT_ENGINEER).
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link JwtAuthenticationFilter} to authenticate inbound requests.
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Resolves the SecretKey from either UTF-8 bytes or Base64 decoding.
     *
     * <p><b>Purpose:</b> Supports flexible signing key encoding formats.
     *
     * <p><b>Downstream / Workflow:</b> Used during token verification and claims extraction.
     *
     * @return Initialized SecretKey.
     */
    private SecretKey getSigningKey() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= 32) {
            return Keys.hmacShaKeyFor(bytes);
        }
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (Exception e) {
            return Keys.hmacShaKeyFor(bytes);
        }
    }

    /**
     * Validates that the provided token has a valid signature and is not malformed or expired.
     *
     * <p><b>Purpose:</b> Fast token authenticity check.
     *
     * <p><b>Downstream / Workflow:</b> Called by {@link JwtAuthenticationFilter#doFilterInternal} on every API request.
     *
     * @param token Bearer JWT string.
     * @return {@code true} if valid; {@code false} otherwise.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            try {
                byte[] b64Bytes = Decoders.BASE64.decode(secret);
                Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(b64Bytes))
                    .build()
                    .parseSignedClaims(token);
                return true;
            } catch (Exception ex) {
                System.out.println("JWT VALIDATION FAILED: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                return false;
            }
        }
    }

    /**
     * Parses and extracts claims payload from the token.
     *
     * <p><b>Purpose:</b> Internal claim decoder.
     *
     * <p><b>Downstream / Workflow:</b> Used by {@link #extractEmail(String)} and {@link #extractRoles(String)}.
     *
     * @param token Bearer token string.
     * @return Decoded Claims payload.
     */
    private Claims getClaims(String token) {
        try {
            return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (Exception e) {
            byte[] b64Bytes = Decoders.BASE64.decode(secret);
            return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(b64Bytes))
                .build()
                .parseSignedClaims(token)
                .getPayload();
        }
    }

    /**
     * Extracts email address or subject identifier from the token.
     *
     * <p><b>Purpose:</b> Identifies the authenticated caller.
     *
     * <p><b>Downstream / Workflow:</b> Used to build the Spring Security Principal.
     *
     * @param token Bearer JWT.
     * @return User email or subject string.
     */
    public String extractEmail(String token) {
        Claims claims = getClaims(token);
        String email = claims.get("email", String.class);
        if (email != null && !email.isBlank()) {
            return email;
        }
        return claims.getSubject();
    }

    /**
     * Extracts and maps authority roles from JWT claims.
     *
     * <p><b>Purpose:</b> Normalizes roles and expands composite administrative roles into problem domain roles.
     *
     * <p><b>Downstream / Workflow:</b> Populates the Spring Security authorities collection.
     *
     * @param token Bearer JWT.
     * @return List of role names.
     */
    public List<String> extractRoles(String token) {
        Claims claims = getClaims(token);
        List<String> result = new ArrayList<>();

        Object rawRoles = claims.get("roles");
        if (rawRoles instanceof Collection<?> coll) {
            for (Object r : coll) {
                if (r instanceof String s) {
                    addMappedRole(result, s);
                }
            }
        }

        String singleRole = claims.get("role", String.class);
        if (singleRole != null && !singleRole.isBlank()) {
            addMappedRole(result, singleRole);
        }

        if (result.isEmpty()) {
            result.add("EMPLOYEE");
        }
        return result;
    }

    /**
     * Maps incoming role string to standardized internal roles.
     *
     * <p><b>Purpose:</b> Normalizes MANAGER_ADMIN into fine-grained ITIL problem roles.
     *
     * <p><b>Downstream / Workflow:</b> Internal helper for {@link #extractRoles(String)}.
     *
     * @param result Collector list.
     * @param r Raw role string.
     */
    private void addMappedRole(List<String> result, String r) {
        String normalized = r.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        if (normalized.equals("MANAGER_ADMIN") || normalized.equals("ADMIN") || normalized.equals("ADMINISTRATOR")) {
            if (!result.contains("ADMIN")) result.add("ADMIN");
            if (!result.contains("PROBLEM_MANAGER")) result.add("PROBLEM_MANAGER");
            if (!result.contains("PROBLEM_ANALYST")) result.add("PROBLEM_ANALYST");
            if (!result.contains("TECHNICAL_SUPPORT_ENGINEER")) result.add("TECHNICAL_SUPPORT_ENGINEER");
            if (!result.contains("EMPLOYEE")) result.add("EMPLOYEE");
        } else {
            if (!result.contains(normalized)) {
                result.add(normalized);
            }
        }
    }
}
