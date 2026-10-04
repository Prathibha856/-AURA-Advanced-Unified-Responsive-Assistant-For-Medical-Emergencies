package com.project.aura.Service;

import com.project.aura.DTO.HospitalDTO;
import com.project.aura.Entity.Hospital;
import com.project.aura.Entity.Users;
import com.project.aura.Exception.ResourceNotFoundException;
import com.project.aura.Repository.HospitalRepo;
import com.project.aura.Repository.UserRepo;
import jakarta.transaction.Transactional;
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

    @Transactional
    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public HospitalDTO getHospitalById(Integer id) {
        return toDTO(hospitalRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id)));
    }

    /**
     * Returns the hospital managed by the given admin user.
     * Enables HOSPITAL_ADMIN users to look up their hospital using their JWT
     * userId.
     */
    @Transactional
    public HospitalDTO getHospitalByAdminUserId(Integer userId) {
        Hospital hospital = hospitalRepo.findByAdminUser_Userid(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No hospital found for admin user ID: " + userId));
        return toDTO(hospital);
    }

    public HospitalDTO createHospital(HospitalDTO dto) {
        Hospital hospital = Hospital.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .phone(dto.getPhone())
                .build();

        if (dto.getAdminUserId() != null) {
            Users admin = userRepo.findById(dto.getAdminUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + dto.getAdminUserId()));
            hospital.setAdminUser(admin);
        }

        return toDTO(hospitalRepo.save(hospital));
    }

    public HospitalDTO updateHospital(Integer id, HospitalDTO dto) {
        Hospital hospital = hospitalRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id));

        hospital.setName(dto.getName());
        hospital.setAddress(dto.getAddress());
        hospital.setLatitude(dto.getLatitude());
        hospital.setLongitude(dto.getLongitude());
        hospital.setPhone(dto.getPhone());

        if (dto.getAdminUserId() != null) {
            Users admin = userRepo.findById(dto.getAdminUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + dto.getAdminUserId()));
            hospital.setAdminUser(admin);
        }

        return toDTO(hospitalRepo.save(hospital));
    }

    public void deleteHospital(Integer id) {
        if (!hospitalRepo.existsById(id)) {
            throw new ResourceNotFoundException("Hospital not found: " + id);
        }
        hospitalRepo.deleteById(id);
    }

    @Transactional
    public void deleteHospitalByName(String name) {
        if (!hospitalRepo.existsByName(name)) {
            throw new ResourceNotFoundException("Hospital not found: " + name);
        }
        hospitalRepo.deleteByName(name);
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
                .adminUserId(h.getAdminUserId())
                .build();
    }
}