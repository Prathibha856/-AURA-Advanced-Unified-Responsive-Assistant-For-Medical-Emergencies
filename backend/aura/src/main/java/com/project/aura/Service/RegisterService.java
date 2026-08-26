package com.project.aura.Service;

import com.project.aura.DTO.AuthResponse;
import com.project.aura.DTO.LoginRequest;
import com.project.aura.DTO.RegisterRequest;
import com.project.aura.Entity.Users;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class RegisterService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    // ────────────────────────────────────────────────────────────────────────────
    // Registration
    // ────────────────────────────────────────────────────────────────────────────

    public Users newRegister(RegisterRequest registerRequest) {

        // Prevent duplicate emails
        if (userRepo.existsByUserEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        Users users = new Users();
        users.setUsername(registerRequest.getUsername());
        users.setUserEmail(registerRequest.getEmail());
        users.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        users.setRole(registerRequest.getRole());

        return userRepo.save(users);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Login — returns JWT token wrapped in AuthResponse
    // ────────────────────────────────────────────────────────────────────────────

    public AuthResponse verify(LoginRequest loginRequest) {

        // Authenticate using principal (username or email) + password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getPrincipal(),
                        loginRequest.getPassword()
                )
        );

        if (!authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication failed");
        }

        // Resolve the actual user entity
        Users user = userRepo.findByUsername(loginRequest.getPrincipal());
        if (user == null) {
            user = userRepo.findByUserEmail(loginRequest.getPrincipal()).orElseThrow(
                    () -> new RuntimeException("User not found after authentication"));
        }

        String token = jwtService.generateToken(authentication.getName());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserid())
                .username(user.getUsername())
                .email(user.getUserEmail())
                .role(user.getRole())
                .build();
    }
}
