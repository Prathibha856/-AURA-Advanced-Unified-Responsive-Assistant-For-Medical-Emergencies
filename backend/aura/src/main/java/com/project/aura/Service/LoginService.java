package com.project.aura.Service;

import com.project.aura.DTO.LoginRequest;
import com.project.aura.DTO.LoginResponse;
import com.project.aura.Entity.Users;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTService jwtService;

    @Autowired
    AuthenticationManager authenticationManager;

    public LoginResponse login(LoginRequest request) {
        // 1. Check if user exists by email
        Users user = userRepo.findByUserEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // 2. Verify password against encrypted password hash in DB
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // 3. Generate JWT Token
        String token = jwtService.generateToken(user.getUserEmail(), user.getRole().name());

        // 4. Return token and basic user info to React
        return new LoginResponse(token, user.getUserEmail(), user.getRole().name());
    }
}
