package com.project.aura.SupplyChain.Repository;

import com.project.aura.Entity.Hospital;
import com.project.aura.SupplyChain.Entity.HospitalInventory;
import com.project.aura.SupplyChain.Entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalInventoryRepository extends JpaRepository<HospitalInventory, Integer> {

    List<HospitalInventory> findByHospital(Hospital hospital);

    List<HospitalInventory> findByHospital_HospitalId(Integer hospitalId);

    Optional<HospitalInventory> findByHospitalAndItem(Hospital hospital, InventoryItem item);

    Optional<HospitalInventory> findByHospital_HospitalIdAndItem_ItemId(Integer hospitalId, Integer itemId);
}
