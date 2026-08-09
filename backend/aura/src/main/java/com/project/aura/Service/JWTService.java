package com.project.aura.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JWTService {
    private static final String SECRET = "AURA_SUPER_SECRET_KEY_FOR_JWT_TOKEN_GENERATION_2026_HEALTHCARE";
    private static final long EXPIRATION_TIME = 86400000; // 24 hours in milliseconds

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

//    this is method being used in JwtFilter
    public String extratUserName(String token) {
        return "";
    }

    public boolean validataToken(String token, UserDetails userDetails) {
        return true;
    }
}
