package com.project.aura.DTO;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HospitalDTO {

//    private Integer hospitalId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String phone;
    private Integer adminUserId;
}
