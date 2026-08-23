package com.project.aura.Repository;

import com.project.aura.Entity.SosAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepo extends JpaRepository<SosAlert, Integer> {

    List<SosAlert> findByUser_UseridOrderByCreatedAtDesc(Integer userid);

    List<SosAlert> findByStatusOrderByCreatedAtDesc(SosAlert.AlertStatus status);

    List<SosAlert> findByHospital_HospitalIdOrderByCreatedAtDesc(Integer hospitalId);
}
