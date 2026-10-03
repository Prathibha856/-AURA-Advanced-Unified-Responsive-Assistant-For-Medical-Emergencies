package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.DiseaseRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseaseRequirementRepository extends JpaRepository<DiseaseRequirement, Integer> {
    List<DiseaseRequirement> findByDisease_DiseaseId(Integer diseaseId);
}
