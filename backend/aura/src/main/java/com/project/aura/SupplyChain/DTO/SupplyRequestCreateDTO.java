package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Request DTO for creating a supply request (a supply admin responding to an alert).
 * The admin specifies which alert they're responding to, which item, and how many.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplyRequestCreateDTO {

    /** ID of the SupplyAlert being responded to. */
    private Integer alertId;

    /** ID of the InventoryItem being offered. */
    private Integer itemId;

    /** Quantity the source hospital is willing to dispatch. */
    private Integer quantity;
}
