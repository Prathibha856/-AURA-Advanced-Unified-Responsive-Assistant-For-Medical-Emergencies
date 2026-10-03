package com.project.aura.SupplyChain.DTO;

import com.project.aura.SupplyChain.Entity.SupplyAlert;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full dashboard response for a supply admin viewing an alert.
 * Includes:
 * - The alert metadata
 * - The affected hospital info
 * - The disease info and required items
 * - The receiving hospital's current inventory for relevant items
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplyAlertResponseDTO {

    private Integer alertId;

    // Alert metadata
    private SupplyAlert.AlertStatus status;
    private LocalDateTime createdAt;

    // Outbreak info
    private Integer reportId;
    private String affectedHospitalName;
    private Integer affectedHospitalId;
    private String diseaseName;
    private Integer diseaseId;
    private Integer reportedCases;

    // The hospital this alert was sent to (the one that can supply)
    private String receivingHospitalName;
    private Integer receivingHospitalId;

    // What is required for this disease
    private List<RequirementDTO> requirements;

    // What the receiving hospital currently has in stock (for relevant items)
    private List<InventoryStockDTO> currentInventory;
}
