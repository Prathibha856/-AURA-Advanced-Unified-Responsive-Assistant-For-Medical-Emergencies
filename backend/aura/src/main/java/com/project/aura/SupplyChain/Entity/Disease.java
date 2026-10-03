package com.project.aura.SupplyChain.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a disease tracked by the AURA supply-chain system.
 * Each disease has a name and a list of required inventory items
 * so the system can determine what supplies are needed during an outbreak.
 */
@Entity
@Table(name = "sc_diseases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Disease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "disease_id")
    private Integer diseaseId;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    /**
     * Items required to handle an outbreak of this disease.
     * Each requirement specifies the item and a suggested quantity.
     */
    @JsonIgnore
    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DiseaseRequirement> requirements = new ArrayList<>();
}
