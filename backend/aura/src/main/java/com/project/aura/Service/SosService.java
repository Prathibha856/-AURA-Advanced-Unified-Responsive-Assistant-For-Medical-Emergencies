package com.project.aura.Service;

import com.project.aura.DTO.HospitalDTO;
import com.project.aura.DTO.NearbyHospitalDTO;
import com.project.aura.DTO.SosAlertRequestDTO;
import com.project.aura.DTO.SosAlertResponseDTO;
import com.project.aura.Entity.Hospital;
import com.project.aura.Entity.SosAlert;
import com.project.aura.Entity.Users;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.Repository.SosAlertRepo;
import com.project.aura.Repository.UserRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * SosService — handles emergency alert creation, nearest-hospital lookup,
 * hospital acceptance/rejection, automatic rerouting, and Twilio notifications.
 *
 * Flow:
 *  1. User presses SOS → createSosAlert() assigns the nearest hospital, status = PENDING
 *     → Twilio automatically CALLS + SMS the hospital phone
 *  2. Hospital admin views incoming alerts → getHospitalAlerts()
 *  3. Hospital admin accepts → acceptAlert() sets status = ACKNOWLEDGED + acceptedAt + optional message
 *  4. Hospital admin rejects → rejectAlert() records the rejection, reroutes to the next nearest hospital
 *     → Twilio automatically CALLS + SMS the NEW hospital phone
 *  5. Hospital admin resolves → resolveAlert() sets status = RESOLVED + resolvedAt
 */
@Service
public class SosService {

    private static final Logger log = LoggerFactory.getLogger(SosService.class);
    private static final double EARTH_RADIUS_KM = 6371.0;

    @Autowired
    private SosAlertRepo sosAlertRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private HospitalRepo hospitalRepo;

    @Autowired
    private TwilioService twilioService;

    // ── SOS Alert Creation ───────────────────────────────────────────────────────

    /**
     * Creates an SOS alert and auto-assigns the nearest hospital.
     * Triggers an emergency voice call + SMS to the hospital via Twilio.
     */
    public SosAlertResponseDTO createSosAlert(SosAlertRequestDTO request) {

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

        SosAlert savedAlert = sosAlertRepo.save(alert);

        // Trigger Twilio voice call + SMS to the assigned hospital
        notifyHospitalViaTwilio(savedAlert, user);

        return toResponse(savedAlert);
    }

    // ── Hospital Accept / Reject / Resolve ───────────────────────────────────────

    /**
     * Hospital admin ACCEPTS the SOS alert.
     * Sets status to ACKNOWLEDGED, records acceptedAt timestamp,
     * and optionally stores a response message (e.g. "Ambulance dispatched, ETA 7 min").
     */
    public SosAlertResponseDTO acceptAlert(Integer alertId, String responseMessage) {
        SosAlert alert = sosAlertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found: " + alertId));

        if (alert.getStatus() != SosAlert.AlertStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot accept alert with status " + alert.getStatus() + ". Only PENDING alerts can be accepted.");
        }

        alert.setStatus(SosAlert.AlertStatus.ACKNOWLEDGED);
        alert.setAcceptedAt(LocalDateTime.now());

        if (responseMessage != null && !responseMessage.isBlank()) {
            alert.setResponseMessage(responseMessage);
        }

        return toResponse(sosAlertRepo.save(alert));
    }

    /**
     * Hospital admin REJECTS the SOS alert.
     * The current hospital is recorded in the rejection list, and the alert
     * is automatically rerouted to the next nearest hospital that hasn't
     * previously rejected it.
     *
     * Twilio automatically calls + SMS the NEW hospital after rerouting.
     *
     * If no more hospitals are available, the alert stays with status REJECTED.
     */
    public SosAlertResponseDTO rejectAlert(Integer alertId, String reason) {
        SosAlert alert = sosAlertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found: " + alertId));

        if (alert.getStatus() != SosAlert.AlertStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot reject alert with status " + alert.getStatus() + ". Only PENDING alerts can be rejected.");
        }

        // Record this hospital as having rejected the alert
        if (alert.getHospital() != null) {
            alert.getRejectedHospitalIds().add(alert.getHospital().getHospitalId());
        }

        if (reason != null && !reason.isBlank()) {
            alert.setResponseMessage("Rejected by " + (alert.getHospital() != null
                    ? alert.getHospital().getName() : "unknown") + ": " + reason);
        }

        // Find the next nearest hospital that hasn't rejected this alert
        List<Hospital> allNearest = hospitalRepo.findNearestHospitals(
                alert.getLatitude(), alert.getLongitude(), 20); // fetch top 20 candidates

        Hospital nextHospital = allNearest.stream()
                .filter(h -> !alert.getRejectedHospitalIds().contains(h.getHospitalId()))
                .findFirst()
                .orElse(null);

        if (nextHospital != null) {
            // Reroute to next nearest hospital → reset status to PENDING
            alert.setHospital(nextHospital);
            alert.setStatus(SosAlert.AlertStatus.PENDING);
            alert.setResponseMessage(null); // clear previous rejection message

            SosAlert savedAlert = sosAlertRepo.save(alert);

            // Trigger Twilio voice call + SMS to the NEW hospital
            Users user = alert.getUser();
            notifyHospitalViaTwilio(savedAlert, user);

            log.info("Alert #{} rerouted to hospital: {} (ID: {})",
                    alertId, nextHospital.getName(), nextHospital.getHospitalId());

            return toResponse(savedAlert);
        } else {
            // No more hospitals available — mark as REJECTED
            alert.setStatus(SosAlert.AlertStatus.REJECTED);
            log.warn("Alert #{} has been REJECTED — no more hospitals available", alertId);
            return toResponse(sosAlertRepo.save(alert));
        }
    }

