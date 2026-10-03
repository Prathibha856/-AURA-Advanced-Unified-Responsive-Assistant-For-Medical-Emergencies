package com.project.aura.SupplyChain.Repository;

import com.project.aura.Entity.Hospital;
import com.project.aura.SupplyChain.Entity.HospitalConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalConnectionRepository extends JpaRepository<HospitalConnection, Integer> {

    /**
     * Returns all hospitals connected to the given hospital.
     * When hospitalId has an outbreak, these are the hospitals that receive alerts.
     */
    List<HospitalConnection> findByHospital(Hospital hospital);

    List<HospitalConnection> findByHospital_HospitalId(Integer hospitalId);
}
