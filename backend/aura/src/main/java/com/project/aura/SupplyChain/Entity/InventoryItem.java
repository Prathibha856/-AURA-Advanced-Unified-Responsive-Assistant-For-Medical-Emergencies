package com.project.aura.SupplyChain.Entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a type of medical supply item (e.g., "IV Fluids", "Paracetamol").
 * This is a catalogue-level entity; actual stock quantities are tracked in HospitalInventory.
 */
@Entity
@Table(name = "sc_inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer itemId;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "unit", nullable = false)
    private String unit; // e.g., "units", "bottles", "vials"

    @Column(name = "description", length = 500)
    private String description;
}
