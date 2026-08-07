package com.project.aura.DTO;

import com.project.aura.Entity.Users;
import lombok.Getter;
import lombok.Setter;


//this DTO is using for the user to register only by using username, etc etc
//the user should not pass thier ID, it should be done automatically by DB

@Getter
@Setter
public class RegisterRequest {

    private String username;
    private String email;
    private String password;
    private Users.Role role; // PATIENT, HOSPITAL_ADMIN, or SUPPLY_ADMIN
}

