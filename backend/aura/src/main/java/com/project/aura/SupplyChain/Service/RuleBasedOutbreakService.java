package com.project.aura.SupplyChain.Service;

import com.project.aura.Entity.Hospital;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.SupplyChain.DTO.OutbreakReportRequestDTO;
import com.project.aura.SupplyChain.DTO.OutbreakReportResponseDTO;
import com.project.aura.SupplyChain.Entity.*;
import com.project.aura.SupplyChain.Repository.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * RULE-BASED OUTBREAK DETECTION SERVICE
 *
 * Core rule:
 *   IF reportedCases >= aura.outbreak.threshold
 *   THEN outbreakDetected = true
 *        AND create SupplyAlerts for all connected hospitals
 *
 * The threshold is configurable via application.properties:
 *   aura.outbreak.threshold=50
 *
 * This service does NOT use ML, AI, or complex epidemiology.
 * It is intentionally rule-based for simplicity and demonstrability.
 */
@Service
public class RuleBasedOutbreakService {

    private static final Logger log = LoggerFactory.getLogger(RuleBasedOutbreakService.class);

    /**
     * Configurable outbreak threshold from application.properties.
     * Default is 50 if not configured.
     */
    @Value("${aura.outbreak.threshold:50}")
    private int outbreakThreshold;

    private final HospitalRepo hospitalRepo;
    private final DiseaseRepository diseaseRepository;
    private final OutbreakReportRepository outbreakReportRepository;
    private final HospitalConnectionRepository hospitalConnectionRepository;
    private final SupplyAlertRepository supplyAlertRepository;

    public RuleBasedOutbreakService(
            HospitalRepo hospitalRepo,
            DiseaseRepository diseaseRepository,
            OutbreakReportRepository outbreakReportRepository,
            HospitalConnectionRepository hospitalConnectionRepository,
            SupplyAlertRepository supplyAlertRepository) {
        this.hospitalRepo = hospitalRepo;
        this.diseaseRepository = diseaseRepository;
        this.outbreakReportRepository = outbreakReportRepository;
        this.hospitalConnectionRepository = hospitalConnectionRepository;
        this.supplyAlertRepository = supplyAlertRepository;
    }

    /**
     * Processes an outbreak case report:
     * 1. Validates inputs
     * 2. Saves the OutbreakReport
     * 3. Applies the rule: reportedCases >= threshold → outbreak detected
     * 4. If outbreak: creates SupplyAlerts for all connected hospitals
     *
     * @param dto the incoming report from Hospital A
     * @return response with detection result and alert count
     */
    @Transactional
    public OutbreakReportResponseDTO processOutbreakReport(OutbreakReportRequestDTO dto) {
        // ── 1. Validate and load entities ─────────────────────────────────────
        Hospital hospital = hospitalRepo.findById(dto.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hospital not found with id: " + dto.getHospitalId()));

        Disease disease = diseaseRepository.findById(dto.getDiseaseId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Disease not found with id: " + dto.getDiseaseId()));

        if (dto.getReportedCases() == null || dto.getReportedCases() < 0) {
            throw new IllegalArgumentException("Reported cases must be a non-negative integer.");
        }

        // ── 2. Apply the rule ──────────────────────────────────────────────────
        boolean outbreakDetected = dto.getReportedCases() >= outbreakThreshold;

        log.info("[OUTBREAK-RULE] Hospital='{}' Disease='{}' Cases={} Threshold={} → OutbreakDetected={}",
                hospital.getName(), disease.getName(),
                dto.getReportedCases(), outbreakThreshold, outbreakDetected);

        // ── 3. Save the report ─────────────────────────────────────────────────
        OutbreakReport report = OutbreakReport.builder()
                .hospital(hospital)
                .disease(disease)
                .reportedCases(dto.getReportedCases())
                .outbreakDetected(outbreakDetected)
                .build();
        report = outbreakReportRepository.save(report);

        // ── 4. If outbreak detected, notify connected hospitals ────────────────
        int alertsCreated = 0;
        String message;

        if (outbreakDetected) {
            alertsCreated = createAlertsForConnectedHospitals(hospital, report);
            message = String.format(
                    "OUTBREAK DETECTED: %d cases of %s reported at %s (threshold: %d). %d alert(s) created.",
                    dto.getReportedCases(), disease.getName(), hospital.getName(),
                    outbreakThreshold, alertsCreated);
            log.info("[OUTBREAK-RULE] {}", message);
        } else {
            message = String.format(
                    "Report saved. No outbreak detected: %d cases below threshold of %d.",
                    dto.getReportedCases(), outbreakThreshold);
            log.info("[OUTBREAK-RULE] {}", message);
        }

        // ── 5. Build and return response ───────────────────────────────────────
        return OutbreakReportResponseDTO.builder()
                .reportId(report.getReportId())
                .hospitalName(hospital.getName())
                .diseaseName(disease.getName())
                .reportedCases(dto.getReportedCases())
                .threshold(outbreakThreshold)
                .outbreakDetected(outbreakDetected)
                .alertsCreated(alertsCreated)
                .createdAt(report.getCreatedAt())
                .message(message)
                .build();
    }

    /**
     * Creates one SupplyAlert per connected hospital when an outbreak is detected.
     * Connected hospitals are loaded from HospitalConnection table (no GIS needed).
     *
     * @param affectedHospital Hospital A (the one reporting the outbreak)
     * @param report           the saved OutbreakReport
     * @return number of alerts created
     */
    private int createAlertsForConnectedHospitals(Hospital affectedHospital, OutbreakReport report) {
        List<HospitalConnection> connections =
                hospitalConnectionRepository.findByHospital(affectedHospital);

        if (connections.isEmpty()) {
            log.warn("[OUTBREAK-RULE] No connected hospitals found for '{}'. No alerts created.",
                    affectedHospital.getName());
        }

        int count = 0;
        for (HospitalConnection connection : connections) {
            Hospital receivingHospital = connection.getConnectedHospital();

            SupplyAlert alert = SupplyAlert.builder()
                    .outbreakReport(report)
                    .receivingHospital(receivingHospital)
                    .status(SupplyAlert.AlertStatus.PENDING)
                    .build();
            supplyAlertRepository.save(alert);

            log.info("[OUTBREAK-RULE] Alert created for hospital '{}' (id={})",
                    receivingHospital.getName(), receivingHospital.getHospitalId());
            count++;
        }
        return count;
    }

    /**
     * Returns the currently configured outbreak threshold.
     * Useful for exposing configuration via API.
     */
    public int getOutbreakThreshold() {
        return outbreakThreshold;
    }
}
