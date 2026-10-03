package com.project.aura.SupplyChain.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;

/**
 * Defines a directed "connected hospital" relationship.
 * When Hospital A reports an outbreak, alerts are sent to all hospitals
 * that have a HospitalConnection record pointing FROM A (hospital) TO them (connectedHospital).
 *
 * Example:
 *   HospitalConnection { hospital = A, connectedHospital = B }
 *   HospitalConnection { hospital = A, connectedHospital = C }
 *   HospitalConnection { hospital = A, connectedHospital = D }
 *
 * This means when A has an outbreak, B, C, D are notified.
 *
 * This is intentionally simple — no GIS, no distance calculation.
 * Administrators configure the connections in the database.
 */
@Entity
@Table(
    name = "sc_hospital_connections",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_hospital_connection",
        columnNames = {"hospital_id", "connected_hospital_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HospitalConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "connection_id")
    private Integer connectionId;

    /**
     * The affected / source hospital (Hospital A).
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    /**
     * The connected hospital that should receive alerts when
     * the source hospital reports an outbreak.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "connected_hospital_id", nullable = false)
    private Hospital connectedHospital;
}
