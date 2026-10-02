package com.project.aura.DTO;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ChatResponseDTO {

    private String response;
    private boolean isEmergency;
    private List<Map<String, Object>> sources;
}