package com.project.aura.DTO;

import com.project.aura.Entity.SosAlert;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SosAlertResponseDTO {

    private Integer alertId;
    private Integer userId;
    private String userName;
    private HospitalDTO nearestHospital;
    private Double latitude;
    private Double longitude;
    private SosAlert.AlertStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime resolvedAt;
    private String responseMessage;
}
