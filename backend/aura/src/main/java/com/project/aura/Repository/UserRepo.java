package com.project.aura.Repository;

import com.project.aura.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface UserRepo extends JpaRepository<Users, Integer>{

    Users findByUsername(String username);

    boolean existsByUserEmail(String userEmail);
}
