package com.project.aura.Controller;

import com.project.aura.DTO.ChatRequestDTO;
import com.project.aura.DTO.ChatResponseDTO;
import com.project.aura.Service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request) {
        return ResponseEntity.ok(chatService.chat(request));
    }
}