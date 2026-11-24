package com.example.problem_service.security;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import io.jsonwebtoken.Jwts;
import java.util.Date;
import io.jsonwebtoken.JwtException;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);

            System.out.println("JWT VALIDATION SUCCESS");
            return true;

        } catch (JwtException | IllegalArgumentException e) {
            System.out.println("JWT VALIDATION FAILED: "
                    + e.getClass().getSimpleName()
                    + " - " + e.getMessage());

            return false;
        }
    }

    public String extractEmail(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .get("role", String.class);
    }
}