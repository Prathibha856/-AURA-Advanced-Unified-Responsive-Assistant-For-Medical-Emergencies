package com.project.aura.Controller;

import com.project.aura.DTO.NearbyHospitalDTO;
//import com.project.aura.DTO.SosAlertRequest;
import com.project.aura.DTO.SosAlertRequestDTO;
//import com.project.aura.DTO.SosAlertResponse;
import com.project.aura.DTO.SosAlertResponseDTO;
import com.project.aura.Service.SosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    @Autowired
    private SosService sosService;

    // ── User Endpoints ───────────────────────────────────────────────────────────

    /**
     * POST /api/sos/alert
     * Triggered when user presses the SOS button.
     * Automatically finds and assigns the nearest hospital.
     * Body: { "userId": 1, "latitude": 12.9716, "longitude": 77.5946 }
     */
    @PostMapping("/alert")
    public ResponseEntity<SosAlertResponseDTO> createAlert(@RequestBody SosAlertRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sosService.createSosAlert(request));
    }

    /**
     * GET /api/sos/alerts/user/{userId} — all SOS alerts by a user
     */
    @GetMapping("/alerts/user/{userId}")
    public ResponseEntity<List<SosAlertResponseDTO>> getUserAlerts(@PathVariable Integer userId) {
        return ResponseEntity.ok(sosService.getUserAlerts(userId));
    }

    // ── Hospital Admin Endpoints ─────────────────────────────────────────────────

    /**
     * GET /api/sos/alerts/hospital/{hospitalId}
     * Hospital admin views all incoming SOS alerts assigned to their hospital.
     */
    @GetMapping("/alerts/hospital/{hospitalId}")
    public ResponseEntity<List<SosAlertResponseDTO>> getHospitalAlerts(@PathVariable Integer hospitalId) {
        return ResponseEntity.ok(sosService.getHospitalAlerts(hospitalId));
    }

    /**
     * POST /api/sos/alert/{alertId}/accept
     * Hospital admin ACCEPTS the SOS alert and optionally sends a message back.
     * Body (optional): { "message": "Ambulance #12 dispatched, ETA 7 minutes" }
     */
    @PostMapping("/alert/{alertId}/accept")
    public ResponseEntity<SosAlertResponseDTO> acceptAlert(
            @PathVariable Integer alertId,
            @RequestBody(required = false) Map<String, String> body) {
        String message = (body != null) ? body.get("message") : null;
        return ResponseEntity.ok(sosService.acceptAlert(alertId, message));
    }

    /**
     * POST /api/sos/alert/{alertId}/reject
     * Hospital admin REJECTS the SOS alert. The alert is automatically
     * rerouted to the next nearest hospital that hasn't previously rejected it.
     * Body (optional): { "reason": "Hospital at full capacity" }
     */
    @PostMapping("/alert/{alertId}/reject")
    public ResponseEntity<SosAlertResponseDTO> rejectAlert(
            @PathVariable Integer alertId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : null;
        return ResponseEntity.ok(sosService.rejectAlert(alertId, reason));
    }

    /**
     * POST /api/sos/alert/{alertId}/resolve
     * Hospital admin marks the alert as RESOLVED after rendering services.
     * Body (optional): { "message": "Patient stabilised and admitted to ward 3" }
     */
    @PostMapping("/alert/{alertId}/resolve")
    public ResponseEntity<SosAlertResponseDTO> resolveAlert(
            @PathVariable Integer alertId,
            @RequestBody(required = false) Map<String, String> body) {
        String message = (body != null) ? body.get("message") : null;
        return ResponseEntity.ok(sosService.resolveAlert(alertId, message));
    }

    // ── Nearby Hospitals ─────────────────────────────────────────────────────────

    /**
     * GET /api/sos/nearby?lat=12.97&lon=77.59&limit=5
     * Returns a list of nearest hospitals sorted by distance (Haversine km).
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyHospitalDTO>> getNearbyHospitals(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(sosService.findNearbyHospitals(lat, lon, limit));
    }

    // ── Backward Compatibility ───────────────────────────────────────────────────

    /**
     * PATCH /api/sos/alert/{alertId}/status?status=ACKNOWLEDGED
     * Generic status update (kept for backward compatibility).
     */
    @PatchMapping("/alert/{alertId}/status")
    public ResponseEntity<SosAlertResponseDTO> updateAlertStatus(
            @PathVariable Integer alertId,
            @RequestParam String status) {
        return ResponseEntity.ok(sosService.updateAlertStatus(alertId, status));
    }
}
