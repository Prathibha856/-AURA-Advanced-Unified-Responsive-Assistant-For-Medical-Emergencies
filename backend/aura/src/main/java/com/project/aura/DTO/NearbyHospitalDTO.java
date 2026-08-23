package com.project.aura.DTO;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NearbyHospitalDTO {

    private Integer hospitalId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String phone;
    private Double distanceKm;
}
