package com.project.aura.Controller;

import com.project.aura.DTO.AuthResponse;
import com.project.aura.DTO.LoginRequest;
import com.project.aura.DTO.RegisterRequest;
import com.project.aura.Entity.Users;
import com.project.aura.Service.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private RegisterService registerService;

    /**
     * POST /api/auth/register
     * Body: { "username": "...", "email": "...", "password": "...", "role": "PATIENT" }
     */
    @PostMapping("/register")
    public ResponseEntity<String> newRegister(@RequestBody RegisterRequest registerRequest) {
        Users savedUser = registerService.newRegister(registerRequest);
        return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getUserid());
    }

    /**
     * POST /api/auth/login
     * Body: { "principal": "username_or_email", "password": "..." }
     * Returns: { "token": "...", "tokenType": "Bearer", "userId": ..., "role": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        AuthResponse response = registerService.verify(loginRequest);
        return ResponseEntity.ok(response);
    }
}
