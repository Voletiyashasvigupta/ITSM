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

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

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

    public String extractEmail(String token) {
        Claims claims = getClaims(token);
        String email = claims.get("email", String.class);
        if (email != null && !email.isBlank()) {
            return email;
        }
        return claims.getSubject();
    }

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
