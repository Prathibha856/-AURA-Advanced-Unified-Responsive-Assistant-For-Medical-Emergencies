package com.project.aura.Service;

import com.project.aura.DTO.HospitalDTO;
import com.project.aura.DTO.NearbyHospitalDTO;
import com.project.aura.DTO.SosAlertRequest;
import com.project.aura.DTO.SosAlertResponse;
import com.project.aura.Entity.Hospital;
import com.project.aura.Entity.SosAlert;
import com.project.aura.Entity.Users;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.Repository.SosAlertRepo;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * SosService — handles emergency alert creation and nearest-hospital lookup.
 *
 * Key feature: When an SOS alert is created, the Haversine formula (via a
 * native SQL query in HospitalRepo) automatically finds and assigns the
 * nearest hospital to the alert.
 */
@Service
public class SosService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    @Autowired
    private SosAlertRepo sosAlertRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private HospitalRepo hospitalRepo;

    // ── SOS Alert Creation ───────────────────────────────────────────────────────

    /**
     * Creates an SOS alert and auto-assigns the nearest hospital.
     */
    public SosAlertResponse createSosAlert(SosAlertRequest request) {

        Users user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));

        // Find the single nearest hospital using Haversine formula
        List<Hospital> nearest = hospitalRepo.findNearestHospitals(
                request.getLatitude(), request.getLongitude(), 1);

        Hospital nearestHospital = nearest.isEmpty() ? null : nearest.get(0);

        SosAlert alert = SosAlert.builder()
                .user(user)
                .hospital(nearestHospital)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(SosAlert.AlertStatus.PENDING)
                .build();

        return toResponse(sosAlertRepo.save(alert));
    }

    /**
     * Find hospitals near given coordinates (sorted by Haversine distance).
     */
    public List<NearbyHospitalDTO> findNearbyHospitals(double lat, double lon, int limit) {
        return hospitalRepo.findNearestHospitals(lat, lon, limit).stream()
                .map(h -> NearbyHospitalDTO.builder()
                        .hospitalId(h.getHospitalId())
                        .name(h.getName())
                        .address(h.getAddress())
                        .latitude(h.getLatitude())
                        .longitude(h.getLongitude())
                        .phone(h.getPhone())
                        .distanceKm(roundTo2(calculateHaversineDistance(lat, lon, h.getLatitude(), h.getLongitude())))
                        .build())
                .collect(Collectors.toList());
    }

    public List<SosAlertResponse> getUserAlerts(Integer userId) {
        return sosAlertRepo.findByUser_UseridOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SosAlertResponse> getHospitalAlerts(Integer hospitalId) {
        return sosAlertRepo.findByHospital_HospitalIdOrderByCreatedAtDesc(hospitalId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SosAlertResponse updateAlertStatus(Integer alertId, String status) {
        SosAlert alert = sosAlertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found: " + alertId));
        try {
            alert.setStatus(SosAlert.AlertStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status. Use: PENDING, ACKNOWLEDGED, or RESOLVED");
        }
        return toResponse(sosAlertRepo.save(alert));
    }

    // ── Haversine Formula ────────────────────────────────────────────────────────

    /**
     * Calculates the great-circle distance between two lat/lon points in kilometres.
     * This matches the formula used in the native SQL query in HospitalRepo.
     */
    public double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    // ── Mappers ──────────────────────────────────────────────────────────────────

    private SosAlertResponse toResponse(SosAlert a) {
        HospitalDTO hospitalDTO = null;
        if (a.getHospital() != null) {
            Hospital h = a.getHospital();
            hospitalDTO = HospitalDTO.builder()
                    .hospitalId(h.getHospitalId())
                    .name(h.getName())
                    .address(h.getAddress())
                    .latitude(h.getLatitude())
                    .longitude(h.getLongitude())
                    .phone(h.getPhone())
                    .build();
        }
        return SosAlertResponse.builder()
                .alertId(a.getAlertId())
                .userId(a.getUser().getUserid())
                .nearestHospital(hospitalDTO)
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
