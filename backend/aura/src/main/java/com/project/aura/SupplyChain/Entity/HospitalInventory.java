package com.project.aura.SupplyChain.Entity;

import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;

/**
 * Tracks the stock quantity of a specific InventoryItem at a specific Hospital.
 * This is the persistent, PostgreSQL-backed inventory table.
 *
 * Invariant: quantity >= 0 is enforced in service layer (never goes negative).
 */
@Entity
@Table(
    name = "sc_hospital_inventory",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_hospital_item",
        columnNames = {"hospital_id", "item_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Integer inventoryId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}
