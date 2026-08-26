package com.project.aura.Repository;

import com.project.aura.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<Users, Integer> {

    Users findByUsername(String username);

    Optional<Users> findByUserEmail(String userEmail);

    boolean existsByUserEmail(String userEmail);
}
