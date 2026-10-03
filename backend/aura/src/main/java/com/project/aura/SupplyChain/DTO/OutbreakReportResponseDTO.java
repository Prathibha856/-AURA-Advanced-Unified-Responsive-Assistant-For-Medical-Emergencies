package com.project.aura.SupplyChain.DTO;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Response DTO returned after submitting an outbreak report.
 * Tells the caller whether an outbreak was detected and alerts were generated.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutbreakReportResponseDTO {

    private Integer reportId;
    private String hospitalName;
    private String diseaseName;
    private Integer reportedCases;
    private Integer threshold;
    private Boolean outbreakDetected;
    private Integer alertsCreated;
    private LocalDateTime createdAt;
    private String message;
}
