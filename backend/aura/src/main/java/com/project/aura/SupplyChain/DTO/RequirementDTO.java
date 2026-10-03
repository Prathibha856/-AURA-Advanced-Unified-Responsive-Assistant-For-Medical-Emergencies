package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Represents one required item and its suggested quantity for a disease outbreak.
 * Used inside SupplyAlertResponseDTO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequirementDTO {
    private Integer itemId;
    private String itemName;
    private String unit;
    private Integer suggestedQuantity;
}
