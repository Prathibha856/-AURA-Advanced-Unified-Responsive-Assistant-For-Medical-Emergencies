package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Integer> {

    List<Dispatch> findBySourceHospital_HospitalId(Integer hospitalId);

    List<Dispatch> findByDestinationHospital_HospitalId(Integer hospitalId);

    List<Dispatch> findBySupplyRequest_RequestId(Integer requestId);
}
