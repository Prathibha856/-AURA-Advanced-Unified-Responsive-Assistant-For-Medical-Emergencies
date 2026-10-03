package com.project.aura.SupplyChain.DTO;

import lombok.*;

/**
 * Request DTO for submitting an outbreak report.
 * Hospital A posts this when they observe disease cases.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutbreakReportRequestDTO {

    /** ID of the hospital reporting the cases (Hospital A). */
    private Integer hospitalId;

    /** ID of the disease being reported. */
    private Integer diseaseId;

    /** Number of cases observed. Compared against the configured threshold. */
    private Integer reportedCases;
}
