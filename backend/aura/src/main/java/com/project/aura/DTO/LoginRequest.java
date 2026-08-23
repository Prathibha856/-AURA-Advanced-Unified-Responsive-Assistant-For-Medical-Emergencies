package com.project.aura.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    /** Can be either username or email — both are accepted */
    //below annotation can be use to accept either username or email as input
    @JsonAlias({ "username", "email"})
    private String principal;
    private String password;

}
