package com.project.aura.Repository;

import com.project.aura.Entity.Hospital;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepo extends JpaRepository<Hospital, Integer> {

    Optional<Hospital> findByAdminUser_Userid(Integer userid);

    /**
     * Finds nearest hospitals using the Haversine formula in PostgreSQL.
     * Sorted ascending by distance from the given coordinates.
     */
    @Query(value = """
            SELECT h.* FROM hospitals h
            WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL
            ORDER BY (
                6371 * acos(
                    cos(radians(:lat)) * cos(radians(h.latitude))
                    * cos(radians(h.longitude) - radians(:lon))
                    + sin(radians(:lat)) * sin(radians(h.latitude))
                )
            )
            LIMIT :limitVal
            """, nativeQuery = true)
    List<Hospital> findNearestHospitals(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("limitVal") int limitVal
    );
}
