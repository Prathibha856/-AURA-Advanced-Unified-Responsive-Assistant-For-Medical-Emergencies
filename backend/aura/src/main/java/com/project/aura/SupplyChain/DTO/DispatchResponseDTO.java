package com.project.aura.SupplyChain.DTO;

import com.project.aura.SupplyChain.Entity.Dispatch;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Response DTO for a Dispatch.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchResponseDTO {

    private Integer dispatchId;
    private Integer requestId;
    private String sourceHospitalName;
    private Integer sourceHospitalId;
    private String destinationHospitalName;
    private Integer destinationHospitalId;
    private String itemName;
    private Integer itemId;
    private Integer quantity;
    private Dispatch.DispatchStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime receivedAt;
}
