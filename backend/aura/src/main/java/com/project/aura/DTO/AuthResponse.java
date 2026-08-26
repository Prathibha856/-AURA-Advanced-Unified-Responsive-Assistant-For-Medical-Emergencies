package com.project.aura.DTO;

import com.project.aura.Entity.Users;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String tokenType;
    private Integer userId;
    private String username;
    private String email;
    private Users.Role role;
}
