package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.SupplyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyRequestRepository extends JpaRepository<SupplyRequest, Integer> {

    List<SupplyRequest> findBySourceHospital_HospitalId(Integer hospitalId);

    List<SupplyRequest> findByDestinationHospital_HospitalId(Integer hospitalId);

    List<SupplyRequest> findBySupplyAlert_AlertId(Integer alertId);
}
