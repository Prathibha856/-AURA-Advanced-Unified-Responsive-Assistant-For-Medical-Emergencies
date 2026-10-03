package com.project.aura.SupplyChain.Entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Maps a Disease to a required InventoryItem with a suggested quantity.
 * Example: Dengue → IV Fluids (100 units), Paracetamol (50 units)
 */
@Entity
@Table(name = "sc_disease_requirements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiseaseRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requirement_id")
    private Integer requirementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    /**
     * Suggested quantity to have on hand per outbreak event.
     */
    @Column(name = "suggested_quantity", nullable = false)
    private Integer suggestedQuantity;
}
