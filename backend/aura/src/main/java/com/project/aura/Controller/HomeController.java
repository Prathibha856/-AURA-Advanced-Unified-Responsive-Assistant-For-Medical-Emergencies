 package com.project.aura.Controller;

import com.project.aura.Repository.HospitalRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @Autowired
    private HospitalRepo hospitalRepo;

    @GetMapping("/")
    public String greet() {
        return "hello";
    }

    @GetMapping("/api/system/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus() {
        Map<String, Object> statusMap = new LinkedHashMap<>();
        statusMap.put("version", "v2.4 Live");
        statusMap.put("timestamp", LocalDateTime.now().toString());

        try {
            long count = hospitalRepo.count();
            statusMap.put("status", "OPERATIONAL");
            statusMap.put("database", "CONNECTED");
            statusMap.put("registeredHospitals", count);
        } catch (Exception e) {
            statusMap.put("status", "DEGRADED");
            statusMap.put("database", "DISCONNECTED");
            statusMap.put("registeredHospitals", 0);
        }

        return ResponseEntity.ok(statusMap);
    }
}
