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

        // Find and load .env from current directory, ./backend/aura, or parent directory
        Dotenv dotenv;
        if (new File(".env").exists()) {
            dotenv = Dotenv.configure().load();
            log.info("Loaded .env from current directory: {}", new File(".env").getAbsolutePath());
        } else if (new File("backend/aura/.env").exists()) {
            dotenv = Dotenv.configure().directory("./backend/aura").load();
            log.info("Loaded .env from ./backend/aura/.env");
        } else if (new File("../.env").exists()) {
            dotenv = Dotenv.configure().directory("../").load();
            log.info("Loaded .env from parent directory");
        } else {
            dotenv = Dotenv.configure().ignoreIfMissing().load();
            log.warn("No .env file found in ., ./backend/aura, or ../. Using system environment defaults.");
        }

        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(AuraApplication.class, args);
	}
}
