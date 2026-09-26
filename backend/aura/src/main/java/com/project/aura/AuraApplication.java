package com.project.aura;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;

@SpringBootApplication
@EnableAsync
public class AuraApplication {

    private static final Logger log = LoggerFactory.getLogger(AuraApplication.class);

	public static void main(String[] args) {

        // Find and load .env across common project paths
        File[] candidateFiles = new File[] {
            new File(".env"),
            new File("aura/.env"),
            new File("backend/aura/.env"),
            new File("../backend/aura/.env"),
            new File("../.env")
        };

        Dotenv dotenv = null;
        for (File candidate : candidateFiles) {
            if (candidate.exists()) {
                File dir = candidate.getParentFile();
                if (dir == null) {
                    dotenv = Dotenv.configure().load();
                } else {
                    dotenv = Dotenv.configure().directory(dir.getPath()).load();
                }
                log.info("Loaded .env from: {}", candidate.getAbsolutePath());
                break;
            }
        }

        if (dotenv == null) {
            dotenv = Dotenv.configure().ignoreIfMissing().load();
            log.warn("No .env file found in candidate locations. Using system environment defaults.");
        }

        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(AuraApplication.class, args);
	}
}
