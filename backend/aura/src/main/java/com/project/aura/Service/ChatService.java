package com.project.aura.Service;

import com.project.aura.DTO.ChatRequestDTO;
import com.project.aura.DTO.ChatResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ChatService {

    private final RestTemplate restTemplate;

    @Value("${python.ai.url:http://localhost:8000}")
    private String pythonAiUrl;

    public ChatService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public ChatResponseDTO chat(ChatRequestDTO request) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<ChatRequestDTO> entity = new HttpEntity<>(request, headers);

        ResponseEntity<ChatResponseDTO> response =
                restTemplate.exchange(
                        pythonAiUrl + "/chat",
                        HttpMethod.POST,
                        entity,
                        ChatResponseDTO.class
                );

        return response.getBody();
    }
}