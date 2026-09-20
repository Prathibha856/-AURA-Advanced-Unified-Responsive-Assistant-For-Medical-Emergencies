package com.project.aura.Service;

import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
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

    // ── Voice Call ────────────────────────────────────────────────────────────────

    /**
     * Makes an automated emergency voice call to the hospital.
     * Uses TwiML (Twilio Markup Language) to speak an emergency message
     * via text-to-speech when the hospital picks up the phone.
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

        String twimlMessage = String.format(
                "<Response>" +
                        "<Say voice=\"alice\" language=\"en-IN\">" +
                        "Emergency S.O.S. Alert from Aura Health System! " +
                        "Patient %s has triggered an emergency alert. " +
                        "Alert I.D. is %d. " +
                        "Patient location coordinates are: Latitude %s, Longitude %s. " +
                        "Please check your Aura emergency portal immediately to accept and dispatch an ambulance. " +
                        "Repeating: This is an emergency S.O.S. alert. Please respond immediately." +
                        "</Say>" +
                        "<Pause length=\"2\"/>" +
                        "<Say voice=\"alice\" language=\"en-IN\">" +
                        "Emergency S.O.S. Alert from Aura Health System! " +
                        "Patient %s needs immediate assistance. Alert I.D. %d. " +
                        "Please check your Aura portal now." +
                        "</Say>" +
                        "</Response>",
                patientName, alertId,
                String.format("%.4f", latitude), String.format("%.4f", longitude),
                patientName, alertId
        );

        if (!enabled) {
            log.info("[TWILIO DISABLED] Would have called {} with message for alert #{}",
                    hospitalPhone, alertId);
            log.debug("TwiML: {}", twimlMessage);
            return;
        }

        try {
            Call call = Call.creator(
                    new PhoneNumber(hospitalPhone),   // To: hospital phone
                    new PhoneNumber(twilioPhoneNumber), // From: your Twilio number
                    new Twiml(twimlMessage)
            ).create();

            log.info("Emergency call placed to {} — Call SID: {} — Alert #{}",
                    hospitalPhone, call.getSid(), alertId);
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

        try {
            Message message = Message.creator(
                    new PhoneNumber(hospitalPhone),    // To: hospital phone
                    new PhoneNumber(twilioPhoneNumber), // From: your Twilio number
                    smsBody
            ).create();

            log.info("Emergency SMS sent to {} — Message SID: {} — Alert #{}",
                    hospitalPhone, message.getSid(), alertId);
        } catch (Exception e) {
            log.error("Failed to send SMS to {} for alert #{}: {}",
                    hospitalPhone, alertId, e.getMessage(), e);
        }
    }
}
