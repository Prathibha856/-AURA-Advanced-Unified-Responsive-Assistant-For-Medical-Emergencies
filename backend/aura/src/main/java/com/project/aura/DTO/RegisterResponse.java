package com.project.aura.DTO;

import lombok.*;

/**
 * RegisterResponse — Minimal JSON DTO returned on successful user registration.
 * Contains ONLY a human-readable message. No user ID, email, role, or credentials
 * are exposed to the frontend.
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterResponse {

    private String message;
}
