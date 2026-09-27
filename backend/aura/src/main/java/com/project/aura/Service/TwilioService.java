package com.project.aura.Service;

import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Pause;
import com.twilio.twiml.voice.Say;
import com.twilio.type.PhoneNumber;
import com.twilio.type.Twiml;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * TwilioService — handles emergency Voice Calls and SMS notifications
 * to hospital phone numbers when an SOS alert is triggered.
 *
 * All methods are @Async so they run in a background thread and
 * never block the main API response to the user.
 *
 * When twilio.enabled=false, calls/SMS are only logged (no real calls made).
 * This prevents accidental charges during development.
 */
@Service
public class TwilioService {

    private static final Logger log = LoggerFactory.getLogger(TwilioService.class);

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @jakarta.annotation.PostConstruct
    public void logConfig() {
        log.info("╔══════════════════════════════════════════════════════════╗");
        log.info("║  TwilioService Configuration at Startup                 ║");
        log.info("║  enabled       = {}                                     ", enabled);
        log.info("║  phoneNumber   = [{}]                                   ", twilioPhoneNumber);
        log.info("╚══════════════════════════════════════════════════════════╝");
    }

    // ── Voice Call ────────────────────────────────────────────────────────────────

    /**
     * Makes an automated emergency voice call to the hospital.
     * Uses inline TwiML to speak a custom emergency message with patient details.
     * The message is repeated twice for clarity.
     *
     * @param hospitalPhone  Hospital phone number (e.g. "+919876543210")
     * @param patientName    Name of the patient who triggered SOS
     * @param alertId        The SOS alert ID for reference
     * @param latitude       Patient's latitude
     * @param longitude      Patient's longitude
     */
    @Async
    public void makeEmergencyCall(String hospitalPhone, String patientName,
                                  Integer alertId, Double latitude, Double longitude) {

        if (!enabled) {
            log.info("[TWILIO DISABLED] Would have called {} for alert #{}",
                    hospitalPhone, alertId);
            return;
        }

        if (twilioPhoneNumber == null || twilioPhoneNumber.isBlank()) {
            log.error("Cannot place emergency call for alert #{}: 'twilio.phone-number' is missing!", alertId);
            return;
        }

        try {
            String formattedPhone = normalizePhoneNumber(hospitalPhone);

            // Build the emergency voice message
            String emergencyMessage = String.format(
                    "Emergency S.O.S. Alert from Aura Health System. " +
                    "Patient %s needs immediate assistance. " +
                    "Alert I.D. number %d. " +
                    "Patient location: latitude %.4f, longitude %.4f. " +
                    "Google Maps link has been sent via S.M.S. " +
                    "Please open your Aura portal now to ACCEPT and dispatch an ambulance immediately.",
                    patientName, alertId, latitude, longitude
            );

            // Build TwiML: say the message, pause, then repeat it
            VoiceResponse voiceResponse = new VoiceResponse.Builder()
                    .say(new Say.Builder(emergencyMessage)
                            .voice(Say.Voice.POLLY_JOANNA)
                            .build())
                    .pause(new Pause.Builder().length(2).build())
                    .say(new Say.Builder("I repeat. " + emergencyMessage)
                            .voice(Say.Voice.POLLY_JOANNA)
                            .build())
                    .build();

            String twimlXml = voiceResponse.toXml();
            log.debug("TwiML for alert #{}: {}", alertId, twimlXml);

            Call call = Call.creator(
                    new PhoneNumber(formattedPhone),    // To: hospital phone
                    new PhoneNumber(twilioPhoneNumber),  // From: your Twilio number
                    new Twiml(twimlXml)                  // Inline TwiML with emergency message
            ).create();

            log.info("Emergency call placed to {} — Call SID: {} — Alert #{} — Status: {}",
                    formattedPhone, call.getSid(), alertId, call.getStatus());
        } catch (Exception e) {
            log.error("Failed to place emergency call to {} for alert #{}: {}",
                    hospitalPhone, alertId, e.getMessage(), e);
        }
    }

