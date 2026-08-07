package com.project.aura.Controller;

import com.project.aura.DTO.RegisterRequest;
import com.project.aura.Entity.Users;
import com.project.aura.Service.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @PostMapping("/register")
    public ResponseEntity<String> newRegister(@RequestBody RegisterRequest registerRequest){
        Users saveUsers = registerService.newRegister(registerRequest);
        return ResponseEntity.ok("User registered successfully with ID: " + saveUsers.getUserid());
    }



//    @PostMapping("api/auth/login")
}
