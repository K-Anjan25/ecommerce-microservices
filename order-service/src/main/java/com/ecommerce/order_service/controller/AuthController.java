package com.ecommerce.order_service.controller;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final String SECRET_KEY = "my-secret-key";

    @PostMapping("/login")
    public String login(
            @RequestParam String username,
            @RequestParam String password
    ) {
        // Simple demo validation (portfolio safe)
        if ("admin".equals(username) && "admin".equals(password)) {

            return Jwts.builder()
                    .setSubject(username)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 3600000)) // 1 hour
                    .signWith(SignatureAlgorithm.HS256, SECRET_KEY)
                    .compact();
        }

        throw new RuntimeException("Invalid credentials");
    }
}
