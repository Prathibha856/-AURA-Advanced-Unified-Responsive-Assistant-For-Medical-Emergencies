package com.project.aura.Service;

import com.project.aura.Entity.UserPrincipal;
import com.project.aura.Entity.Users;
import com.project.aura.Repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


@Service
public class MyUsersDetailsService implements UserDetailsService {

    @Autowired
    private UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String principal) throws UsernameNotFoundException {

        // 1. Try by username first
        Users users = userRepo.findByUsername(principal);

        // 2. Fall back to email if no username match
        if (users == null) {
            users = userRepo.findByUserEmail(principal).orElse(null);
        }

        if (users == null) {
            System.out.println("User not found for principal: " + principal);
            throw new UsernameNotFoundException("User not found: " + principal);
        }

        return new UserPrincipal(users);
    }
}