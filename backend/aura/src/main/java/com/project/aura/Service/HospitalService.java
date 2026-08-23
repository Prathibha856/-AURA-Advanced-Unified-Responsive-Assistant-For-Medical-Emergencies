package com.project.aura.Service;

import com.project.aura.DTO.HospitalDTO;
import com.project.aura.Entity.Hospital;
import com.project.aura.Entity.Users;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    @Autowired
    private HospitalRepo hospitalRepo;

    @Autowired
    private UserRepo userRepo;

    // ── Public Read Methods (Anyone can view hospitals) ──────────────────────

    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public HospitalDTO getHospitalById(Integer id) {
        return toDTO(hospitalRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id)));
    }

    // ── Secure Write Methods (Admins Only) ───────────────────────────────────

    public HospitalDTO createHospital(HospitalDTO dto, Integer requesterId) {
        // 1. Check if the person requesting this is actually an Admin
        verifyAdminAccess(requesterId);

        Hospital hospital = Hospital.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .phone(dto.getPhone())
                .build();

        // Assign the admin to the hospital
        Users admin = userRepo.findById(requesterId).get(); // We know they exist from verifyAdminAccess
        hospital.setAdminUser(admin);

        return toDTO(hospitalRepo.save(hospital));
    }

    public HospitalDTO updateHospital(Integer hospitalId, HospitalDTO dto, Integer requesterId) {
        // 1. Check if the person requesting this is actually an Admin
        verifyAdminAccess(requesterId);

        Hospital hospital = hospitalRepo.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));

        hospital.setName(dto.getName());
        hospital.setAddress(dto.getAddress());
        hospital.setLatitude(dto.getLatitude());
        hospital.setLongitude(dto.getLongitude());
        hospital.setPhone(dto.getPhone());

        return toDTO(hospitalRepo.save(hospital));
    }

    public void deleteHospital(Integer hospitalId, Integer requesterId) {
        // 1. Check if the person requesting this is actually an Admin
        verifyAdminAccess(requesterId);

        if (!hospitalRepo.existsById(hospitalId)) {
            throw new ResourceNotFoundException("Hospital not found: " + hospitalId);
        }
        hospitalRepo.deleteById(hospitalId);
    }

    // ── Security Helper ────────────────────────────────────────────────────────

    private void verifyAdminAccess(Integer userId) {
        if (userId == null) {
            throw new RuntimeException("Unauthorized: User ID is required");
        }

        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Assuming your enum is named Role and has HOSPITAL_ADMIN
        if (!user.getRole().name().equals("HOSPITAL_ADMIN")) {
            throw new RuntimeException("Access Denied: Only Hospital Admins can perform this action");
        }
    }

    // ── Mapper ──────────────────────────────────────────────────────────────────

    public HospitalDTO toDTO(Hospital h) {
        return HospitalDTO.builder()
                .hospitalId(h.getHospitalId())
                .name(h.getName())
                .address(h.getAddress())
                .latitude(h.getLatitude())
                .longitude(h.getLongitude())
                .phone(h.getPhone())
                .adminUserId(h.getAdminUser() != null ? h.getAdminUser().getUserid() : null)
                .build();
    }
}