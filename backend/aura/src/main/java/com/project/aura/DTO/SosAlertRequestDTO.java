package com.project.aura.DTO;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SosAlertRequestDTO {

    private Integer userId;
    private Double latitude;
    private Double longitude;
}
