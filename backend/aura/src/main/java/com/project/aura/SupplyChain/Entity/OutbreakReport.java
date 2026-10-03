package com.project.aura.SupplyChain.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.aura.Entity.Hospital;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Records that Hospital A has reported N cases of a disease.
 * The rule-based outbreak service evaluates this against a threshold.
 *
 * If reportedCases >= threshold → outbreakDetected = true,
 * and corresponding SupplyAlerts are created for connected hospitals.
 */
@Entity
@Table(name = "sc_outbreak_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OutbreakReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    /** The hospital that reported the cases (Hospital A). */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(name = "reported_cases", nullable = false)
    private Integer reportedCases;

    /**
     * True if reportedCases >= configured outbreak threshold at submission time.
     * Set by RuleBasedOutbreakService, not by the caller.
     */
    @Column(name = "outbreak_detected", nullable = false)
    @Builder.Default
    private Boolean outbreakDetected = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
