package com.project.aura.Service;

import com.project.aura.DTO.RegisterRequest;
import com.project.aura.Entity.Users;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authorization.method.AuthorizeReturnObject;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


@Service
public class RegisterService {
    @Autowired
    private UserRepo userRepo;

    @Autowired
    AuthenticationManager authenticationManager;

    BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder(3);


    public Users newRegister(RegisterRequest registerRequest) {

        // 1. Check if email already exists
        if (userRepo.existsByUserEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }


        Users users = new Users();

        users.setUsername(registerRequest.getUsername());
        users.setUserEmail(registerRequest.getEmail());
        users.setPassword(bCryptPasswordEncoder.encode(registerRequest.getPassword()));
        users.setRole(registerRequest.getRole());
        return userRepo.save(users);
    }
}
