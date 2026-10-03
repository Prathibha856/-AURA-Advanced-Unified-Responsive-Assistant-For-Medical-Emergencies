package com.project.aura.SupplyChain.Controller;

import com.project.aura.Entity.Hospital;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.SupplyChain.Entity.*;
import com.project.aura.SupplyChain.Repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Supply Chain Administration Controller
 *
 * Provides endpoints for seeding and managing the catalogue data:
 * - Diseases
 * - InventoryItems
 * - DiseaseRequirements (disease → item mapping)
 * - HospitalConnections (which hospitals receive alerts from which)
 *
 * All operations require HOSPITAL_ADMIN or SUPPLY_ADMIN role.
 *
 * Example setup workflow:
 *   1. POST /api/admin/supply/items          → Create "IV Fluids", "Paracetamol"
 *   2. POST /api/admin/supply/diseases       → Create "Dengue"
 *   3. POST /api/admin/supply/requirements   → Map Dengue → IV Fluids (100 units)
 *   4. POST /api/admin/supply/connections    → Connect Hospital A → Hospital B, C, D
 */
@RestController
@RequestMapping("/api/admin/supply")
@PreAuthorize("hasAnyAuthority('HOSPITAL_ADMIN', 'SUPPLY_ADMIN')")
public class SupplyCatalogueController {

    private final DiseaseRepository diseaseRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final DiseaseRequirementRepository diseaseRequirementRepository;
    private final HospitalConnectionRepository hospitalConnectionRepository;
    private final HospitalRepo hospitalRepo;

    public SupplyCatalogueController(
            DiseaseRepository diseaseRepository,
            InventoryItemRepository inventoryItemRepository,
            DiseaseRequirementRepository diseaseRequirementRepository,
            HospitalConnectionRepository hospitalConnectionRepository,
            HospitalRepo hospitalRepo) {
        this.diseaseRepository = diseaseRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.diseaseRequirementRepository = diseaseRequirementRepository;
        this.hospitalConnectionRepository = hospitalConnectionRepository;
        this.hospitalRepo = hospitalRepo;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INVENTORY ITEMS
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/admin/supply/items */
    @GetMapping("/items")
    public ResponseEntity<List<InventoryItem>> getAllItems() {
        return ResponseEntity.ok(inventoryItemRepository.findAll());
    }

    /**
     * POST /api/admin/supply/items
     * Body: { "name": "IV Fluids", "unit": "units", "description": "..." }
     */
    @PostMapping("/items")
    public ResponseEntity<InventoryItem> createItem(@RequestBody InventoryItem item) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryItemRepository.save(item));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISEASES
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/admin/supply/diseases */
    @GetMapping("/diseases")
    public ResponseEntity<List<Disease>> getAllDiseases() {
        return ResponseEntity.ok(diseaseRepository.findAll());
    }

    /**
     * POST /api/admin/supply/diseases
     * Body: { "name": "Dengue", "description": "..." }
     */
    @PostMapping("/diseases")
    public ResponseEntity<Disease> createDisease(@RequestBody Disease disease) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diseaseRepository.save(disease));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISEASE REQUIREMENTS (Disease → InventoryItem mapping)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/admin/supply/requirements
     * Maps a disease to a required item with a suggested quantity.
     *
     * Body: { "diseaseId": 1, "itemId": 2, "suggestedQuantity": 100 }
     */
    @PostMapping("/requirements")
    @Transactional
    public ResponseEntity<DiseaseRequirement> createRequirement(
            @RequestBody Map<String, Integer> body) {

        Integer diseaseId = body.get("diseaseId");
        Integer itemId = body.get("itemId");
        Integer suggestedQuantity = body.get("suggestedQuantity");

        if (diseaseId == null || itemId == null || suggestedQuantity == null) {
            throw new IllegalArgumentException("Body must contain diseaseId, itemId, and suggestedQuantity.");
        }

        Disease disease = diseaseRepository.findById(diseaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Disease not found: " + diseaseId));

        InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem not found: " + itemId));

        DiseaseRequirement requirement = DiseaseRequirement.builder()
                .disease(disease)
                .item(item)
                .suggestedQuantity(suggestedQuantity)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diseaseRequirementRepository.save(requirement));
    }

    /** GET /api/admin/supply/requirements/{diseaseId} */
    @GetMapping("/requirements/{diseaseId}")
    public ResponseEntity<List<DiseaseRequirement>> getRequirementsForDisease(
            @PathVariable Integer diseaseId) {
        return ResponseEntity.ok(diseaseRequirementRepository.findByDisease_DiseaseId(diseaseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HOSPITAL CONNECTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/admin/supply/connections
     * Creates a connection: when Hospital A has an outbreak,
     * Hospital B (connectedHospital) receives the alert.
     *
     * Body: { "hospitalId": 1, "connectedHospitalId": 2 }
     */
    @PostMapping("/connections")
    @Transactional
    public ResponseEntity<HospitalConnection> createConnection(
            @RequestBody Map<String, Integer> body) {

        Integer hospitalId = body.get("hospitalId");
        Integer connectedHospitalId = body.get("connectedHospitalId");

        if (hospitalId == null || connectedHospitalId == null) {
            throw new IllegalArgumentException("Body must contain hospitalId and connectedHospitalId.");
        }
        if (hospitalId.equals(connectedHospitalId)) {
            throw new IllegalArgumentException("A hospital cannot be connected to itself.");
        }

        Hospital hospital = hospitalRepo.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));

        Hospital connectedHospital = hospitalRepo.findById(connectedHospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Connected hospital not found: " + connectedHospitalId));

        HospitalConnection connection = HospitalConnection.builder()
                .hospital(hospital)
                .connectedHospital(connectedHospital)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(hospitalConnectionRepository.save(connection));
    }

    /**
     * GET /api/admin/supply/connections/{hospitalId}
     * Returns all hospitals connected to the given hospital (i.e., will receive alerts when it has an outbreak).
     */
    @GetMapping("/connections/{hospitalId}")
    public ResponseEntity<List<HospitalConnection>> getConnectionsForHospital(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(
                hospitalConnectionRepository.findByHospital_HospitalId(hospitalId));
    }

    /** GET /api/admin/supply/connections */
    @GetMapping("/connections")
    public ResponseEntity<List<HospitalConnection>> getAllConnections() {
        return ResponseEntity.ok(hospitalConnectionRepository.findAll());
    }
}
