package com.project.aura.Controller;

import com.project.aura.DTO.HospitalDTO;
import com.project.aura.Service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    @Autowired
    private HospitalService hospitalService;

    /** GET /api/hospitals (Public - Anyone can view) */
    @GetMapping
    public ResponseEntity<List<HospitalDTO>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    /** GET /api/hospitals/{id} (Public - Anyone can view) */
    @GetMapping("/{id}")
    public ResponseEntity<HospitalDTO> getHospitalById(@PathVariable Integer id) {
        return ResponseEntity.ok(hospitalService.getHospitalById(id));
    }

    /** POST /api/hospitals?requesterId=1 (Secured - Admins Only) */
    @PostMapping
    public ResponseEntity<?> createHospital(@RequestBody HospitalDTO dto, @RequestParam Integer requesterId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(hospitalService.createHospital(dto, requesterId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    /** PUT /api/hospitals/{id}?requesterId=1 (Secured - Admins Only) */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHospital(
            @PathVariable Integer id,
            @RequestBody HospitalDTO dto,
            @RequestParam Integer requesterId) {
        try {
            return ResponseEntity.ok(hospitalService.updateHospital(id, dto, requesterId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    /** DELETE /api/hospitals/{id}?requesterId=1 (Secured - Admins Only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHospital(@PathVariable Integer id, @RequestParam Integer requesterId) {
        try {
            hospitalService.deleteHospital(id, requesterId);
            return ResponseEntity.ok("Hospital deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}