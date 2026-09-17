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

    /** GET /api/hospitals */
    @GetMapping
    public ResponseEntity<List<HospitalDTO>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    /** GET /api/hospitals/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<HospitalDTO> getHospitalById(@PathVariable Integer id) {
        return ResponseEntity.ok(hospitalService.getHospitalById(id));
    }

    /** POST /api/hospitals */
    @PostMapping
    public ResponseEntity<HospitalDTO> createHospital(@RequestBody HospitalDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hospitalService.createHospital(dto));
    }

    /** PUT /api/hospitals/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<HospitalDTO> updateHospital(@PathVariable Integer id, @RequestBody HospitalDTO dto) {
        return ResponseEntity.ok(hospitalService.updateHospital(id, dto));
    }

    /** DELETE /api/hospitals/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHospital(@PathVariable Integer id) {
        hospitalService.deleteHospital(id);
        return ResponseEntity.ok("Hospital deleted successfully");
    }

    @DeleteMapping("/name/{name}")
    public ResponseEntity<String> deleteHospitalByName(@PathVariable String name) {
        // Note: URLs with spaces will be encoded as %20 by the client,
        // Spring automatically decodes this back to " " for the variable.
        hospitalService.deleteHospitalByName(name);
        return ResponseEntity.ok("Hospital '" + name + "' deleted successfully");
    }
}
