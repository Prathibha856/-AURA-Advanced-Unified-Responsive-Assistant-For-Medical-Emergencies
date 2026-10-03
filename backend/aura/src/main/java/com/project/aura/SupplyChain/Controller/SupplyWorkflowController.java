package com.project.aura.SupplyChain.Controller;

import com.project.aura.SupplyChain.DTO.*;
import com.project.aura.SupplyChain.Service.SupplyChainService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Supply Workflow Controller
 *
 * Full supply chain flow endpoints:
 *
 * GET  /api/supply/alerts                         — All alerts (SUPPLY_ADMIN)
 * GET  /api/supply/alerts/hospital/{hospitalId}   — Alerts for a specific hospital
 * GET  /api/supply/alerts/{id}                    — Single alert with full detail
 * PUT  /api/supply/alerts/{id}/reject             — Reject an alert
 *
 * POST /api/supply/requests                       — Create a supply request (SUPPLY_ADMIN responds)
 * GET  /api/supply/requests/source/{hospitalId}   — Requests by source hospital
 * GET  /api/supply/requests/destination/{hospitalId} — Requests by destination hospital
 *
 * POST /api/supply/dispatches/{requestId}         — Create a dispatch from a request
 * PUT  /api/supply/dispatches/{id}/status         — Update dispatch status
 * GET  /api/supply/dispatches/source/{hospitalId} — Dispatches by source hospital
 *
 * GET  /api/inventory/hospital/{hospitalId}       — Hospital inventory
 * PUT  /api/inventory/update                      — Update/seed inventory
 */
@RestController
public class SupplyWorkflowController {

    private final SupplyChainService supplyChainService;

    public SupplyWorkflowController(SupplyChainService supplyChainService) {
        this.supplyChainService = supplyChainService;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ALERTS
    // ═══════════════════════════════════════════════════════════════════════════

    /** GET /api/supply/alerts — all alerts (supply admins, hospital admins) */
    @GetMapping("/api/supply/alerts")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<List<SupplyAlertResponseDTO>> getAllAlerts() {
        return ResponseEntity.ok(supplyChainService.getAllAlerts());
    }

    /** GET /api/supply/alerts/hospital/{hospitalId} — alerts for a specific receiving hospital */
    @GetMapping("/api/supply/alerts/hospital/{hospitalId}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<List<SupplyAlertResponseDTO>> getAlertsForHospital(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(supplyChainService.getAlertsForHospital(hospitalId));
    }

    /** GET /api/supply/alerts/{id} — single alert with full detail */
    @GetMapping("/api/supply/alerts/{id}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<SupplyAlertResponseDTO> getAlertById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplyChainService.getAlertById(id));
    }

    /** PUT /api/supply/alerts/{id}/reject — reject an alert */
    @PutMapping("/api/supply/alerts/{id}/reject")
    @PreAuthorize("hasAuthority('SUPPLY_ADMIN')")
    public ResponseEntity<SupplyAlertResponseDTO> rejectAlert(@PathVariable Integer id) {
        return ResponseEntity.ok(supplyChainService.rejectAlert(id));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUPPLY REQUESTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/supply/requests
     * Supply admin at Hospital B/C/D responds to an alert,
     * offering a quantity of an item.
     *
     * Body: { "alertId": 10, "itemId": 1, "quantity": 100 }
     */
    @PostMapping("/api/supply/requests")
    @PreAuthorize("hasAuthority('SUPPLY_ADMIN')")
    public ResponseEntity<SupplyRequestResponseDTO> createSupplyRequest(
            @RequestBody SupplyRequestCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(supplyChainService.createSupplyRequest(dto));
    }

    /** GET /api/supply/requests/source/{hospitalId} — requests where this hospital is the supplier */
    @GetMapping("/api/supply/requests/source/{hospitalId}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<List<SupplyRequestResponseDTO>> getRequestsBySource(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(supplyChainService.getRequestsBySourceHospital(hospitalId));
    }

    /** GET /api/supply/requests/destination/{hospitalId} — incoming supply requests for this hospital */
    @GetMapping("/api/supply/requests/destination/{hospitalId}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<List<SupplyRequestResponseDTO>> getRequestsByDestination(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(supplyChainService.getRequestsByDestinationHospital(hospitalId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISPATCHES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/supply/dispatches/{requestId}
     * Create a dispatch for an accepted supply request.
     * Source inventory is deducted atomically.
     */
    @PostMapping("/api/supply/dispatches/{requestId}")
    @PreAuthorize("hasAuthority('SUPPLY_ADMIN')")
    public ResponseEntity<DispatchResponseDTO> createDispatch(@PathVariable Integer requestId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(supplyChainService.createDispatch(requestId));
    }

    /**
     * PUT /api/supply/dispatches/{id}/status
     * Advance the dispatch through its lifecycle.
     * When status = RECEIVED, destination inventory is credited.
     *
     * Body: { "status": "IN_TRANSIT" }
     */
    @PutMapping("/api/supply/dispatches/{id}/status")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<DispatchResponseDTO> updateDispatchStatus(
            @PathVariable Integer id,
            @RequestBody DispatchStatusUpdateDTO dto) {
        return ResponseEntity.ok(supplyChainService.updateDispatchStatus(id, dto.getStatus()));
    }

    /** GET /api/supply/dispatches/source/{hospitalId} — dispatches sent from this hospital */
    @GetMapping("/api/supply/dispatches/source/{hospitalId}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<List<DispatchResponseDTO>> getDispatchesBySource(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(supplyChainService.getDispatchesBySourceHospital(hospitalId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INVENTORY
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/inventory/hospital/{hospitalId}
     * Returns current inventory for a hospital.
     */
    @GetMapping("/api/inventory/hospital/{hospitalId}")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<HospitalInventoryResponseDTO> getHospitalInventory(
            @PathVariable Integer hospitalId) {
        return ResponseEntity.ok(supplyChainService.getInventoryForHospital(hospitalId));
    }

    /**
     * PUT /api/inventory/update
     * Set or update inventory quantity for a hospital + item.
     * Used for seeding/correcting data.
     *
     * Body: { "hospitalId": 2, "itemId": 1, "quantity": 500 }
     */
    @PutMapping("/api/inventory/update")
    @PreAuthorize("hasAnyAuthority('SUPPLY_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<InventoryStockDTO> updateInventory(@RequestBody InventoryUpdateDTO dto) {
        return ResponseEntity.ok(supplyChainService.upsertInventory(dto));
    }
}