    /**
     * Hospital admin marks the alert as RESOLVED after providing services.
     * Records the resolvedAt timestamp and an optional closing message.
     */
    public SosAlertResponseDTO resolveAlert(Integer alertId, String responseMessage) {
        SosAlert alert = sosAlertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found: " + alertId));

        if (alert.getStatus() != SosAlert.AlertStatus.ACKNOWLEDGED) {
            throw new IllegalStateException(
                    "Cannot resolve alert with status " + alert.getStatus() + ". Only ACKNOWLEDGED alerts can be resolved.");
        }

        alert.setStatus(SosAlert.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());

        if (responseMessage != null && !responseMessage.isBlank()) {
            alert.setResponseMessage(responseMessage);
        }

        return toResponse(sosAlertRepo.save(alert));
    }

    // ── Twilio Notification Helper ───────────────────────────────────────────────

    /**
     * Triggers both a voice call and SMS to the assigned hospital.
     * Both run asynchronously (background threads) so they never block the API response.
     *
     * If the hospital has no phone number, a warning is logged and no call is made.
     */
    private void notifyHospitalViaTwilio(SosAlert alert, Users user) {
        Hospital hospital = alert.getHospital();

        if (hospital == null) {
            log.warn("Alert #{} — no hospital assigned, skipping Twilio notification", alert.getAlertId());
            return;
        }

        String hospitalPhone = hospital.getPhone();
        if (hospitalPhone == null || hospitalPhone.isBlank()) {
            log.warn("Hospital '{}' (ID: {}) has no phone number — skipping Twilio call/SMS",
                    hospital.getName(), hospital.getHospitalId());
            return;
        }

        String patientName = user.getUsername();

        //Voice call (async — runs in background)
        twilioService.makeEmergencyCall(
                hospitalPhone, patientName,
                alert.getAlertId(), alert.getLatitude(), alert.getLongitude()
        );

        //SMS backup notification (async — runs in background)
        twilioService.sendEmergencySms(
                hospitalPhone, patientName,
                alert.getAlertId(), alert.getLatitude(), alert.getLongitude()
        );

        log.info("Twilio notifications triggered for alert #{} → Hospital: {} ({})",
                alert.getAlertId(), hospital.getName(), hospitalPhone);
    }

    // ── Nearby Hospitals ─────────────────────────────────────────────────────────

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

    // ── Alert Queries ────────────────────────────────────────────────────────────

    public List<SosAlertResponseDTO> getUserAlerts(Integer userId) {
        return sosAlertRepo.findByUser_UseridOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SosAlertResponseDTO> getHospitalAlerts(Integer hospitalId) {
        return sosAlertRepo.findByHospital_HospitalIdOrderByCreatedAtDesc(hospitalId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Generic status update (kept for backward compatibility).
     */
    public SosAlertResponseDTO updateAlertStatus(Integer alertId, String status) {
        SosAlert alert = sosAlertRepo.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found: " + alertId));
        try {
            alert.setStatus(SosAlert.AlertStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status. Use: PENDING, ACKNOWLEDGED, REJECTED, or RESOLVED");
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

    private SosAlertResponseDTO toResponse(SosAlert a) {
        HospitalDTO hospitalDTO = null;
        if (a.getHospital() != null) {
            Hospital h = a.getHospital();
            hospitalDTO = HospitalDTO.builder()
//                    .hospitalId(h.getHospitalId())
                    .name(h.getName())
                    .address(h.getAddress())
                    .latitude(h.getLatitude())
                    .longitude(h.getLongitude())
                    .phone(h.getPhone())
                    .build();
        }
        return SosAlertResponseDTO.builder()
                .alertId(a.getAlertId())
                .userId(a.getUser().getUserid())
                .nearestHospital(hospitalDTO)
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .acceptedAt(a.getAcceptedAt())
                .resolvedAt(a.getResolvedAt())
                .responseMessage(a.getResponseMessage())
                .build();
    }

    private double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
