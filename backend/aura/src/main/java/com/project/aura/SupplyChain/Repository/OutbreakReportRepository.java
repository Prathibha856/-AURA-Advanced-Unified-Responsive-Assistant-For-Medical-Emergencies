package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.OutbreakReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutbreakReportRepository extends JpaRepository<OutbreakReport, Integer> {

    List<OutbreakReport> findByHospital_HospitalId(Integer hospitalId);

    List<OutbreakReport> findByOutbreakDetectedTrue();
}
