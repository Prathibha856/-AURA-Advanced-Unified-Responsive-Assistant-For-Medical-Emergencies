package com.project.aura.SupplyChain.DTO;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a hospital's full inventory.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalInventoryResponseDTO {
    private Integer hospitalId;
    private String hospitalName;
    private List<InventoryStockDTO> inventory;
    private LocalDateTime retrievedAt;
}
