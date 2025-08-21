package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendResetCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Email is required"));
            }

            boolean result = passwordResetService.sendResetCode(email);
            
            if (result) {
                return ResponseEntity.ok(new ApiResponse<>(true, 
                        "Reset code sent successfully to your email"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Email not found"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Failed to send reset code: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");

            if (email == null || code == null || email.trim().isEmpty() || code.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Email and code are required"));
            }

            boolean isValid = passwordResetService.verifyResetCode(email, code);
            
            if (isValid) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Code verified successfully"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid or expired code"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Code verification failed: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String newPassword = request.get("newPassword");

            if (email == null || code == null || newPassword == null || 
                email.trim().isEmpty() || code.trim().isEmpty() || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Email, code, and new password are required"));
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Password must be at least 6 characters long"));
            }

            boolean result = passwordResetService.resetPassword(email, code, newPassword);
            
            if (result) {
                return ResponseEntity.ok(new ApiResponse<>(true, 
                        "Password reset successfully"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid or expired code"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Password reset failed: " + e.getMessage()));
        }
    }
}