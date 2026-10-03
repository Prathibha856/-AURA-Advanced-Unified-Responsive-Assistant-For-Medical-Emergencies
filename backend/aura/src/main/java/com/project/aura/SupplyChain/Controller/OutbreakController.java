package com.project.aura.SupplyChain.Controller;

import com.project.aura.SupplyChain.DTO.OutbreakReportRequestDTO;
import com.project.aura.SupplyChain.DTO.OutbreakReportResponseDTO;
import com.project.aura.SupplyChain.Entity.OutbreakReport;
import com.project.aura.SupplyChain.Service.RuleBasedOutbreakService;
import com.project.aura.SupplyChain.Service.SupplyChainService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Outbreak Report Controller
 *
 * Endpoint: POST /api/supply/outbreak
 *   - Hospital A submits case counts
 *   - The rule-based engine evaluates and creates alerts if threshold is reached
 *
 * Endpoint: GET /api/supply/outbreaks
 *   - Lists all outbreak reports (hospital admins and supply admins)
 *
 * Security: HOSPITAL_ADMIN can submit reports for their hospital.
 *           SUPPLY_ADMIN and HOSPITAL_ADMIN can view reports.
 */
@RestController
@RequestMapping("/api/supply")
public class OutbreakController {

    private final RuleBasedOutbreakService ruleBasedOutbreakService;
    private final SupplyChainService supplyChainService;

    public OutbreakController(RuleBasedOutbreakService ruleBasedOutbreakService,
                               SupplyChainService supplyChainService) {
        this.ruleBasedOutbreakService = ruleBasedOutbreakService;
        this.supplyChainService = supplyChainService;
    }

    /**
     * POST /api/supply/outbreak
     * Hospital A reports disease case count.
     * If cases >= threshold, an outbreak is detected and alerts are generated.
     *
     * Body: { "hospitalId": 1, "diseaseId": 2, "reportedCases": 55 }
     */
    @PostMapping("/outbreak")
    @PreAuthorize("hasAnyAuthority('HOSPITAL_ADMIN', 'SUPPLY_ADMIN')")
    public ResponseEntity<OutbreakReportResponseDTO> reportOutbreak(
            @RequestBody OutbreakReportRequestDTO dto) {
        OutbreakReportResponseDTO response = ruleBasedOutbreakService.processOutbreakReport(dto);
        HttpStatus status = response.getOutbreakDetected() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(response);
    }

    /**
     * GET /api/supply/outbreaks
     * Returns all outbreak reports.
     */
    @GetMapping("/outbreaks")
    @PreAuthorize("hasAnyAuthority('HOSPITAL_ADMIN', 'SUPPLY_ADMIN')")
    public ResponseEntity<List<OutbreakReport>> getAllOutbreaks() {
        return ResponseEntity.ok(supplyChainService.getAllOutbreakReports());
    }

    /**
     * GET /api/supply/outbreaks/active
     * Returns only reports where outbreakDetected = true.
     */
    @GetMapping("/outbreaks/active")
    @PreAuthorize("hasAnyAuthority('HOSPITAL_ADMIN', 'SUPPLY_ADMIN')")
    public ResponseEntity<List<OutbreakReport>> getActiveOutbreaks() {
        return ResponseEntity.ok(supplyChainService.getActiveOutbreaks());
    }

    /**
     * GET /api/supply/outbreak/threshold
     * Returns the currently configured outbreak threshold (useful for debugging/display).
     */
    @GetMapping("/outbreak/threshold")
    @PreAuthorize("hasAnyAuthority('HOSPITAL_ADMIN', 'SUPPLY_ADMIN')")
    public ResponseEntity<Map<String, Integer>> getThreshold() {
        return ResponseEntity.ok(Map.of("threshold", ruleBasedOutbreakService.getOutbreakThreshold()));
    }
}
