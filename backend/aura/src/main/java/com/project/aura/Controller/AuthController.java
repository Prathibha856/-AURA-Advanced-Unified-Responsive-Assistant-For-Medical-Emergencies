package com.project.aura.Controller;

import com.project.aura.Entity.Users;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController

public class AuthController {
    @PostMapping("/api/auth/register")
    public Users newRegister(@RequestBody Users users){
        return registerService.newRegister(users);
    }



//    @PostMapping("api/auth/login")
}
