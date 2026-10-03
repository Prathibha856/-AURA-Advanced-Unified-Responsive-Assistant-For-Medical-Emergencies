package com.project.aura.SupplyChain.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A SupplyAlert is generated when an outbreak is detected at Hospital A.
 * One SupplyAlert is created per receiving hospital (B, C, D).
 *
 * Supply admins at B/C/D see alerts in their dashboard and decide whether
 * to respond with a supply offer or reject.
 */
@Entity
@Table(name = "sc_supply_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SupplyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Integer alertId;

    /** The outbreak report that triggered this alert. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "report_id", nullable = false)
    private OutbreakReport outbreakReport;

    /**
     * The hospital that RECEIVES this alert (B, C, or D).
     * They are expected to help supply the affected hospital.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiving_hospital_id", nullable = false)
    private Hospital receivingHospital;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum AlertStatus {
        PENDING,
        RESPONDED,
        REJECTED,
        CLOSED
    }
}
