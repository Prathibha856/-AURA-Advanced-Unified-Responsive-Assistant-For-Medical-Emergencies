package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Represents the available stock of an item at the receiving hospital.
 * Used inside SupplyAlertResponseDTO so the admin can see their inventory
 * alongside what is required.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryStockDTO {
    private Integer itemId;
    private String itemName;
    private String unit;
    private Integer availableQuantity;
}
