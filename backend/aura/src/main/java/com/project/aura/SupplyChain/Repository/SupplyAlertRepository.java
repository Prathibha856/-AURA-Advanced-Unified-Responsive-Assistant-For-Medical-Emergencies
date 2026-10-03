package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.SupplyAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyAlertRepository extends JpaRepository<SupplyAlert, Integer> {

    /**
     * Retrieves all alerts for a given receiving hospital.
     * Used by supply admins to see their pending alerts.
     */
    List<SupplyAlert> findByReceivingHospital_HospitalId(Integer hospitalId);

    /**
     * Retrieves alerts for a specific receiving hospital filtered by status.
     */
    List<SupplyAlert> findByReceivingHospital_HospitalIdAndStatus(
            Integer hospitalId, SupplyAlert.AlertStatus status);

    /**
     * Retrieves all alerts generated from a specific outbreak report.
     */
    List<SupplyAlert> findByOutbreakReport_ReportId(Integer reportId);
}
