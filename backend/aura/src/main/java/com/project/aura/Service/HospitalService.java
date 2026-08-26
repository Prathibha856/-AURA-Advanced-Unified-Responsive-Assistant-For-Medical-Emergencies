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

    public List<HospitalDTO> getAllHospitals() {
        return hospitalRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public HospitalDTO getHospitalById(Integer id) {
        return toDTO(hospitalRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + id)));
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

    // ── Mapper ──────────────────────────────────────────────────────────────────

    public HospitalDTO toDTO(Hospital h) {
        return HospitalDTO.builder()
//                .hospitalId(h.getHospitalId())
                .name(h.getName())
                .address(h.getAddress())
                .latitude(h.getLatitude())
                .longitude(h.getLongitude())
                .phone(h.getPhone())
                .adminUserId(h.getAdminUser() != null ? h.getAdminUser().getUserid() : null)
                .build();
    }
}