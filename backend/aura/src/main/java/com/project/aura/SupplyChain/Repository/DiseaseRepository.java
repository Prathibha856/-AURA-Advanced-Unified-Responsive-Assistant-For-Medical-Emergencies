package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.Disease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Integer> {
    Optional<Disease> findByNameIgnoreCase(String name);
}
