package com.project.aura.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.minidev.json.annotate.JsonIgnore;

import javax.management.relation.Role;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userid;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, unique = true)
    private String userEmail;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    private Role role;

    public enum Role{
        PATIENT,
        HOSPITAL_ADMIN,
        SUPPLY_ADMIN;

    }
//    in DB, the enum roles will in numbers, not in actuall name
//    Why is role showing as 0?
//    In Java, an enum has an implicit position index (called an ordinal):
//    PATIENT = Position 0
//    HOSPITAL_ADMIN = Position 1
//    SUPPLY_ADMIN = Position 2

//    not only this, any enum will store in number respectively how we declared.
//    By default, JPA saves enum fields into the database as integers
//    corresponding to their ordinal index (0, 1, 2) rather than string names ("PATIENT", "HOSPITAL_ADMIN").

    @Override
    public String toString() {
        return "Users{" +
                "userid=" + userid +
                ", username='" + username + '\'' +
                ", userEmail='" + userEmail + '\'' +
                ", password='" + password + '\'' +
                ", role=" + role +
                '}';
    }
}
