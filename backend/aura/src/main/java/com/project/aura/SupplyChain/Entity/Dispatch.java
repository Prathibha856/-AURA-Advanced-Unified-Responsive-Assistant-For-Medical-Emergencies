package com.project.aura.SupplyChain.Entity;

import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks the physical shipment of supplies from a source hospital to a destination hospital.
 * One Dispatch corresponds to one SupplyRequest (but a request could have multiple dispatches
 * if partial — kept simple here: one Dispatch per accepted SupplyRequest).
 *
 * Lifecycle:
 *   CREATED → DISPATCHED → IN_TRANSIT → DELIVERED → RECEIVED
 *   or: CANCELLED at any point before RECEIVED
 *
 * Inventory updates:
 *   - Source inventory decreases when status moves to DISPATCHED.
 *   - Destination inventory increases when status moves to RECEIVED.
 */
@Entity
@Table(name = "sc_dispatches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispatch_id")
    private Integer dispatchId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supply_request_id", nullable = false)
    private SupplyRequest supplyRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_hospital_id", nullable = false)
    private Hospital sourceHospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_hospital_id", nullable = false)
    private Hospital destinationHospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private DispatchStatus status = DispatchStatus.CREATED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    public enum DispatchStatus {
        CREATED,
        DISPATCHED,
        IN_TRANSIT,
        DELIVERED,
        RECEIVED,
        CANCELLED
    }
}
