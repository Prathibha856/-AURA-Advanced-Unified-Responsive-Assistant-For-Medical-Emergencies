package com.project.aura.DTO;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SosAlertRequest {

    private Integer userId;
    private Double latitude;
    private Double longitude;
}
