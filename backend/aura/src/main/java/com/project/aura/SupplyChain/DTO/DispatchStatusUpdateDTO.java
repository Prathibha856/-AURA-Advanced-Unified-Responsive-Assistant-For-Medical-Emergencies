package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Request DTO for updating dispatch status.
 * The admin provides the new status value.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchStatusUpdateDTO {
    /** New status string, e.g. "DISPATCHED", "IN_TRANSIT", "DELIVERED", "RECEIVED" */
    private String status;
}
