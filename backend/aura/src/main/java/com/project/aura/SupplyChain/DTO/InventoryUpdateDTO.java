package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Request DTO for updating or setting a hospital's inventory item quantity.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryUpdateDTO {
    private Integer hospitalId;
    private Integer itemId;
    private Integer quantity;
}