    // ── SMS Notification ─────────────────────────────────────────────────────────

    /**
     * Sends an emergency SMS to the hospital as a backup notification.
     * SMS is sent in addition to the voice call to ensure the alert
     * is received even if the call is missed.
     *
     * NOTE: Twilio Trial accounts can only send SMS to verified phone numbers.
     * To verify a number, go to: Twilio Console → Phone Numbers → Verified Caller IDs
     *
     * @param hospitalPhone  Hospital phone number (e.g. "+919876543210")
     * @param patientName    Name of the patient who triggered SOS
     * @param alertId        The SOS alert ID for reference
     * @param latitude       Patient's latitude
     * @param longitude      Patient's longitude
     */
    @Async
    public void sendEmergencySms(String hospitalPhone, String patientName,
                                 Integer alertId, Double latitude, Double longitude) {

        String smsBody = String.format(
                "EMERGENCY SOS ALERT — Aura Health System\n\n" +
                "Patient: %s\n" +
                "Alert ID: #%d\n" +
                "Location: https://maps.google.com/?q=%s,%s\n\n" +
                "Please open your Aura portal to ACCEPT and dispatch an ambulance immediately.",
                patientName, alertId,
                String.format("%.6f", latitude), String.format("%.6f", longitude)
        );

        if (!enabled) {
            log.info("[TWILIO DISABLED] Would have sent SMS to {} for alert #{}", hospitalPhone, alertId);
            log.debug("SMS Body: {}", smsBody);
            return;
        }

        if (twilioPhoneNumber == null || twilioPhoneNumber.isBlank()) {
            log.error("Cannot send emergency SMS for alert #{}: 'twilio.phone-number' is missing!", alertId);
            return;
        }

        try {
            String formattedPhone = normalizePhoneNumber(hospitalPhone);
            Message message = Message.creator(
                    new PhoneNumber(formattedPhone),    // To: hospital phone
                    new PhoneNumber(twilioPhoneNumber), // From: your Twilio number
                    smsBody
            ).create();

            log.info("Emergency SMS sent to {} — Message SID: {} — Alert #{} — Status: {}",
                    formattedPhone, message.getSid(), alertId, message.getStatus());
        } catch (Exception e) {
            log.error("Failed to send SMS to {} for alert #{}: {}",
                    hospitalPhone, alertId, e.getMessage());
            log.warn("SMS tip: Twilio Trial accounts can only send SMS to verified numbers. " +
                     "Verify the number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
        }
    }

    // ── Phone Normalization Helper ──────────────────────────────────────────────

    /**
     * Normalizes phone numbers to standard E.164 format expected by Twilio.
     * Handles common formats:
     *   "9876543210"        -> "+919876543210" (auto-prepends +91 for 10-digit Indian numbers)
     *   "09876543210"       -> "+919876543210" (replaces leading 0 with +91)
     *   "919876543210"      -> "+919876543210" (prepends +)
     *   "+91 98765-43210"   -> "+919876543210" (strips spaces, dashes)
     */
    public String normalizePhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        // Remove spaces, hyphens, brackets
        String cleaned = phone.replaceAll("[^0-9+]", "");

        // 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
        if (cleaned.matches("^[6-9]\\d{9}$")) {
            return "+91" + cleaned;
        }
        // 11 digits starting with 0 (e.g. 09876543210)
        if (cleaned.matches("^0[6-9]\\d{9}$")) {
            return "+91" + cleaned.substring(1);
        }
        // 12 digits starting with 91 but missing '+' (e.g. 919876543210)
        if (cleaned.matches("^91[6-9]\\d{9}$")) {
            return "+" + cleaned;
        }
        // If already has country code with + (e.g. +919876543210, +1234567890)
        if (cleaned.startsWith("+")) {
            return cleaned;
        }
        // Fallback: prepend +
        return "+" + cleaned;
    }
}

