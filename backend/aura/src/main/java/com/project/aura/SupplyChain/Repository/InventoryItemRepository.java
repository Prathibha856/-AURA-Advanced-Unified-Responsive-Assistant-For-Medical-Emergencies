package com.project.aura.SupplyChain.Repository;

import com.project.aura.SupplyChain.Entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Integer> {
    Optional<InventoryItem> findByNameIgnoreCase(String name);
}
