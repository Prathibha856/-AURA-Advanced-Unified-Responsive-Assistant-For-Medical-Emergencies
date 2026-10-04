package com.project.aura.Controller;

import com.project.aura.DTO.AuthResponse;
import com.project.aura.DTO.LoginRequest;
import com.project.aura.DTO.RegisterRequest;
import com.project.aura.DTO.RegisterResponse;
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
     * Returns: { "message": "Registration successful, login again to access dashboard" }
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> newRegister(@RequestBody RegisterRequest registerRequest) {
        registerService.newRegister(registerRequest);
        return ResponseEntity.ok(
            new RegisterResponse("Registration successful, login again to access dashboard")
        );
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
