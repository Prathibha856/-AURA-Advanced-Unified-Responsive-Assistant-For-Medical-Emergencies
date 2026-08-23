package com.project.aura.Controller;

import com.project.aura.DTO.NearbyHospitalDTO;
import com.project.aura.DTO.SosAlertRequest;
import com.project.aura.DTO.SosAlertResponse;
import com.project.aura.Service.SosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
public class SosController {

    @Autowired
    private SosService sosService;

    /**
     * POST /api/sos/alert
     * Triggered when user presses the SOS button.
     * Automatically finds and assigns the nearest hospital.
     * Body: { "userId": 1, "latitude": 12.9716, "longitude": 77.5946 }
     */
    @PostMapping("/alert")
    public ResponseEntity<SosAlertResponse> createAlert(@RequestBody SosAlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sosService.createSosAlert(request));
    }

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

    /**
     * GET /api/sos/alerts/user/{userId} — all SOS alerts by a user
     */
    @GetMapping("/alerts/user/{userId}")
    public ResponseEntity<List<SosAlertResponse>> getUserAlerts(@PathVariable Integer userId) {
        return ResponseEntity.ok(sosService.getUserAlerts(userId));
    }

    /**
     * GET /api/sos/alerts/hospital/{hospitalId} — all SOS alerts sent to a hospital
     */
    @GetMapping("/alerts/hospital/{hospitalId}")
    public ResponseEntity<List<SosAlertResponse>> getHospitalAlerts(@PathVariable Integer hospitalId) {
        return ResponseEntity.ok(sosService.getHospitalAlerts(hospitalId));
    }

    /**
     * PATCH /api/sos/alert/{alertId}/status?status=ACKNOWLEDGED
     * Allows hospital staff to acknowledge or resolve an SOS alert.
     */
    @PatchMapping("/alert/{alertId}/status")
    public ResponseEntity<SosAlertResponse> updateAlertStatus(
            @PathVariable Integer alertId,
            @RequestParam String status) {
        return ResponseEntity.ok(sosService.updateAlertStatus(alertId, status));
    }
}
