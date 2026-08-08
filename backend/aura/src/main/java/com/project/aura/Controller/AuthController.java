package com.project.aura.Controller;

import com.project.aura.DTO.LoginRequest;
import com.project.aura.DTO.LoginResponse;
import com.project.aura.DTO.RegisterRequest;
import com.project.aura.Entity.Users;
import com.project.aura.Service.LoginService;
import com.project.aura.Service.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private RegisterService registerService;

    @Autowired
    private LoginService loginService;

    @PostMapping("/register")
    public ResponseEntity<String> newRegister(@RequestBody RegisterRequest registerRequest){
        Users saveUsers = registerService.newRegister(registerRequest);
        return ResponseEntity.ok("User registered successfully with ID: " + saveUsers.getUserid());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try{
            LoginResponse loginResponse = loginService.login(loginRequest);
            return ResponseEntity.ok(loginResponse);
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
//        return loginService.login(users);
//        return ResponseEntity.ok("The Login Successful"+verifyUsers.)
    }
}
