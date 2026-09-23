package com.project.aura.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sos_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SosAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Integer alertId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AlertStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Timestamp when hospital admin accepted (ACKNOWLEDGED) the alert */
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    /** Timestamp when hospital admin marked the alert as RESOLVED */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    /**
     * Response message from the hospital back to the user.
     * e.g. "Ambulance #12 dispatched, ETA 7 minutes"
     */
    @Column(name = "response_message", length = 500)
    private String responseMessage;

    /**
     * Tracks hospital IDs that rejected this alert, so the rerouting
     * logic can skip them and assign the next nearest hospital.
     */
    @ElementCollection
    @CollectionTable(name = "sos_rejected_hospitals", joinColumns = @JoinColumn(name = "alert_id"))
    @Column(name = "hospital_id")
    @Builder.Default
    private List<Integer> rejectedHospitalIds = new ArrayList<>();

    public enum AlertStatus {
        PENDING, ACKNOWLEDGED, REJECTED, RESOLVED
    }
}
