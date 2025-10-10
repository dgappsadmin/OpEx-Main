// package com.company.opexhub.controller;

// import com.company.opexhub.dto.ChatRequest;
// import com.company.opexhub.dto.ChatResponse;
// import com.company.opexhub.service.AIChatService;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
// import org.springframework.web.bind.annotation.*;

// @RestController
// @RequestMapping("/api/chat")
// @CrossOrigin(origins = "*")
// public class ChatController {

//     private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

//     @Autowired
//     private AIChatService aiChatService;

//     @PostMapping("/ask")
//     @PreAuthorize("isAuthenticated()")
//     public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
//         try {
//             logger.info("Received chat request: {}", request.getMessage());

//             if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
//                 return ResponseEntity.badRequest()
//                     .body(new ChatResponse("Please provide a message", false, "Empty message"));
//             }

//             ChatResponse response = aiChatService.processChat(request.getMessage());
//             return ResponseEntity.ok(response);

//         } catch (Exception e) {
//             logger.error("Error in chat endpoint: ", e);
//             return ResponseEntity.internalServerError()
//                 .body(new ChatResponse(
//                     "An error occurred while processing your request",
//                     false,
//                     e.getMessage()
//                 ));
//         }
//     }

//     @GetMapping("/health")
//     public ResponseEntity<String> health() {
//         return ResponseEntity.ok("AI Chat Service is running");
//     }
// }
