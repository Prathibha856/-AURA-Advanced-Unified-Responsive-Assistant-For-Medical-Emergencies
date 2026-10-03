package com.project.aura.SupplyChain.DTO;

import com.project.aura.SupplyChain.Entity.SupplyRequest;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Response DTO for a SupplyRequest.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplyRequestResponseDTO {

    private Integer requestId;
    private Integer alertId;
    private String sourceHospitalName;
    private Integer sourceHospitalId;
    private String destinationHospitalName;
    private Integer destinationHospitalId;
    private String itemName;
    private Integer itemId;
    private Integer requestedQuantity;
    private SupplyRequest.RequestStatus status;
    private LocalDateTime createdAt;
}
