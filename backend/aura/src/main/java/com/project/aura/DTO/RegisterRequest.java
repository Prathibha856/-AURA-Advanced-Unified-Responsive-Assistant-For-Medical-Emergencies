package com.project.aura.DTO;

import com.project.aura.Entity.Users;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    private String username;
    private String email;
    private String password;
    private Users.Role role; // PATIENT, HOSPITAL_ADMIN, or SUPPLY_ADMIN
}

