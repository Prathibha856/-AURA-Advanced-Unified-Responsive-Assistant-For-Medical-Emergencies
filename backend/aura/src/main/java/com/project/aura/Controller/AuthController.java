package com.project.aura.Controller;

import com.project.aura.Entity.Users;
import com.project.aura.Service.RegisterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @Autowired
    private RegisterService registerService;

    @PostMapping("/api/auth/register")
    public Users newRegister(@RequestBody Users users){
        return registerService.newRegister(users);
    }



//    @PostMapping("api/auth/login")
}
