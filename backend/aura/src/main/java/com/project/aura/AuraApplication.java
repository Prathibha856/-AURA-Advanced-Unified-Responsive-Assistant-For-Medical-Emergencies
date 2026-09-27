package com.project.aura;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
@EnableAsync
public class AuraApplication {

	public static void main(String[] args) {

        // ── Locate and load the .env file ────────────────────────────────────
        // The .env file lives at backend/aura/.env
        // IntelliJ may run from different working directories (backend/, backend/aura/, repo root)
        // so we search multiple candidate locations to find it reliably.

        String[] candidatePaths = {
            ".env",                    // Running from backend/aura/
            "aura/.env",               // Running from backend/
            "backend/aura/.env",       // Running from repo root
            "../.env",                 // Running from backend/aura/ but .env is in backend/
        };

        // Also try to resolve relative to the compiled class file location
        // (always at backend/aura/target/classes/com/project/aura/)
        try {
            Path classDir = Paths.get(AuraApplication.class.getProtectionDomain()
                    .getCodeSource().getLocation().toURI());
            // classDir = .../backend/aura/target/classes
            // We need .../backend/aura/.env → go up 2 levels from target/classes
            Path envFromClass = classDir.resolve("../../.env").normalize();
            if (envFromClass.toFile().exists()) {
                System.out.println("[AURA] Found .env via classpath: " + envFromClass.toAbsolutePath());
                Dotenv dotenv = Dotenv.configure()
                        .directory(envFromClass.getParent().toString())
                        .load();
                applyDotenv(dotenv);
                SpringApplication.run(AuraApplication.class, args);
                return;
            }
        } catch (URISyntaxException | SecurityException e) {
            System.out.println("[AURA] Could not resolve .env from classpath: " + e.getMessage());
        }

        // Fallback: search candidate paths relative to working directory
        System.out.println("[AURA] Working directory: " + new File(".").getAbsolutePath());
        for (String path : candidatePaths) {
            File f = new File(path);
            if (f.exists()) {
                System.out.println("[AURA] Found .env at: " + f.getAbsolutePath());
                File dir = f.getParentFile();
                Dotenv dotenv;
                if (dir == null) {
                    dotenv = Dotenv.configure().load();
                } else {
                    dotenv = Dotenv.configure().directory(dir.getPath()).load();
                }
                applyDotenv(dotenv);
                SpringApplication.run(AuraApplication.class, args);
                return;
            }
        }

        // No .env found anywhere
        System.out.println("[AURA] WARNING: No .env file found! Twilio credentials will be empty.");
        System.out.println("[AURA] Searched paths: " + String.join(", ", candidatePaths));
        SpringApplication.run(AuraApplication.class, args);
	}

    private static void applyDotenv(Dotenv dotenv) {
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        // Confirm critical Twilio properties were loaded
        String sid = System.getProperty("TWILIO_ACCOUNT_SID");
        String enabled = System.getProperty("TWILIO_ENABLED");
        String phone = System.getProperty("TWILIO_PHONE_NUMBER");
        System.out.println("[AURA] .env loaded — TWILIO_ACCOUNT_SID=" +
                (sid != null ? sid.substring(0, Math.min(8, sid.length())) + "..." : "NULL"));
        System.out.println("[AURA] .env loaded — TWILIO_ENABLED=" + enabled);
        System.out.println("[AURA] .env loaded — TWILIO_PHONE_NUMBER=" + phone);
    }
}

