package com.project.aura.DTO;

import com.project.aura.Entity.SosAlert;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SosAlertResponse {

    private Integer alertId;
    private Integer userId;
    private HospitalDTO nearestHospital;
    private Double latitude;
    private Double longitude;
    private SosAlert.AlertStatus status;
    private LocalDateTime createdAt;
}
