package com.project.aura.Repository;

import com.project.aura.Entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepo extends JpaRepository<Users, Integer>{

//    used in MyUserDetailsService
    Users findByUsername(String username);


//    used for for Register check
    boolean existsByUserEmail(String userEmail);

   Optional<Users> findByUserEmail(String email);
}
