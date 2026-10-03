package com.project.aura.SupplyChain.Entity;

import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A SupplyRequest is created when a supply admin at Hospital B/C/D
 * accepts/responds to a SupplyAlert and offers a specific quantity of an item.
 *
 * Flow: PENDING → ACCEPTED → FULFILLED (after dispatch + receipt)
 *   or: PENDING → REJECTED / CANCELLED
 */
@Entity
@Table(name = "sc_supply_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    /** The alert that this request is responding to. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "alert_id", nullable = false)
    private SupplyAlert supplyAlert;

    /**
     * The hospital offering to supply (source: B, C, or D).
     * Derived from supplyAlert.receivingHospital but stored explicitly for clarity.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_hospital_id", nullable = false)
    private Hospital sourceHospital;

    /**
     * The hospital that needs supplies (destination: A).
     * Derived from supplyAlert.outbreakReport.hospital but stored explicitly.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_hospital_id", nullable = false)
    private Hospital destinationHospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(name = "requested_quantity", nullable = false)
    private Integer requestedQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum RequestStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        FULFILLED,
        CANCELLED
    }
}
