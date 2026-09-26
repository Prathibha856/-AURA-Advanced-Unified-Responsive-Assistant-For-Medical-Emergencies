package com.project.aura.Configuration;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Initialises the Twilio SDK on application startup using credentials
 * from application.properties.

 * Twilio is used for:
 *  - Voice calls to hospital phone numbers when an SOS alert is created
 *  - SMS backup notifications with patient coordinates
 */
@Configuration
public class TwilioConfig {

    private static final Logger log = LoggerFactory.getLogger(TwilioConfig.class);

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.enabled:false}")
    private boolean enabled;

    @PostConstruct
    public void initTwilio() {
        if (enabled) {
            if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
                log.error("Twilio is ENABLED, but 'twilio.account-sid' or 'twilio.auth-token' is EMPTY! " +
                          "Check that your .env file is loaded and contains TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
                return;
            }
            Twilio.init(accountSid, authToken);
            log.info("Twilio SDK initialised — Voice calls and SMS are ENABLED for account: {}", accountSid);
        } else {
            log.warn("Twilio is DISABLED (twilio.enabled=false). SOS calls/SMS will be logged but not sent.");
        }
    }
}
